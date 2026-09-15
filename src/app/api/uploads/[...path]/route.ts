import { NextRequest, NextResponse } from "next/server";
import { ImageStorageService } from "@/services/imageStorageService";
import fs from "fs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path: pathSegments } = await params;
    if (!pathSegments || pathSegments.length === 0) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const subPath = pathSegments.join("/");
    const resolved = ImageStorageService.resolveDiskPath(subPath);

    if (!resolved) {
      return new NextResponse("Image Not Found", { status: 404 });
    }

    const fileBuffer = await fs.promises.readFile(resolved.fullPath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": resolved.mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: any) {
    console.error("[Uploads Serve Error]:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
