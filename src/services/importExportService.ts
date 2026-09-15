import { prisma } from "@/lib/prisma";
import { MovementType } from "@prisma/client";
import * as XLSX from "xlsx";

export interface ProductImportRow {
  Produit_ID?: number | string;
  Code_Barre?: string | null;
  Refference?: string | null;
  Nom?: string;
  Prix_Unit?: number | string;
  Stock_Q?: number | string;
  Prix_Achat?: number | string | null;
  Sales_Rapid?: boolean | number | string;
  Image?: string | null;
  Categorie?: string | null;
  [key: string]: any;
}

export interface BarcodeImportRow {
  Code_Barre_ID?: number | string;
  Produit_ID?: number | string;
  Code_Barre?: string;
  [key: string]: any;
}

export interface ImportPreviewResult {
  totalRows: number;
  validRows: number;
  warningsCount: number;
  errorsCount: number;
  warnings: { row: number; message: string }[];
  errors: { row: number; message: string }[];
  sampleData: any[];
}

export class ImportExportService {
  /**
   * Normalize column keys from CSV/Excel
   */
  private static normalizeProductRow(row: any): ProductImportRow {
    const normalized: ProductImportRow = {};

    for (const key of Object.keys(row)) {
      const cleanKey = key.trim().toLowerCase();
      const val = row[key];

      if (
        cleanKey === "produit_id" ||
        cleanKey === "id" ||
        cleanKey === "produitid"
      ) {
        normalized.Produit_ID = val;
      } else if (
        cleanKey === "code_barre" ||
        cleanKey === "codebarre" ||
        cleanKey === "barcode"
      ) {
        normalized.Code_Barre = val ? String(val).trim() : null;
      } else if (
        cleanKey === "refference" ||
        cleanKey === "reference" ||
        cleanKey === "ref"
      ) {
        normalized.Refference = val ? String(val).trim() : null;
      } else if (
        cleanKey === "nom" ||
        cleanKey === "name" ||
        cleanKey === "designation"
      ) {
        normalized.Nom = val ? String(val).trim() : "";
      } else if (
        cleanKey === "prix_unit" ||
        cleanKey === "prixunit" ||
        cleanKey === "unitprice" ||
        cleanKey === "prix_vente"
      ) {
        normalized.Prix_Unit = val;
      } else if (
        cleanKey === "stock_q" ||
        cleanKey === "stockq" ||
        cleanKey === "stock" ||
        cleanKey === "quantite"
      ) {
        normalized.Stock_Q = val;
      } else if (
        cleanKey === "prix_achat" ||
        cleanKey === "prixachat" ||
        cleanKey === "purchaseprice"
      ) {
        normalized.Prix_Achat = val;
      } else if (
        cleanKey === "sales_rapid" ||
        cleanKey === "salesrapid" ||
        cleanKey === "venterapide"
      ) {
        normalized.Sales_Rapid = val;
      } else if (cleanKey === "image" || cleanKey === "photo") {
        normalized.Image = val ? String(val).trim() : null;
      } else if (cleanKey === "categorie" || cleanKey === "category") {
        normalized.Categorie = val ? String(val).trim() : null;
      }
    }

    return normalized;
  }

  /**
   * Normalize barcode row from CSV/Excel
   */
  private static normalizeBarcodeRow(row: any): BarcodeImportRow {
    const normalized: BarcodeImportRow = {};

    for (const key of Object.keys(row)) {
      const cleanKey = key.trim().toLowerCase();
      const val = row[key];

      if (
        cleanKey === "code_barre_id" ||
        cleanKey === "id" ||
        cleanKey === "codebarreid"
      ) {
        normalized.Code_Barre_ID = val;
      } else if (
        cleanKey === "produit_id" ||
        cleanKey === "produitid" ||
        cleanKey === "productid"
      ) {
        normalized.Produit_ID = val;
      } else if (
        cleanKey === "code_barre" ||
        cleanKey === "code" ||
        cleanKey === "barcode"
      ) {
        normalized.Code_Barre = val ? String(val).trim() : "";
      }
    }

    return normalized;
  }

