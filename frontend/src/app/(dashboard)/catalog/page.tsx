"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { DemoBanner } from "@/components/ui/DemoBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchInput } from "@/components/ui/SearchInput";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  deleteCatalog,
  getCatalogState,
  uploadCatalogFile,
} from "@/lib/api/services";
import { cn, formatDate, formatPKR } from "@/lib/utils";
import type { CatalogState } from "@/types";
import {
  Brain,
  FileUp,
  Package,
  RefreshCcw,
  Trash2,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

const ACCEPTED = [".pdf", ".xlsx", ".csv", ".txt"];
const ACCEPTED_MIME = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
  "text/plain",
];

function isAllowedFile(file: File) {
  const lower = file.name.toLowerCase();
  const byExt = ACCEPTED.some((ext) => lower.endsWith(ext));
  const byMime = !file.type || ACCEPTED_MIME.includes(file.type);
  return byExt && byMime;
}

export default function CatalogPage() {
  const [catalog, setCatalog] = useState<CatalogState | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const state = await getCatalogState();
      setCatalog(state);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const products = useMemo(() => {
    const list = catalog?.products ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }, [catalog, query]);

  const runUpload = async (file: File) => {
    if (!isAllowedFile(file)) {
      toast.error("Upload a PDF, XLSX, CSV, or TXT file");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.error("File must be under 15MB");
      return;
    }

    setUploading(true);
    setProgress(12);
    const tick = window.setInterval(() => {
      setProgress((p) => Math.min(90, p + 8));
    }, 180);

    try {
      const next = await uploadCatalogFile(file);
      setProgress(100);
      setCatalog(next);
      toast.success(`Catalog synced from ${file.name}`);
    } catch {
      toast.error("Catalog upload failed");
    } finally {
      window.clearInterval(tick);
      setUploading(false);
      setTimeout(() => setProgress(0), 600);
    }
  };

  const onFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file) void runUpload(file);
  };

  const handleDelete = async () => {
    setUploading(true);
    try {
      const next = await deleteCatalog();
      setCatalog(next);
      toast.success("Catalog removed");
    } catch {
      toast.error("Could not delete catalog");
    } finally {
      setUploading(false);
    }
  };

  const handleResync = async () => {
    if (!catalog?.fileName) {
      toast.error("Upload a catalog file first");
      return;
    }
    const blob = new Blob(["demo-resync"], { type: "text/plain" });
    const file = new File([blob], catalog.fileName, { type: "text/plain" });
    await runUpload(file);
  };

  const statusTone =
    catalog?.status === "synced"
      ? "green"
      : catalog?.status === "processing"
        ? "yellow"
        : catalog?.status === "failed"
          ? "red"
          : "gray";

  return (
    <div className="space-y-5 animate-fade-in">
      <DemoBanner feature="catalog" />

      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-ink">Product catalog</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Upload your catalog so the AI can answer product questions accurately.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            loading={uploading}
            onClick={handleResync}
            disabled={!catalog?.fileName}
          >
            <RefreshCcw className="h-4 w-4" />
            Resync
          </Button>
          <Button
            variant="danger"
            loading={uploading}
            onClick={handleDelete}
            disabled={!catalog?.products?.length && catalog?.status === "idle"}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
          <Button onClick={() => inputRef.current?.click()} loading={uploading}>
            <Upload className="h-4 w-4" />
            Replace catalog
          </Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Upload catalog"
            description="Accepted: PDF, XLSX, CSV, TXT (max 15MB)"
          />
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept={ACCEPTED.join(",")}
            onChange={(e) => onFiles(e.target.files)}
          />
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              onFiles(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition",
              dragOver
                ? "border-brand-green bg-brand-soft/60"
                : "border-line bg-brand-app/40 hover:border-brand-green/50"
            )}
          >
            <div className="mb-3 rounded-2xl bg-white p-3 text-brand-secondary shadow-sm">
              <FileUp className="h-6 w-6" />
            </div>
            <p className="font-medium text-ink">Drag & drop your catalog here</p>
            <p className="mt-1 text-sm text-ink-muted">or click to browse files</p>
          </div>

          {(uploading || progress > 0) && (
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-ink-muted">
                  {catalog?.status === "processing" || uploading
                    ? "Processing catalog…"
                    : "Upload complete"}
                </span>
                <span className="font-medium">{progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-brand-app">
                <div
                  className="h-full rounded-full bg-brand-green transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="AI knowledge base" description="RAG index status" />
          {loading || !catalog ? (
            <Skeleton className="h-40" />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-muted">Catalog status</span>
                <Badge tone={statusTone}>{catalog.status}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-muted">Knowledge base</span>
                <Badge tone={catalog.knowledgeBaseReady ? "green" : "yellow"}>
                  {catalog.knowledgeBaseReady ? "Ready" : "Not ready"}
                </Badge>
              </div>
              <div className="rounded-xl border border-line bg-brand-app/50 p-3">
                <div className="mb-2 flex items-center gap-2 text-brand-secondary">
                  <Brain className="h-4 w-4" />
                  <span className="text-sm font-semibold">Indexed source</span>
                </div>
                <p className="text-sm text-ink">{catalog.fileName || "No file uploaded"}</p>
                <p className="mt-1 text-xs text-ink-muted">
                  {catalog.uploadedAt
                    ? `Last synced ${formatDate(catalog.uploadedAt)}`
                    : "Upload a file to enable product answers"}
                </p>
              </div>
              <p className="text-xs text-ink-muted">
                {catalog.products.length} products available to the AI assistant.
              </p>
            </div>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Products"
          description="Synced from your latest catalog upload"
          action={
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search products…"
              className="w-full sm:w-64"
            />
          }
        />
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No products yet"
            description="Upload a catalog file to populate your product table."
            action={
              <Button onClick={() => inputRef.current?.click()}>
                Upload catalog
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-muted">
                  <th className="px-3 py-2 font-semibold">Product</th>
                  <th className="px-3 py-2 font-semibold">Price</th>
                  <th className="px-3 py-2 font-semibold">Stock</th>
                  <th className="px-3 py-2 font-semibold">Last synced</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-line/70">
                    <td className="px-3 py-3">
                      <div className="font-medium text-ink">{p.name}</div>
                      <div className="text-xs text-ink-muted">{p.description}</div>
                    </td>
                    <td className="px-3 py-3">{formatPKR(p.price)}</td>
                    <td className="px-3 py-3">
                      <Badge tone={p.stock < 10 ? "yellow" : "green"}>{p.stock}</Badge>
                    </td>
                    <td className="px-3 py-3 text-ink-muted">{formatDate(p.lastSyncedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
