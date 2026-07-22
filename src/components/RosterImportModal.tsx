import { useState, useRef } from "react";
import { toast } from "sonner";
import { actions } from "astro:actions";
import { Button } from "@/components/ui/button";
import type { ValidatedRow } from "@/services/roster-import-service";

interface Props {
  teamId: string;
  onImported: (count: number) => void;
  onClose: () => void;
}

type Step = "upload" | "preview" | "confirming";

export function RosterImportModal({ teamId, onImported, onClose }: Props) {
  const [step, setStep] = useState<Step>("upload");
  const [rows, setRows] = useState<ValidatedRow[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validRows = rows.filter((r) => r.status === "valid");
  const errorRows = rows.filter((r) => r.status === "error");
  const duplicateRows = rows.filter((r) => r.status === "duplicate");

  async function handleFile(file: File) {
    const allowed = [
      "text/csv",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!allowed.includes(file.type) && ext !== "csv" && ext !== "xlsx") {
      toast.error("Only CSV and Excel (.xlsx) files are supported.");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("teamId", teamId);
      formData.append("file", file);

      const { data, error } = await actions.rosterImport.upload(formData);
      if (error) {
        toast.error(error.message ?? "Could not parse the file. Try again.");
        return;
      }
      setRows(data.rows);
      setStep("preview");
    } catch {
      toast.error("Upload failed. Try again.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleConfirm() {
    setStep("confirming");
    try {
      const { data, error } = await actions.rosterImport.confirm({ teamId, rows });
      if (error) {
        toast.error(error.message ?? "Import failed. Try again.");
        setStep("preview");
        return;
      }
      toast.success(
        `${data.imported} player${data.imported !== 1 ? "s" : ""} added to roster.`,
      );
      onImported(data.imported);
      onClose();
    } catch {
      toast.error("Import failed. Try again.");
      setStep("preview");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl border border-(--color-border) bg-(--color-card) shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-(--color-border) shrink-0">
          <h2 className="font-display font-semibold text-(--color-foreground)">
            Import Roster
          </h2>
          <button
            onClick={onClose}
            disabled={step === "confirming"}
            className="text-(--color-muted) hover:text-(--color-foreground) text-xl leading-none cursor-pointer disabled:opacity-40"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">
          {step === "upload" && (
            <div className="p-6">
              <p className="text-sm text-(--color-muted) mb-5">
                Upload a CSV or Excel file. Required columns:{" "}
                <code className="text-xs bg-(--color-muted-bg) px-1 py-0.5 rounded">email</code>,{" "}
                <code className="text-xs bg-(--color-muted-bg) px-1 py-0.5 rounded">name</code>.
                Optional:{" "}
                <code className="text-xs bg-(--color-muted-bg) px-1 py-0.5 rounded">jersey_number</code>,{" "}
                <code className="text-xs bg-(--color-muted-bg) px-1 py-0.5 rounded">date_of_birth</code>,{" "}
                <code className="text-xs bg-(--color-muted-bg) px-1 py-0.5 rounded">phone</code>,{" "}
                <code className="text-xs bg-(--color-muted-bg) px-1 py-0.5 rounded">player_id</code>.
              </p>
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files[0];
                  if (file) handleFile(file);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? "border-(--color-primary) bg-(--color-primary)/5"
                    : "border-(--color-border) hover:border-(--color-primary)/50"
                }`}
              >
                {isUploading ? (
                  <p className="text-sm text-(--color-muted)">Parsing file…</p>
                ) : (
                  <>
                    <div className="text-3xl mb-3">📄</div>
                    <p className="text-sm font-medium text-(--color-foreground) mb-1">
                      Drop your file here
                    </p>
                    <p className="text-xs text-(--color-muted)">
                      or{" "}
                      <span className="text-(--color-primary) underline">browse files</span>
                    </p>
                    <p className="text-xs text-(--color-muted) mt-2">CSV or Excel (.xlsx)</p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                  }}
                />
              </div>
            </div>
          )}

          {(step === "preview" || step === "confirming") && (
            <div>
              {/* Preview table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-(--color-border) bg-(--color-background)">
                      <th className="text-left text-xs font-semibold uppercase tracking-wider text-(--color-muted-fg) px-4 py-3">#</th>
                      <th className="text-left text-xs font-semibold uppercase tracking-wider text-(--color-muted-fg) px-4 py-3">Name</th>
                      <th className="text-left text-xs font-semibold uppercase tracking-wider text-(--color-muted-fg) px-4 py-3">Email</th>
                      <th className="text-left text-xs font-semibold uppercase tracking-wider text-(--color-muted-fg) px-4 py-3">Jersey</th>
                      <th className="text-left text-xs font-semibold uppercase tracking-wider text-(--color-muted-fg) px-4 py-3">Issue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr
                        key={row.rowNumber}
                        className={`border-b border-(--color-border-soft) last:border-0 ${
                          row.status === "error"
                            ? "bg-red-500/5"
                            : row.status === "duplicate"
                              ? "bg-amber-500/5"
                              : ""
                        }`}
                      >
                        <td className="px-4 py-2.5 text-(--color-muted) text-xs">{row.rowNumber}</td>
                        <td className="px-4 py-2.5 font-medium text-(--color-foreground)">
                          {row.name || <span className="text-red-500 italic">missing</span>}
                        </td>
                        <td className="px-4 py-2.5 text-(--color-muted)">
                          {row.email || <span className="text-red-500 italic">missing</span>}
                        </td>
                        <td className="px-4 py-2.5 text-(--color-muted)">
                          {row.jerseyNumber ?? "—"}
                        </td>
                        <td className="px-4 py-2.5">
                          {row.status === "error" && (
                            <span className="text-xs text-red-600 dark:text-red-400">
                              {row.errors[0]}
                            </span>
                          )}
                          {row.status === "duplicate" && (
                            <span className="text-xs text-amber-600 dark:text-amber-400">
                              Already on team
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div className="px-5 py-4 border-t border-(--color-border) bg-(--color-background) text-sm flex flex-wrap gap-4">
                <span className="text-(--color-foreground) font-medium">
                  {validRows.length} ready to import
                </span>
                {errorRows.length > 0 && (
                  <span className="text-red-600 dark:text-red-400">
                    {errorRows.length} {errorRows.length === 1 ? "row has" : "rows have"} errors
                  </span>
                )}
                {duplicateRows.length > 0 && (
                  <span className="text-amber-600 dark:text-amber-400">
                    {duplicateRows.length} duplicate{duplicateRows.length !== 1 ? "s" : ""} skipped
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {(step === "preview" || step === "confirming") && (
          <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-(--color-border) shrink-0">
            <Button
              variant="ghost"
              onClick={() => { setStep("upload"); setRows([]); }}
              disabled={step === "confirming"}
            >
              ← Choose different file
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={validRows.length === 0 || step === "confirming"}
            >
              {step === "confirming"
                ? "Importing…"
                : `Add ${validRows.length} player${validRows.length !== 1 ? "s" : ""} to roster`}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
