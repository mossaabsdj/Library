import fs from "fs";
import path from "path";
import crypto from "crypto";

export class ImageStorageService {
  private static readonly RELATIVE_UPLOAD_DIR = "uploads/products";
  private static readonly ALLOWED_EXTENSIONS = new Set([
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".gif",
    ".svg",
    ".avif",
  ]);

  private static readonly MIME_MAP: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".avif": "image/avif",
  };

  /**
   * Get the absolute filesystem path to the upload directory
   */
  static getUploadDir(): string {
    return path.join(process.cwd(), "public", this.RELATIVE_UPLOAD_DIR);
  }

  /**
   * Ensure target upload directory exists on disk
   */
  static ensureUploadDir(): string {
    const dir = this.getUploadDir();
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  }

  /**
   * Clean and normalize file extension
   */
  static normalizeExtension(filename: string, mimeType?: string): string {
    let ext = path.extname(filename).toLowerCase().trim();
    if (!ext && mimeType) {
      if (mimeType.includes("jpeg") || mimeType.includes("jpg")) ext = ".jpg";
      else if (mimeType.includes("png")) ext = ".png";
      else if (mimeType.includes("webp")) ext = ".webp";
      else if (mimeType.includes("gif")) ext = ".gif";
      else if (mimeType.includes("svg")) ext = ".svg";
    }

    if (!this.ALLOWED_EXTENSIONS.has(ext)) {
      ext = ".jpg"; // safe default
    }
    return ext;
  }

  /**
   * Generate a unique, collision-proof filename
   * Format: prod_<timestamp>_<randomHex>.<ext>
   */
  static generateUniqueFilename(extension: string): string {
    const timestamp = Date.now();
    const randomHex = crypto.randomBytes(4).toString("hex");
    const cleanExt = extension.startsWith(".") ? extension : `.${extension}`;
    return `prod_${timestamp}_${randomHex}${cleanExt}`;
  }

  /**
   * Save an uploaded file buffer to the uploads directory
   * Returns the relative web path (e.g. /uploads/products/prod_1726398412_a1b2c3d4.png)
   */
  static async saveUploadedFile(
    buffer: Buffer | Uint8Array,
    originalFilename: string,
    mimeType?: string,
  ): Promise<{ filePath: string; fileName: string }> {
    this.ensureUploadDir();

    const ext = this.normalizeExtension(originalFilename, mimeType);
    const fileName = this.generateUniqueFilename(ext);
    const destinationPath = path.join(this.getUploadDir(), fileName);

    await fs.promises.writeFile(destinationPath, Buffer.from(buffer));

    const relativePath = `/${this.RELATIVE_UPLOAD_DIR}/${fileName}`;
    return {
      filePath: relativePath,
      fileName,
    };
  }

  /**
   * Copy a local file to the uploads directory with a unique name
   */
  static async copyLocalFile(
    sourcePath: string,
  ): Promise<{ filePath: string; fileName: string }> {
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Source file does not exist: ${sourcePath}`);
    }

    this.ensureUploadDir();
    const ext = this.normalizeExtension(sourcePath);
    const fileName = this.generateUniqueFilename(ext);
    const destinationPath = path.join(this.getUploadDir(), fileName);

    await fs.promises.copyFile(sourcePath, destinationPath);

    const relativePath = `/${this.RELATIVE_UPLOAD_DIR}/${fileName}`;
    return {
      filePath: relativePath,
      fileName,
    };
  }

  /**
   * Delete an image file from the uploads directory if it is a local upload.
   * Will safely ignore external URLs, Base64 strings, or missing files.
   */
  static async deleteImage(relativePath?: string | null): Promise<boolean> {
    if (!relativePath || typeof relativePath !== "string") return false;

    const trimmed = relativePath.trim();
    // Do not attempt to delete external URLs or Data URIs
    if (
      trimmed.startsWith("http://") ||
      trimmed.startsWith("https://") ||
      trimmed.startsWith("data:") ||
      trimmed.startsWith("blob:")
    ) {
      return false;
    }

    // Extract filename or relative path within uploads
    const cleanPath = trimmed.replace(/\\/g, "/");
    let targetFileName = "";

    if (cleanPath.includes(this.RELATIVE_UPLOAD_DIR)) {
      targetFileName = cleanPath
        .split(this.RELATIVE_UPLOAD_DIR)[1]
        .replace(/^\//, "");
    } else if (cleanPath.startsWith("/uploads/")) {
      targetFileName = cleanPath.replace("/uploads/", "");
    } else {
      // Might be a direct filename or relative path
      targetFileName = path.basename(cleanPath);
    }

    if (!targetFileName || targetFileName.includes("..")) {
      return false; // Security guard against path traversal
    }

    const uploadDir = this.getUploadDir();
    const resolvedPath = path.resolve(uploadDir, targetFileName);

    // Verify resolved path stays strictly within the authorized upload directory
    if (!resolvedPath.startsWith(uploadDir)) {
      console.warn(
        `[ImageStorage] Path traversal attempt blocked: ${resolvedPath}`,
      );
      return false;
    }

    try {
      if (fs.existsSync(resolvedPath)) {
        await fs.promises.unlink(resolvedPath);
        return true;
      }
    } catch (err: any) {
      console.warn(
        `[ImageStorage] Failed to delete file ${resolvedPath}:`,
        err.message,
      );
    }

    return false;
  }

  /**
   * Resolve an uploaded image's disk path safely
   */
  static resolveDiskPath(
    requestedSubPath: string,
  ): { fullPath: string; mimeType: string } | null {
    // Prevent traversal attacks
    const normalized = path
      .normalize(requestedSubPath)
      .replace(/^(\.\.[\/\\])+/, "");
    const baseUploadsDir = path.join(process.cwd(), "public", "uploads");
    const resolvedPath = path.resolve(baseUploadsDir, normalized);

    if (!resolvedPath.startsWith(baseUploadsDir)) {
      return null;
    }

    if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isFile()) {
      const ext = path.extname(resolvedPath).toLowerCase();
      const mimeType = this.MIME_MAP[ext] || "application/octet-stream";
      return { fullPath: resolvedPath, mimeType };
    }

    // Fallback: check project root /uploads if public/uploads not found
    const fallbackBaseDir = path.join(process.cwd(), "uploads");
    const fallbackResolved = path.resolve(fallbackBaseDir, normalized);
    if (
      fallbackResolved.startsWith(fallbackBaseDir) &&
      fs.existsSync(fallbackResolved) &&
      fs.statSync(fallbackResolved).isFile()
    ) {
      const ext = path.extname(fallbackResolved).toLowerCase();
      const mimeType = this.MIME_MAP[ext] || "application/octet-stream";
      return { fullPath: fallbackResolved, mimeType };
    }

    return null;
  }
}
