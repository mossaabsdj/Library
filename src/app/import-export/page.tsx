"use client";

import React, { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useI18n } from "@/contexts/I18nContext";
import { useLoading } from "@/contexts/LoadingContext";
import { playBeep } from "@/lib/utils";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import {
  FileSpreadsheet,
  Upload,
  Download,
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FileCheck,
} from "lucide-react";

export default function ImportExportPage() {
  const { t } = useI18n();
  const { withLoading } = useLoading();

  const [importType, setImportType] = useState<"product" | "barcode">(
    "product",
  );
  const [fileData, setFileData] = useState<any[] | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [preview, setPreview] = useState<any | null>(null);
  const [conflictStrategy, setConflictStrategy] = useState<
    "skip" | "update" | "create"
  >("update");
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState<any | null>(null);

  // Direct labrary1 DB migration state
  const [dbMigrating, setDbMigrating] = useState(false);
  const [dbMigrateResult, setDbMigrateResult] = useState<any | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setPreview(null);
    setImportResult(null);
    setLoading(true);

    const isCsv = file.name.endsWith(".csv");

    if (isCsv) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          setFileData(results.data);
          await requestPreview(results.data, importType);
          setLoading(false);
        },
        error: (err) => {
          alert(`Erreur CSV: ${err.message}`);
          setLoading(false);
        },
      });
    } else {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: "binary" });
          const firstSheetName = wb.SheetNames[0];
          const ws = wb.Sheets[firstSheetName];
          const data = XLSX.utils.sheet_to_json(ws);
          setFileData(data);
          await requestPreview(data, importType);
        } catch (err: any) {
          alert(`Erreur Excel: ${err.message}`);
        } finally {
          setLoading(false);
        }
      };
      reader.readAsBinaryString(file);
    }
  };

  const requestPreview = async (rows: any[], type: string) => {
    try {
      const res = await fetch("/api/import/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, rows }),
      });
      if (res.ok) {
        const p = await res.json();
        setPreview(p);
      }
    } catch {
      // preview error
    }
  };

  const handleExecuteImport = async () => {
    if (!fileData || fileData.length === 0) return;

    setLoading(true);
    setImportResult(null);
    try {
      await withLoading(
        async () => {
          const res = await fetch("/api/import/execute", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: importType,
              rows: fileData,
              strategy: conflictStrategy,
            }),
          });

          if (res.ok) {
            const resData = await res.json();
            setImportResult(resData);
            playBeep("success");
          } else {
            const err = await res.json();
            alert(err.error || "Erreur lors de l'importation");
          }
        },
        t(
          "importExport.importSky",
          "Importation et mise à jour du catalogue de produits...",
        ),
      );
    } catch (err: any) {
      playBeep("error");
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDirectDbImport = async () => {
    if (
      !confirm(
        t(
          "importExport.directDbConfirm",
          "Voulez-vous importer directement les données depuis la base de données locale MySQL 'labrary1' ?",
        ),
      )
    )
      return;

    setDbMigrating(true);
    setDbMigrateResult(null);
    try {
      await withLoading(
        async () => {
          const res = await fetch("/api/import/direct-db", { method: "POST" });
          if (res.ok) {
            const data = await res.json();
            setDbMigrateResult(data);
            playBeep("success");
          } else {
            const err = await res.json();
            alert(err.error || "Erreur de migration");
          }
        },
        t(
          "importExport.directDbSky",
          "Migration directe depuis la base locale MySQL labrary1...",
        ),
      );
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDbMigrating(false);
    }
  };

  return (
    <AppLayout
      title={t("importExport.title", "Importation & Exportation des Données")}
    >
      <div className="space-y-6 select-none max-w-5xl pb-12">
        {/* Section 1: Direct 1-Click MySQL labrary1 Import */}
        <div className="p-5 rounded-2xl bg-card text-card-foreground border border-primary/30 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-base text-foreground">
                {t(
                  "importExport.directDbImport",
                  "Import Direct MySQL 'labrary1'",
                )}
              </h3>
            </div>
            <p className="text-xs text-muted-foreground max-w-xl">
              {t(
                "importExport.directDbDesc",
                "Importe instantanément tous les produits (227) et codes-barres (250) depuis votre base locale existante sans passer par un fichier.",
              )}
            </p>
          </div>

          <button
            type="button"
            disabled={dbMigrating}
            onClick={handleDirectDbImport}
            className="h-11 px-5 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground text-xs font-bold flex items-center gap-2 shadow-md shadow-primary/20 transition-all flex-shrink-0 active:scale-[0.98]"
          >
            {dbMigrating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>
                  {t("importExport.migrating", "Migration en cours...")}
                </span>
              </>
            ) : (
              <>
                <Database className="h-4 w-4" />
                <span>
                  {t(
                    "importExport.directDbImport",
                    "Lancer la Migration Directe",
                  )}
                </span>
              </>
            )}
          </button>
        </div>

        {dbMigrateResult && (
          <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 text-xs text-primary space-y-1 animate-in fade-in">
            <div className="font-bold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span>
                {t(
                  "importExport.directMigrationSuccess",
                  "Migration directe terminée avec succès !",
                )}
              </span>
            </div>
            <div>
              {t("product.title", "Produits")} :{" "}
              <strong>{dbMigrateResult.products?.successCount || 0}</strong> •{" "}
              {t("barcode.title", "Codes-barres")} :{" "}
              <strong>{dbMigrateResult.barcodes?.successCount || 0}</strong>
            </div>
          </div>
        )}

        {/* Section 2: File Import (CSV / XLSX) */}
        <div className="p-6 rounded-2xl bg-card text-card-foreground border border-border shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-border pb-3">
            <div>
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                <span>
                  {t(
                    "importExport.fileImportTitle",
                    "Importer depuis un Fichier (CSV / Excel)",
                  )}
                </span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t(
                  "importExport.fileImportDesc",
                  "Compatible avec les formats historiques Produit et Code-barres",
                )}
              </p>
            </div>

            {/* Import Type Selector */}
            <div className="flex items-center gap-1 p-1 bg-muted rounded-xl border border-border">
              <button
                type="button"
                onClick={() => {
                  setImportType("product");
                  setFileData(null);
                  setPreview(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  importType === "product"
                    ? "bg-primary text-primary-foreground shadow"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("importExport.productsTab", "Produits")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setImportType("barcode");
                  setFileData(null);
                  setPreview(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  importType === "barcode"
                    ? "bg-primary text-primary-foreground shadow"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("importExport.barcodesTab", "Codes-barres")}
              </button>
            </div>
          </div>

          {/* Expected Columns Notice */}
          <div className="p-3 rounded-xl bg-muted/60 border border-border text-[11px] text-muted-foreground">
            <span className="font-bold text-foreground">
              {t("importExport.expectedCols", "Colonnes attendues pour")}{" "}
              {importType === "product"
                ? t("importExport.productsTab", "Produits")
                : t("importExport.barcodesTab", "Codes-barres")}{" "}
              :{" "}
            </span>
            {importType === "product" ? (
              <span className="font-mono text-primary font-semibold">
                Produit_ID | Code_Barre | Refference | Nom | Prix_Unit | Stock_Q
                | Prix_Achat | Sales_Rapid | Image | Categorie
              </span>
            ) : (
              <span className="font-mono text-primary font-semibold">
                Code_Barre_ID | Produit_ID | Code_Barre
              </span>
            )}
          </div>

          {/* File dropzone / selector */}
          <div className="border-2 border-dashed border-border hover:border-primary/50 rounded-2xl p-8 text-center bg-muted/30 transition-colors">
            <input
              type="file"
              accept=".csv, .xlsx, .xls"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload-input"
            />
            <label
              htmlFor="file-upload-input"
              className="cursor-pointer flex flex-col items-center gap-3"
            >
              <div className="p-4 rounded-full bg-primary/10 text-primary shadow-sm">
                <FileSpreadsheet className="h-8 w-8" />
              </div>
              <div>
                <span className="text-sm font-bold text-foreground">
                  {fileName
                    ? fileName
                    : t(
                        "importExport.dropzonePrompt",
                        "Cliquez pour sélectionner un fichier CSV ou Excel",
                      )}
                </span>
                <p className="text-xs text-muted-foreground mt-1">
                  {t(
                    "importExport.dropzoneFormats",
                    "Glissez-déposez ou parcourez vos fichiers (.csv, .xlsx, .xls)",
                  )}
                </p>
              </div>
            </label>
          </div>

          {/* Preview Section */}
          {preview && (
            <div className="space-y-4 pt-4 border-t border-border animate-in fade-in">
              <div className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-primary" />
                <h4 className="font-bold text-sm text-foreground">
                  {t(
                    "importExport.previewTitle",
                    "Analyse & Prévisualisation du Fichier",
                  )}
                </h4>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-muted/60 border border-border">
                  <div className="text-xs text-muted-foreground">
                    {t("importExport.totalRows", "Lignes Totales")}
                  </div>
                  <div className="text-lg font-black text-foreground font-mono">
                    {preview.totalRows}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-primary/10 border border-primary/30">
                  <div className="text-xs text-primary font-semibold">
                    {t("importExport.validRows", "Lignes Valides")}
                  </div>
                  <div className="text-lg font-black text-primary font-mono">
                    {preview.validRows}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                    {t("importExport.warnings", "Avertissements")}
                  </div>
                  <div className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono">
                    {preview.warningsCount}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30">
                  <div className="text-xs text-destructive font-semibold">
                    {t("importExport.blockingErrors", "Erreurs Bloquantes")}
                  </div>
                  <div className="text-lg font-black text-destructive font-mono">
                    {preview.errorsCount}
                  </div>
                </div>
              </div>

              {/* Conflict Strategy Selector */}
              <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-2">
                <label className="text-xs font-bold text-foreground block">
                  {t(
                    "importExport.conflictTitle",
                    "Stratégie de Résolution des Conflits :",
                  )}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    {
                      id: "update",
                      label: t(
                        "importExport.strategyUpdateTitle",
                        "Mettre à Jour (Recommandé)",
                      ),
                      desc: t(
                        "importExport.strategyUpdateDesc",
                        "Met à jour le produit existant avec les nouvelles données",
                      ),
                    },
                    {
                      id: "skip",
                      label: t("importExport.strategySkipTitle", "Ignorer"),
                      desc: t(
                        "importExport.strategySkipDesc",
                        "Conserve l'existant et n'importe que les nouveaux éléments",
                      ),
                    },
                    {
                      id: "create",
                      label: t(
                        "importExport.strategyCreateTitle",
                        "Toujours Créer",
                      ),
                      desc: t(
                        "importExport.strategyCreateDesc",
                        "Crée toujours un nouvel ID",
                      ),
                    },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setConflictStrategy(s.id as any)}
                      className={`p-2.5 rounded-xl border text-start transition-all ${
                        conflictStrategy === s.id
                          ? "bg-primary/10 border-primary text-primary font-bold shadow-sm"
                          : "bg-card border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <div className="font-bold text-xs">{s.label}</div>
                      <div className="text-[10px] opacity-80 mt-0.5">
                        {s.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Errors list if any */}
              {preview.errors.length > 0 && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-xs text-destructive space-y-1 max-h-36 overflow-y-auto">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4" />
                    <span>
                      {t(
                        "importExport.blockingErrorsDetails",
                        "Détails des erreurs bloquantes :",
                      )}
                    </span>
                  </div>
                  {preview.errors.map((err: any, idx: number) => (
                    <div key={idx} className="font-mono text-[11px]">
                      Ligne {err.row} : {err.message}
                    </div>
                  ))}
                </div>
              )}

              {/* Execute Button */}
              <button
                type="button"
                disabled={loading || preview.validRows === 0}
                onClick={handleExecuteImport}
                className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-40 text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-colors"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5" />
                    <span>
                      {t("importExport.startImport", "Lancer l'Importation")} (
                      {preview.validRows})
                    </span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Import Result Notification */}
          {importResult && (
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 text-xs text-primary space-y-1 animate-in fade-in">
              <div className="font-bold text-sm flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                <span>
                  {t(
                    "importExport.importSuccess",
                    "Importation terminée avec succès !",
                  )}
                </span>
              </div>
              <div className="font-mono pt-1">
                Succès : <strong>{importResult.successCount}</strong> • Ignorés
                : <strong>{importResult.skippedCount}</strong> • Échecs :{" "}
                <strong>{importResult.failedCount}</strong>
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Compatibility Export */}
        <div className="p-6 rounded-2xl bg-card text-card-foreground border border-border shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              <span>
                {t(
                  "importExport.exportTitle",
                  "Exporter les Données (Format Historique Garanti)",
                )}
              </span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t(
                "importExport.exportDesc",
                "Téléchargez vos données actuelles selon la structure originale exacte",
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-2">
              <div className="font-bold text-sm text-foreground">
                {t("importExport.exportProductsTitle", "Export Produits")}
              </div>
              <div className="text-xs text-muted-foreground font-mono text-[10px]">
                Produit_ID | Code_Barre | Refference | Nom | Prix_Unit | Stock_Q
                | Prix_Achat | Sales_Rapid | Image | Categorie
              </div>
              <div className="pt-2">
                <a
                  href="/api/export/products?format=csv"
                  download
                  className="h-10 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold inline-flex items-center gap-2 transition-colors shadow-sm"
                >
                  <Download className="h-4 w-4" />
                  <span>
                    {t(
                      "importExport.downloadCsvProducts",
                      "Télécharger CSV Produits",
                    )}
                  </span>
                </a>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-2">
              <div className="font-bold text-sm text-foreground">
                {t("importExport.exportBarcodesTitle", "Export Codes-barres")}
              </div>
              <div className="text-xs text-muted-foreground font-mono text-[10px]">
                Code_Barre_ID | Produit_ID | Code_Barre
              </div>
              <div className="pt-2">
                <a
                  href="/api/export/barcodes?format=csv"
                  download
                  className="h-10 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold inline-flex items-center gap-2 transition-colors shadow-sm"
                >
                  <Download className="h-4 w-4" />
                  <span>
                    {t(
                      "importExport.downloadCsvBarcodes",
                      "Télécharger CSV Codes-barres",
                    )}
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