  /**
   * Preview Product Import with detailed validation
   */
  static async previewProductImport(
    rawRows: any[],
  ): Promise<ImportPreviewResult> {
    const warnings: { row: number; message: string }[] = [];
    const errors: { row: number; message: string }[] = [];
    let validCount = 0;

    const seenIds = new Set<number>();
    const seenBarcodes = new Set<string>();

    // Load existing IDs and barcodes for duplicate checking
    const existingProducts = await prisma.product.findMany({
      select: { id: true, primaryBarcode: true },
    });
    const existingBarcodes = await prisma.barcode.findMany({
      select: { code: true },
    });

    const dbIdSet = new Set(existingProducts.map((p) => p.id));
    const dbBarcodeSet = new Set(existingBarcodes.map((b) => b.code));

    for (let i = 0; i < rawRows.length; i++) {
      const rowIdx = i + 1;
      const row = this.normalizeProductRow(rawRows[i]);

      if (!row.Nom || row.Nom.trim().length === 0) {
        errors.push({
          row: rowIdx,
          message: "Nom de produit obligatoire manquant.",
        });
        continue;
      }

      const unitPrice = Number(row.Prix_Unit);
      if (isNaN(unitPrice) || unitPrice < 0) {
        errors.push({
          row: rowIdx,
          message: `Prix_Unit invalide: '${row.Prix_Unit}'`,
        });
        continue;
      }

      const stockQ = Number(row.Stock_Q ?? 0);
      if (isNaN(stockQ)) {
        errors.push({
          row: rowIdx,
          message: `Stock_Q invalide: '${row.Stock_Q}'`,
        });
        continue;
      }

      if (
        row.Produit_ID !== undefined &&
        row.Produit_ID !== null &&
        row.Produit_ID !== ""
      ) {
        const idNum = Number(row.Produit_ID);
        if (seenIds.has(idNum)) {
          warnings.push({
            row: rowIdx,
            message: `Produit_ID ${idNum} apparaît plusieurs fois dans le fichier.`,
          });
        } else {
          seenIds.add(idNum);
        }

        if (dbIdSet.has(idNum)) {
          warnings.push({
            row: rowIdx,
            message: `Produit_ID ${idNum} existe déjà dans la base de données.`,
          });
        }
      }

      if (row.Code_Barre && row.Code_Barre.trim()) {
        const code = row.Code_Barre.trim();
        if (seenBarcodes.has(code)) {
          warnings.push({
            row: rowIdx,
            message: `Code_Barre '${code}' en double dans ce fichier.`,
          });
        } else {
          seenBarcodes.add(code);
        }

        if (dbBarcodeSet.has(code)) {
          warnings.push({
            row: rowIdx,
            message: `Code_Barre '${code}' existe déjà dans la base de données.`,
          });
        }
      }

      validCount++;
    }

    return {
      totalRows: rawRows.length,
      validRows: validCount,
      warningsCount: warnings.length,
      errorsCount: errors.length,
      warnings: warnings.slice(0, 50),
      errors: errors.slice(0, 50),
      sampleData: rawRows.slice(0, 5).map(this.normalizeProductRow),
    };
  }

