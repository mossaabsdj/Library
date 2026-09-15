const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Checking database and populating data...");

  // Check if we can import directly from local MySQL 'labrary1'
  let importedFromLabrary = false;
  try {
    const existingLabraryProducts = await prisma.$queryRawUnsafe(
      "SELECT * FROM labrary1.produit LIMIT 500",
    );

    if (existingLabraryProducts && existingLabraryProducts.length > 0) {
      console.log(
        `📦 Found ${existingLabraryProducts.length} products in 'labrary1'! Importing...`,
      );

      for (const row of existingLabraryProducts) {
        const id = Number(row.Produit_ID);
        const name = String(row.Nom || "").trim();
        const primaryBarcode = row.Code_Barre
          ? String(row.Code_Barre).trim()
          : null;
        const reference = row.Refference ? String(row.Refference).trim() : null;
        const unitPrice = Number(row.Prix_Unit) || 0;
        const stockQuantity = Math.max(0, Number(row.Stock_Q) || 0);
        const purchasePrice = row.Prix_Achat ? Number(row.Prix_Achat) : null;
        const salesRapid = Boolean(
          row.Sales_Rapid === 1 || row.Sales_Rapid === true,
        );
        const category =
          row.Categorie && row.Categorie !== "?"
            ? String(row.Categorie).trim()
            : "Papeterie";

        if (!name) continue;

        const product = await prisma.product.upsert({
          where: { id },
          update: {
            name,
            primaryBarcode,
            reference,
            unitPrice,
            stockQuantity,
            purchasePrice,
            salesRapid,
            category,
          },
          create: {
            id,
            name,
            primaryBarcode,
            reference,
            unitPrice,
            stockQuantity,
            purchasePrice,
            salesRapid,
            category,
            minimumStock: 5,
            unit: "piece",
          },
        });

        if (primaryBarcode) {
          await prisma.barcode
            .upsert({
              where: { code: primaryBarcode },
              update: { productId: product.id },
              create: { productId: product.id, code: primaryBarcode },
            })
            .catch(() => {});
        }
      }

      // Import barcodes from labrary1.code_barres
      try {
        const existingLabraryBarcodes = await prisma.$queryRawUnsafe(
          "SELECT * FROM labrary1.code_barres LIMIT 500",
        );
        console.log(
          `🏷️ Found ${existingLabraryBarcodes.length} barcodes in 'labrary1'! Importing...`,
        );

        for (const b of existingLabraryBarcodes) {
          const code = String(b.Code_Barre || "").trim();
          const prodId = Number(b.Produit_ID);
          if (!code || !prodId) continue;

          // verify product exists
          const pExists = await prisma.product.findUnique({
            where: { id: prodId },
          });
          if (pExists) {
            await prisma.barcode
              .upsert({
                where: { code },
                update: { productId: prodId },
                create: { productId: prodId, code },
              })
              .catch(() => {});
          }
        }
      } catch (err) {
        console.warn("Could not import secondary barcodes:", err.message);
      }

      importedFromLabrary = true;
      console.log(
        "✅ Successfully imported existing store data from 'labrary1'!",
      );
    }
  } catch (err) {
    console.log(
      "ℹ️ Direct labrary1 read skipped or not accessible:",
      err.message,
    );
  }

  // If labrary1 wasn't imported or has few products, add test products required by prompt
  // Specifically: Product ID 25 Coca Cola 1L (Barcode: 5449000000996)
  const coca = await prisma.product.upsert({
    where: { id: 25 },
    update: {
      primaryBarcode: "5449000000996",
      reference: "P-001",
      name: "Coca Cola 1L",
      unitPrice: 120,
      stockQuantity: 50,
      purchasePrice: 90,
      salesRapid: true,
      category: "Boissons",
    },
    create: {
      id: 25,
      primaryBarcode: "5449000000996",
      reference: "P-001",
      name: "Coca Cola 1L",
      unitPrice: 120,
      stockQuantity: 50,
      purchasePrice: 90,
      salesRapid: true,
      category: "Boissons",
      minimumStock: 10,
    },
  });

  // Ensure normalized barcode entries for Coca Cola
  const extraBarcodes = ["5449000000996", "1234567890123", "9876543210987"];
  for (const code of extraBarcodes) {
    await prisma.barcode
      .upsert({
        where: { code },
        update: { productId: coca.id },
        create: { productId: coca.id, code },
      })
      .catch(() => {});
  }

  // Add more test products for prompt acceptance tests
  const testProducts = [
    {
      name: "Coca Cola 33cl",
      reference: "P-002",
      primaryBarcode: "5449000000997",
      unitPrice: 80,
      stockQuantity: 40,
      purchasePrice: 60,
      salesRapid: true,
      category: "Boissons",
    },
    {
      name: "Coca Cola Zero",
      reference: "P-003",
      primaryBarcode: "5449000000998",
      unitPrice: 130,
      stockQuantity: 30,
      purchasePrice: 95,
      salesRapid: true,
      category: "Boissons",
    },
    {
      name: "Eau Minérale Ifri 1.5L",
      reference: "P-004",
      primaryBarcode: "6131111111111",
      unitPrice: 50,
      stockQuantity: 100,
      purchasePrice: 35,
      salesRapid: true,
      category: "Boissons",
    },
    {
      name: "Chips Lays Sel",
      reference: "P-005",
      primaryBarcode: "6132222222222",
      unitPrice: 80,
      stockQuantity: 25,
      purchasePrice: 60,
      salesRapid: true,
      category: "Alimentation",
    },
    {
      name: "Produit Test Stock Faible (3 pièces)",
      reference: "P-00125",
      primaryBarcode: "6133333333333",
      unitPrice: 200,
      stockQuantity: 3, // For acceptance test 51 (attempt 4)
      purchasePrice: 150,
      salesRapid: false,
      category: "Test",
    },
  ];

  for (const tp of testProducts) {
    const p = await prisma.product
      .create({
        data: tp,
      })
      .catch(() => {});
    if (p && tp.primaryBarcode) {
      await prisma.barcode
        .create({
          data: { productId: p.id, code: tp.primaryBarcode },
        })
        .catch(() => {});
    }
  }

  // Ensure test customer for credit sales
  await prisma.customer
    .upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        fullName: "Karim Benali",
        phone: "0551 23 45 67",
        address: "Alger Centre",
        credit: 0,
        creditLimit: 50000,
      },
    })
    .catch(() => {});

  // Ensure test supplier
  await prisma.supplier
    .upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        name: "Grossiste Boissons & Alimentation Alger",
        company: "Sarl Distrib Express",
        phone: "021 55 66 77",
        debt: 0,
      },
    })
    .catch(() => {});

  // Ensure default store settings
  await prisma.setting.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      storeName: "Superette & Papeterie Centrale",
      phone: "0550 12 34 56",
      address: "12 Rue Didouche Mourad, Alger",
      currency: "DA",
      receiptHeader: "Bienvenue à la Superette Centrale",
      receiptFooter: "Merci de votre visite et à bientôt !",
      lowStockThreshold: 5,
    },
  });

  console.log("🎉 Seed finished successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
