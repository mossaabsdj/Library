const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function runTests() {
  console.log("==================================================");
  console.log("🧪 TESTING SALES MANAGEMENT MODULE & SERVICES");
  console.log("==================================================");

  let testCustomer = null;
  let testCustomer2 = null;
  let testProduct = null;
  let testSale = null;

  try {
    // Setup test customer
    testCustomer = await prisma.customer.create({
      data: {
        fullName: `Test Client Sales ${Date.now()}`,
        phone: `0555${Math.floor(100000 + Math.random() * 900000)}`,
        credit: 0,
      },
    });

    testCustomer2 = await prisma.customer.create({
      data: {
        fullName: `Test Client Two ${Date.now()}`,
        phone: `0666${Math.floor(100000 + Math.random() * 900000)}`,
        credit: 0,
      },
    });

    // Setup test product
    testProduct = await prisma.product.create({
      data: {
        name: `Produit Test Module Sales ${Date.now()}`,
        primaryBarcode: `BAR-${Date.now()}`,
        unitPrice: 1500,
        stockQuantity: 50,
      },
    });

    // ----------------------------------------------------
    // TEST 1: Create Sale with Credit Balance
    // ----------------------------------------------------
    console.log("\n--- TEST 1: Create Sale Record with Credit ---");
    const invoiceNum = `VNT-TEST-${Date.now()}`;
    testSale = await prisma.sale.create({
      data: {
        invoiceNumber: invoiceNum,
        totalAmount: 3000,
        discountAmount: 0,
        taxAmount: 0,
        finalAmount: 3000,
        paidAmount: 1000,
        remainingAmount: 2000, // 2000 debt
        paymentMethod: "CREDIT",
        status: "COMPLETED",
        customerId: testCustomer.id,
        cashierName: "AdminTest",
        notes: "Note test pour le module de vente",
        items: {
          create: [
            {
              productId: testProduct.id,
              unitPrice: 1500,
              purchasePrice: 1000,
              quantity: 2,
              discount: 0,
              subtotal: 3000,
            },
          ],
        },
      },
      include: {
        items: { include: { product: true } },
        customer: true,
        payments: true,
      },
    });

    // Update customer debt to match
    await prisma.customer.update({
      where: { id: testCustomer.id },
      data: { credit: 2000 },
    });

    if (!testSale || testSale.invoiceNumber !== invoiceNum) {
      throw new Error("Failed to create test sale");
    }
    console.log(
      `  ✓ Created test sale: ${testSale.invoiceNumber} (Total: 3000, Paid: 1000, Reste: 2000)`,
    );
    console.log("✅ TEST 1 PASSED: Sale record created successfully.");

    // ----------------------------------------------------
    // TEST 2: Query Sales with Multi-criteria Filter & Search
    // ----------------------------------------------------
    console.log("\n--- TEST 2: Query Sales with Search & Aggregates ---");
    // Search by invoice number
    const searchRes = await prisma.sale.findMany({
      where: {
        OR: [
          { invoiceNumber: { contains: invoiceNum } },
          { cashierName: { contains: "AdminTest" } },
        ],
      },
      include: { items: true, customer: true },
    });

    if (searchRes.length === 0) {
      throw new Error(`Sale with invoice '${invoiceNum}' not found in search`);
    }
    console.log(
      `  ✓ Found sale by invoiceNumber search: ${searchRes[0].invoiceNumber}`,
    );

    // Aggregate calculations
    const aggregates = await prisma.sale.aggregate({
      where: { id: testSale.id },
      _sum: {
        finalAmount: true,
        paidAmount: true,
        remainingAmount: true,
      },
      _count: { id: true },
    });

    if (
      Number(aggregates._sum.finalAmount) !== 3000 ||
      Number(aggregates._sum.paidAmount) !== 1000 ||
      Number(aggregates._sum.remainingAmount) !== 2000
    ) {
      throw new Error(`Aggregates mismatch: ${JSON.stringify(aggregates)}`);
    }
    console.log(
      `  ✓ Aggregates calculated accurately: Revenue=3000, Paid=1000, Remaining=2000`,
    );
    console.log("✅ TEST 2 PASSED: Search and database aggregation working.");

    // ----------------------------------------------------
    // TEST 3: Get Sale by ID with Relations
    // ----------------------------------------------------
    console.log("\n--- TEST 3: Get Sale Details by ID ---");
    const detailed = await prisma.sale.findUnique({
      where: { id: testSale.id },
      include: {
        items: { include: { product: true } },
        customer: true,
        payments: true,
      },
    });

    if (!detailed || detailed.items.length !== 1 || !detailed.customer) {
      throw new Error("Failed to load full sale details with relations");
    }
    console.log(
      `  ✓ Loaded sale details: ${detailed.items[0].product.name}, Client: ${detailed.customer.fullName}`,
    );
    console.log(
      "✅ TEST 3 PASSED: Sale details loaded with complete itemized relations.",
    );

    // ----------------------------------------------------
    // TEST 4: Update Sale & Customer Debt Re-allocation
    // ----------------------------------------------------
    console.log("\n--- TEST 4: Update Sale & Debt Re-allocation ---");
    // Re-assign sale from testCustomer to testCustomer2
    const remaining = Number(detailed.remainingAmount); // 2000
    await prisma.$transaction(async (tx) => {
      // Transfer credit balance
      await tx.customer.update({
        where: { id: testCustomer.id },
        data: { credit: { decrement: remaining } },
      });
      await tx.customer.update({
        where: { id: testCustomer2.id },
        data: { credit: { increment: remaining } },
      });
      await tx.sale.update({
        where: { id: testSale.id },
        data: {
          customerId: testCustomer2.id,
          notes: "Notes modifiées avec succès",
        },
      });
    });

    const cust1After = await prisma.customer.findUnique({
      where: { id: testCustomer.id },
    });
    const cust2After = await prisma.customer.findUnique({
      where: { id: testCustomer2.id },
    });
    const saleAfter = await prisma.sale.findUnique({
      where: { id: testSale.id },
    });

    if (Number(cust1After.credit) !== 0) {
      throw new Error(
        `Expected cust1 credit to be 0, got ${cust1After.credit}`,
      );
    }
    if (Number(cust2After.credit) !== 2000) {
      throw new Error(
        `Expected cust2 credit to be 2000, got ${cust2After.credit}`,
      );
    }
    if (saleAfter.notes !== "Notes modifiées avec succès") {
      throw new Error("Sale notes were not updated");
    }
    console.log(
      `  ✓ Debt transferred atomically: Client 1 debt = ${cust1After.credit}, Client 2 debt = ${cust2After.credit}`,
    );
    console.log(`  ✓ Sale notes updated: "${saleAfter.notes}"`);
    console.log(
      "✅ TEST 4 PASSED: Sale update and debt balance re-allocation verified.",
    );

    // ----------------------------------------------------
    // TEST 5: Direct Payment to Settle Remaining Debt
    // ----------------------------------------------------
    console.log("\n--- TEST 5: Record Direct Sale Payment ---");
    const paymentAmount = 1500;
    await prisma.$transaction(async (tx) => {
      // Record payment
      await tx.payment.create({
        data: {
          type: "SALE_PAYMENT",
          amount: paymentAmount,
          paymentMethod: "CASH",
          saleId: testSale.id,
          customerId: testCustomer2.id,
          notes: "Règlement partiel test",
        },
      });
      // Decrement customer debt
      await tx.customer.update({
        where: { id: testCustomer2.id },
        data: { credit: { decrement: paymentAmount } },
      });
      // Update sale paid and remaining
      await tx.sale.update({
        where: { id: testSale.id },
        data: {
          paidAmount: { increment: paymentAmount },
          remainingAmount: { decrement: paymentAmount },
        },
      });
    });

    const cust2Final = await prisma.customer.findUnique({
      where: { id: testCustomer2.id },
    });
    const saleFinal = await prisma.sale.findUnique({
      where: { id: testSale.id },
    });

    if (Number(cust2Final.credit) !== 500) {
      throw new Error(
        `Expected cust2 credit to be 500, got ${cust2Final.credit}`,
      );
    }
    if (Number(saleFinal.paidAmount) !== 2500) {
      throw new Error(
        `Expected sale paidAmount to be 2500, got ${saleFinal.paidAmount}`,
      );
    }
    if (Number(saleFinal.remainingAmount) !== 500) {
      throw new Error(
        `Expected sale remainingAmount to be 500, got ${saleFinal.remainingAmount}`,
      );
    }

    console.log(
      `  ✓ Payment of 1500 recorded: New paid = ${saleFinal.paidAmount}, Remaining = ${saleFinal.remainingAmount}`,
    );
    console.log(
      `  ✓ Customer remaining credit updated to: ${cust2Final.credit}`,
    );
    console.log("✅ TEST 5 PASSED: Direct payment settlement verified.");

    console.log("\n==================================================");
    console.log("🎉 ALL SALES MODULE TESTS PASSED SUCCESSFULLY (5/5)");
    console.log("==================================================");
    process.exit(0);
  } catch (err) {
    console.error("\n❌ SALES MODULE TEST FAILED:", err);
    process.exit(1);
  } finally {
    // Cleanup test data
    if (testSale) {
      try {
        await prisma.saleItem.deleteMany({ where: { saleId: testSale.id } });
        await prisma.payment.deleteMany({ where: { saleId: testSale.id } });
        await prisma.sale.delete({ where: { id: testSale.id } });
      } catch {}
    }
    if (testProduct) {
      try {
        await prisma.barcode.deleteMany({
          where: { productId: testProduct.id },
        });
        await prisma.product.delete({ where: { id: testProduct.id } });
      } catch {}
    }
    if (testCustomer) {
      try {
        await prisma.customer.delete({ where: { id: testCustomer.id } });
      } catch {}
    }
    if (testCustomer2) {
      try {
        await prisma.customer.delete({ where: { id: testCustomer2.id } });
      } catch {}
    }
    await prisma.$disconnect();
  }
}

runTests();