  /**
   * Execute Product Import
   */
  static async executeProductImport(
    rawRows: any[],
    strategy: "skip" | "update" | "create" = "update",
  ) {
    let successCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < rawRows.length; i++) {
      const row = this.normalizeProductRow(rawRows[i]);
      if (!row.Nom || row.Nom.trim().length === 0) {
        failedCount++;
        continue;
      }

      try {
        await prisma.$transaction(async (tx) => {
          const idNum = row.Produit_ID ? Number(row.Produit_ID) : undefined;
          const barcode = row.Code_Barre ? String(row.Code_Barre).trim() : null;
          const reference = row.Refference
            ? String(row.Refference).trim()
            : null;
          const unitPrice = Number(row.Prix_Unit) || 0;
          const stockQ = Number(row.Stock_Q) || 0;
          const purchasePrice =
            row.Prix_Achat !== undefined && row.Prix_Achat !== null
              ? Number(row.Prix_Achat)
              : null;
          const salesRapid = Boolean(
            row.Sales_Rapid === true ||
            row.Sales_Rapid === 1 ||
            row.Sales_Rapid === "1" ||
            row.Sales_Rapid === "true",
          );
          const image = row.Image ? String(row.Image).trim() : null;
          const category = row.Categorie ? String(row.Categorie).trim() : null;

          let existingProduct: any = null;
          if (idNum) {
            existingProduct = await tx.product.findUnique({
              where: { id: idNum },
            });
          }
          if (!existingProduct && barcode) {
            existingProduct = await tx.product.findUnique({
              where: { primaryBarcode: barcode },
            });
          }

          if (existingProduct) {
            if (strategy === "skip") {
              skippedCount++;
              return;
            }

            if (strategy === "update") {
              await tx.product.update({
                where: { id: existingProduct.id },
                data: {
                  name: row.Nom!,
                  reference,
                  unitPrice,
                  stockQuantity: stockQ,
                  purchasePrice,
                  salesRapid,
                  image,
                  category,
                },
              });

              if (barcode) {
                await tx.barcode.upsert({
                  where: { code: barcode },
                  update: { productId: existingProduct.id },
                  create: { productId: existingProduct.id, code: barcode },
                });
              }

              successCount++;
              return;
            }
          }

          // Create new Product
          const createData: any = {
            name: row.Nom!,
            reference,
            unitPrice,
            stockQuantity: stockQ,
            purchasePrice,
            salesRapid,
            image,
            category,
          };

          // If strategy is create or explicit ID is supplied and not existing
          if (idNum && !existingProduct && strategy !== "create") {
            createData.id = idNum;
          }

          if (barcode) {
            // Check if barcode already exists on any other product
            const existingBarcode = await tx.barcode.findUnique({
              where: { code: barcode },
            });
            if (!existingBarcode) {
              createData.primaryBarcode = barcode;
            }
          }

          const created = await tx.product.create({ data: createData });

          // Create barcode entry if applicable
          if (created.primaryBarcode) {
            await tx.barcode.upsert({
              where: { code: created.primaryBarcode },
              update: { productId: created.id },
              create: { productId: created.id, code: created.primaryBarcode },
            });
          }

          // Initial stock movement
          if (stockQ > 0) {
            await tx.inventoryMovement.create({
              data: {
                productId: created.id,
                quantity: stockQ,
                previousStock: 0,
                newStock: stockQ,
                type: MovementType.INITIAL_STOCK,
                reference: "DATA-IMPORT",
                notes: "Importation initiale de données",
              },
            });
          }

          successCount++;
        });
      } catch (err: any) {
        failedCount++;
        errors.push(`Ligne ${i + 1} ("${row.Nom}"): ${err.message}`);
      }
    }

