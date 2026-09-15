const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function testNegativeStock() {
  console.log("==================================================");
  console.log("🧪 TESTING ALLOW NEGATIVE STOCK (البيع بالسالب)");
  console.log("==================================================");

  // 1. Get or create a test product with 0 stock
  let zeroStockProd = await prisma.product.findFirst({
    where: { reference: "TEST-ZERO-STOCK" },
  });

  if (!zeroStockProd) {
    zeroStockProd = await prisma.product.create({
      data: {
        name: "Produit Test Stock Zero",
        reference: "TEST-ZERO-STOCK",
        primaryBarcode: "999000111222",
        unitPrice: 100,
        purchasePrice: 70,
        stockQuantity: 0,
        category: "Test",
      },
    });
  } else {
    // Reset stock to 0 for test
    await prisma.product.update({
      where: { id: zeroStockProd.id },
      data: { stockQuantity: 0 },
    });
    zeroStockProd.stockQuantity = 0;
  }

  console.log(`Initial test product stock: ${zeroStockProd.stockQuantity}`);

  // Test checkout logic function
  async function simulateCheckout(prodId, qty) {
    return prisma.$transaction(async (tx) => {
      const setting = await tx.setting.findFirst({
        select: { allowNegativeStock: true },
      });
      const isNegativeAllowed = Boolean(setting?.allowNegativeStock);

      const prod = await tx.product.findUnique({
        where: { id: prodId },
        select: { id: true, name: true, stockQuantity: true },
      });

      if (!isNegativeAllowed && prod.stockQuantity < qty) {
        throw new Error(
          `Stock insuffisant pour "${prod.name}". Disponible : ${prod.stockQuantity}, Demandé : ${qty}`,
        );
      }

      const invNum = "TEST-INV-" + Date.now();
      const prevStock = prod.stockQuantity;
      const newStock = prevStock - qty;

      const sale = await tx.sale.create({
        data: {
          invoiceNumber: invNum,
          totalAmount: 100 * qty,
          finalAmount: 100 * qty,
          paidAmount: 100 * qty,
          paymentMethod: "CASH",
          status: "COMPLETED",
          items: {
            create: [
              {
                productId: prod.id,
                unitPrice: 100,
                purchasePrice: 70,
                quantity: qty,
                subtotal: 100 * qty,
              },
            ],
          },
        },
      });

      await tx.product.update({
        where: { id: prod.id },
        data: { stockQuantity: newStock },
      });

      await tx.inventoryMovement.create({
        data: {
          productId: prod.id,
          quantity: qty,
          previousStock: prevStock,
          newStock: newStock,
          type: "SALE",
          reference: invNum,
          notes: "Test sale",
        },
      });

      return { sale, newStock };
    });
  }

  // 2. Scenario A: allowNegativeStock = false
  console.log("\n--- Scenario A: allowNegativeStock = false ---");
  await prisma.setting.upsert({
    where: { id: 1 },
    update: { allowNegativeStock: false },
    create: { id: 1, allowNegativeStock: false },
  });

  let blocked = false;
  try {
    await simulateCheckout(zeroStockProd.id, 2);
  } catch (err) {
    blocked = true;
    console.log(
      `  ✓ Correctly blocked when allowNegativeStock=false: "${err.message}"`,
    );
  }

  if (!blocked) {
    throw new Error(
      "FAILED: Sale should have been blocked when allowNegativeStock=false!",
    );
  }
  console.log(
    "✅ Scenario A PASSED: Overselling guard blocked checkout when disabled.",
  );

  // 3. Scenario B: allowNegativeStock = true
  console.log("\n--- Scenario B: allowNegativeStock = true ---");
  await prisma.setting.update({
    where: { id: 1 },
    data: { allowNegativeStock: true },
  });

  let allowed = false;
  let result = null;
  try {
    result = await simulateCheckout(zeroStockProd.id, 2);
    allowed = true;
    console.log(
      `  ✓ Checkout succeeded with invoice: ${result.sale.invoiceNumber}`,
    );
  } catch (err) {
    console.error(
      "  ❌ Sale failed when allowNegativeStock=true:",
      err.message,
    );
  }

  if (!allowed) {
    throw new Error(
      "FAILED: Sale should have been allowed when allowNegativeStock=true!",
    );
  }

  // Verify stock is now negative (-2)
  const updatedProd = await prisma.product.findUnique({
    where: { id: zeroStockProd.id },
  });
  console.log(
    `  ✓ Product stock after selling 2 units from 0: ${updatedProd.stockQuantity}`,
  );
  if (updatedProd.stockQuantity !== -2) {
    throw new Error(
      `Expected stockQuantity to be -2, but got ${updatedProd.stockQuantity}`,
    );
  }

  // Verify inventory movement
  const movement = await prisma.inventoryMovement.findFirst({
    where: {
      productId: zeroStockProd.id,
      reference: result.sale.invoiceNumber,
    },
  });
  console.log(
    `  ✓ Recorded movement: prev=${movement.previousStock}, new=${movement.newStock}, qty=${movement.quantity}`,
  );
  if (movement.previousStock !== 0 || movement.newStock !== -2) {
    throw new Error("Movement stock numbers mismatch!");
  }

  console.log(
    "✅ Scenario B PASSED: Negative stock sale succeeded and tracked accurately!",
  );

  // Reset setting to false after test
  await prisma.setting.update({
    where: { id: 1 },
    data: { allowNegativeStock: false },
  });

  console.log("\n==================================================");
  console.log("🎉 ALL NEGATIVE STOCK TESTS PASSED SUCCESSFULLY!");
  console.log("==================================================");
}

testNegativeStock()
  .catch((e) => {
    console.error("TEST FAILED:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
