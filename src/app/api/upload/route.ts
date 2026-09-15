import { NextRequest, NextResponse } from "next/server";
import { ImageStorageService } from "@/services/imageStorageService";

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";

    // 1. Multipart Form Data (standard file upload from browser/Electron)
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = (formData.get("file") ||
        formData.get("image")) as File | null;

      if (!file) {
        return NextResponse.json(
          { error: "No image file provided in form data" },
          { status: 400 },
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const originalName = file.name || "product.jpg";
      const mimeType = file.type || undefined;

      const result = await ImageStorageService.saveUploadedFile(
        buffer,
        originalName,
        mimeType,
      );

      return NextResponse.json({
        success: true,
        filePath: result.filePath,
        fileName: result.fileName,
      });
    }

    // 2. JSON Payload (e.g. direct local path copy or base64 conversion)
    if (contentType.includes("application/json")) {
      const body = await request.json();

      if (body.sourcePath) {
        const result = await ImageStorageService.copyLocalFile(body.sourcePath);
        return NextResponse.json({
          success: true,
          filePath: result.filePath,
          fileName: result.fileName,
        });
      }

      if (body.base64 && typeof body.base64 === "string") {
        const base64Data = body.base64.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");
        const originalName = body.fileName || "product.png";
        const result = await ImageStorageService.saveUploadedFile(
          buffer,
          originalName,
        );
        return NextResponse.json({
          success: true,
          filePath: result.filePath,
          fileName: result.fileName,
        });
      }
    }

    return NextResponse.json(
      { error: "Unsupported content type or missing file" },
      { status: 400 },
    );
  } catch (error: any) {
    console.error("[Upload API Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get("path");

    if (!filePath) {
      return NextResponse.json(
        { error: "Missing path parameter" },
        { status: 400 },
      );
    }

    const deleted = await ImageStorageService.deleteImage(filePath);
    return NextResponse.json({ success: true, deleted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