    return {
      successCount,
      skippedCount,
      failedCount,
      errors: errors.slice(0, 50),
    };
  }

  /**
   * Preview Barcode Import
   */
  static async previewBarcodeImport(
    rawRows: any[],
  ): Promise<ImportPreviewResult> {
    const warnings: { row: number; message: string }[] = [];
    const errors: { row: number; message: string }[] = [];
    let validCount = 0;

    const existingProducts = await prisma.product.findMany({
      select: { id: true },
    });
    const existingBarcodes = await prisma.barcode.findMany({
      select: { code: true },
    });

    const prodIdSet = new Set(existingProducts.map((p) => p.id));
    const barcodeSet = new Set(existingBarcodes.map((b) => b.code));
    const fileBarcodeSet = new Set<string>();

    for (let i = 0; i < rawRows.length; i++) {
      const rowIdx = i + 1;
      const row = this.normalizeBarcodeRow(rawRows[i]);

      if (!row.Produit_ID) {
        errors.push({ row: rowIdx, message: "Produit_ID manquant." });
        continue;
      }
      const prodId = Number(row.Produit_ID);
      if (isNaN(prodId) || !prodIdSet.has(prodId)) {
        errors.push({
          row: rowIdx,
          message: `Produit_ID ${row.Produit_ID} n'existe pas dans les produits.`,
        });
        continue;
      }

      if (!row.Code_Barre || !row.Code_Barre.trim()) {
        errors.push({ row: rowIdx, message: "Code_Barre vide." });
        continue;
      }

      const code = row.Code_Barre.trim();
      if (fileBarcodeSet.has(code)) {
        warnings.push({
          row: rowIdx,
          message: `Code_Barre '${code}' en double dans le fichier.`,
        });
      } else {
        fileBarcodeSet.add(code);
      }

      if (barcodeSet.has(code)) {
        warnings.push({
          row: rowIdx,
          message: `Code_Barre '${code}' existe déjà dans la base de données.`,
        });
      }

      validCount++;
    }

    return {
      totalRows: rawRows.length,
      validRows: validCount,
      warningsCount: warnings.length,
      errorsCount: errors.length,
      warnings: warnings.slice(0, 50),
      errors: errors.slice(0, 50),
      sampleData: rawRows.slice(0, 5).map(this.normalizeBarcodeRow),
    };
  }

  /**
   * Execute Barcode Import
   */
  static async executeBarcodeImport(
    rawRows: any[],
    strategy: "skip" | "update" = "skip",
  ) {
    let successCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < rawRows.length; i++) {
      const row = this.normalizeBarcodeRow(rawRows[i]);
      if (!row.Produit_ID || !row.Code_Barre) {
        failedCount++;
        continue;
      }

      const prodId = Number(row.Produit_ID);
      const code = row.Code_Barre.trim();

      try {
        const existing = await prisma.barcode.findUnique({ where: { code } });
        if (existing) {
          if (strategy === "skip") {
            skippedCount++;
            continue;
          }
          await prisma.barcode.update({
            where: { code },
            data: { productId: prodId },
          });
          successCount++;
        } else {
          await prisma.barcode.create({
            data: {
              productId: prodId,
              code,
            },
          });
          successCount++;
        }
      } catch (err: any) {
        failedCount++;
        errors.push(`Ligne ${i + 1} (${code}): ${err.message}`);
      }
    }

    return {
      successCount,
      skippedCount,
      failedCount,
      errors: errors.slice(0, 50),
    };
  }

  /**
   * Direct 1-click migration from local MySQL 'labrary1' database!
   */
  static async importFromLabrary1Database() {
    // Queries directly from labrary1.produit and labrary1.code_barres
    const productsFromLabrary: any[] = await prisma.$queryRawUnsafe(
      "SELECT * FROM labrary1.produit",
    );

    const productImportResult = await this.executeProductImport(
      productsFromLabrary,
      "update",
    );

    let barcodeImportResult = {
      successCount: 0,
      skippedCount: 0,
      failedCount: 0,
      errors: [] as string[],
    };
    try {
      const barcodesFromLabrary: any[] = await prisma.$queryRawUnsafe(
        "SELECT * FROM labrary1.code_barres",
      );
      barcodeImportResult = await this.executeBarcodeImport(
        barcodesFromLabrary,
        "skip",
      );
    } catch {
      // Ignored if table empty
    }

    return {
      products: productImportResult,
      barcodes: barcodeImportResult,
    };
  }

  /**
   * Compatibility Export for Products matching exact required headers:
   * Produit_ID | Code_Barre | Refference | Nom | Prix_Unit | Stock_Q | Prix_Achat | Sales_Rapid | Image | Categorie
   */
  static async exportProductsData() {
    const products = await prisma.product.findMany({
      orderBy: { id: "asc" },
    });

    return products.map((p) => ({
      Produit_ID: p.id,
      Code_Barre: p.primaryBarcode || "",
      Refference: p.reference || "",
      Nom: p.name,
      Prix_Unit: Number(p.unitPrice),
      Stock_Q: p.stockQuantity,
      Prix_Achat: p.purchasePrice !== null ? Number(p.purchasePrice) : "",
      Sales_Rapid: p.salesRapid ? 1 : 0,
      Image: p.image || "",
      Categorie: p.category || "",
    }));
  }

  /**
   * Compatibility Export for Barcodes matching exact required headers:
   * Code_Barre_ID | Produit_ID | Code_Barre
   */
  static async exportBarcodesData() {
    const barcodes = await prisma.barcode.findMany({
      orderBy: { id: "asc" },
    });

    return barcodes.map((b) => ({
      Code_Barre_ID: b.id,
      Produit_ID: b.productId,
      Code_Barre: b.code,
    }));
  }
}
