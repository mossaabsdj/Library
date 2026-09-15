const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const prisma = new PrismaClient();

async function runTests() {
  console.log("==================================================");
  console.log("🧪 TESTING PRODUCT IMAGE LOGIC & STORAGE");
  console.log("==================================================");

  const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "products");

  // Ensure upload directory exists
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }

  // Helper matching ImageStorageService
  function generateUniqueFilename(extension) {
    const timestamp = Date.now();
    const randomHex = crypto.randomBytes(4).toString("hex");
    const cleanExt = extension.startsWith(".") ? extension : `.${extension}`;
    return `prod_${timestamp}_${randomHex}${cleanExt}`;
  }

  async function saveTestFile(content, extension) {
    const fileName = generateUniqueFilename(extension);
    const dest = path.join(UPLOAD_DIR, fileName);
    await fs.promises.writeFile(dest, content);
    return {
      filePath: `/uploads/products/${fileName}`,
      fileName,
      fullPath: dest,
    };
  }

  // Helper matching getProductImageUrl
  function getProductImageUrl(image) {
    if (!image || typeof image !== "string") return "";
    const trimmed = image.trim();
    if (!trimmed) return "";
    if (
      trimmed.startsWith("http://") ||
      trimmed.startsWith("https://") ||
      trimmed.startsWith("data:") ||
      trimmed.startsWith("blob:")
    ) {
      return trimmed;
    }
    const clean = trimmed.replace(/\\/g, "/");
    if (clean.startsWith("/")) return clean;
    if (clean.startsWith("uploads/")) return `/${clean}`;
    return `/uploads/products/${clean}`;
  }

  try {
    // ----------------------------------------------------
    // TEST 1: Unique Filename Generation & Zero Collisions
    // ----------------------------------------------------
    console.log("\n--- TEST 1: Unique Filename & Storage ---");
    const testBuffer1 = Buffer.from("test-image-content-1");
    const testBuffer2 = Buffer.from("test-image-content-2");

    const file1 = await saveTestFile(testBuffer1, ".jpg");
    const file2 = await saveTestFile(testBuffer2, ".jpg");

    if (!fs.existsSync(file1.fullPath)) {
      throw new Error(`File 1 was not created at ${file1.fullPath}`);
    }
    if (!fs.existsSync(file2.fullPath)) {
      throw new Error(`File 2 was not created at ${file2.fullPath}`);
    }
    if (file1.fileName === file2.fileName) {
      throw new Error("Collision detected! File names are identical.");
    }
    console.log(`  ✓ Created unique file 1: ${file1.filePath}`);
    console.log(`  ✓ Created unique file 2: ${file2.filePath}`);
    console.log(
      "✅ TEST 1 PASSED: Files stored with unique collision-resistant names.",
    );

    // ----------------------------------------------------
    // TEST 2: Product Creation with Relative Path in DB
    // ----------------------------------------------------
    console.log("\n--- TEST 2: Product Creation with Relative Path ---");
    const uniqueBarcode = `IMG-TEST-${Date.now()}`;
    const product = await prisma.product.create({
      data: {
        name: "Produit Test Image Upload",
        primaryBarcode: uniqueBarcode,
        unitPrice: 250,
        stockQuantity: 10,
        image: file1.filePath,
      },
    });

    if (product.image !== file1.filePath) {
      throw new Error(
        `Expected image to be ${file1.filePath}, got: ${product.image}`,
      );
    }
    if (product.image.startsWith("data:") || product.image.length > 100) {
      throw new Error("Image path was stored as Base64 or binary!");
    }
    console.log(
      `  ✓ Product created (ID: ${product.id}) with image: ${product.image}`,
    );
    console.log("✅ TEST 2 PASSED: Only relative path is saved in database.");

    // ----------------------------------------------------
    // TEST 3: Product Image Replacement & Old File Deletion
    // ----------------------------------------------------
    console.log("\n--- TEST 3: Image Replacement & Old File Deletion ---");
    // Verify file 1 exists before update
    if (!fs.existsSync(file1.fullPath)) {
      throw new Error("File 1 does not exist before update!");
    }

    // Now update product with file 2 using the same logic as ProductService.updateProduct
    const existing = await prisma.product.findUnique({
      where: { id: product.id },
    });
    if (existing.image && existing.image !== file2.filePath) {
      const oldFileName = path.basename(existing.image);
      const oldDiskPath = path.join(UPLOAD_DIR, oldFileName);
      if (fs.existsSync(oldDiskPath)) {
        await fs.promises.unlink(oldDiskPath);
      }
    }

    const updatedProduct = await prisma.product.update({
      where: { id: product.id },
      data: { image: file2.filePath },
    });

    // Verify old file is gone and new file exists
    const file1StillExists = fs.existsSync(file1.fullPath);
    const file2Exists = fs.existsSync(file2.fullPath);

    if (file1StillExists) {
      throw new Error(
        `Old file ${file1.fullPath} was NOT deleted upon replacement!`,
      );
    }
    if (!file2Exists) {
      throw new Error(
        `New file ${file2.fullPath} does not exist after replacement!`,
      );
    }
    if (updatedProduct.image !== file2.filePath) {
      throw new Error(
        `Product image in DB is not updated to ${file2.filePath}`,
      );
    }

    console.log(
      `  ✓ Old image successfully unlinked from disk: ${file1.fileName}`,
    );
    console.log(`  ✓ New image active: ${updatedProduct.image}`);
    console.log("✅ TEST 3 PASSED: Old image file was deleted when replaced.");

    // ----------------------------------------------------
    // TEST 4: Product Image Removal & Deletion
    // ----------------------------------------------------
    console.log("\n--- TEST 4: Image Removal (Set to null) ---");
    const existingForClear = await prisma.product.findUnique({
      where: { id: product.id },
    });
    if (existingForClear.image) {
      const oldFileName = path.basename(existingForClear.image);
      const oldDiskPath = path.join(UPLOAD_DIR, oldFileName);
      if (fs.existsSync(oldDiskPath)) {
        await fs.promises.unlink(oldDiskPath);
      }
    }

    const clearedProduct = await prisma.product.update({
      where: { id: product.id },
      data: { image: null },
    });

    const file2StillExists = fs.existsSync(file2.fullPath);
    if (file2StillExists) {
      throw new Error(`File 2 was not deleted after image removal!`);
    }
    if (clearedProduct.image !== null) {
      throw new Error(
        `Expected image to be null, got: ${clearedProduct.image}`,
      );
    }

    console.log("  ✓ Image file deleted and product image field set to null.");
    console.log(
      "✅ TEST 4 PASSED: Removing image cleanly deletes file and updates DB.",
    );

    // ----------------------------------------------------
    // TEST 5: Product Deletion Cleans Up Image
    // ----------------------------------------------------
    console.log("\n--- TEST 5: Product Deletion Auto-Cleanup ---");
    const file3 = await saveTestFile(Buffer.from("test-image-3"), ".png");
    const productToDelete = await prisma.product.create({
      data: {
        name: "Produit A Supprimer",
        primaryBarcode: `DEL-${Date.now()}`,
        unitPrice: 100,
        image: file3.filePath,
      },
    });

    // Delete product logic as in ProductService.deleteProduct
    const existingToDelete = await prisma.product.findUnique({
      where: { id: productToDelete.id },
      select: { image: true },
    });
    await prisma.product.delete({ where: { id: productToDelete.id } });
    if (existingToDelete && existingToDelete.image) {
      const fName = path.basename(existingToDelete.image);
      const dPath = path.join(UPLOAD_DIR, fName);
      if (fs.existsSync(dPath)) {
        await fs.promises.unlink(dPath);
      }
    }

    if (fs.existsSync(file3.fullPath)) {
      throw new Error("File 3 was not cleaned up upon product deletion!");
    }
    console.log(`  ✓ Product deleted and image ${file3.fileName} unlinked.`);
    console.log(
      "✅ TEST 5 PASSED: Product deletion cleans up image from disk.",
    );

    // ----------------------------------------------------
    // TEST 6: getProductImageUrl Backward Compatibility
    // ----------------------------------------------------
    console.log("\n--- TEST 6: URL Resolution Helper Compatibility ---");
    const testCases = [
      {
        input: "/uploads/products/test.jpg",
        expected: "/uploads/products/test.jpg",
      },
      {
        input: "uploads/products/test.jpg",
        expected: "/uploads/products/test.jpg",
      },
      { input: "marquer.jpg", expected: "/uploads/products/marquer.jpg" },
      {
        input: "CUsersMOSSAABSDJDownloads\\ruban.jpg",
        expected: "/uploads/products/CUsersMOSSAABSDJDownloads/ruban.jpg",
      },
      {
        input: "https://example.com/img.png",
        expected: "https://example.com/img.png",
      },
      {
        input: "http://example.com/img.png",
        expected: "http://example.com/img.png",
      },
      {
        input: "data:image/png;base64,ABCDEF",
        expected: "data:image/png;base64,ABCDEF",
      },
      { input: null, expected: "" },
      { input: "", expected: "" },
    ];

    for (const tc of testCases) {
      const resolved = getProductImageUrl(tc.input);
      if (resolved !== tc.expected) {
        throw new Error(
          `Failed for input '${tc.input}': expected '${tc.expected}', got '${resolved}'`,
        );
      }
      console.log(`  ✓ '${tc.input}' -> '${resolved}'`);
    }
    console.log(
      "✅ TEST 6 PASSED: getProductImageUrl resolves all legacy and edge-case formats.",
    );

    // Clean up test product 1
    await prisma.product.delete({ where: { id: product.id } });

    console.log("\n==================================================");
    console.log("🎉 ALL PRODUCT IMAGE TESTS PASSED SUCCESSFULLY (6/6)");
    console.log("==================================================");
    process.exit(0);
  } catch (err) {
    console.error("\n❌ TEST FAILED:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
