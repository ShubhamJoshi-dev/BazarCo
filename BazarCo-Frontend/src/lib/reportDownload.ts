import type { SellerReportFormat } from "@/lib/api";

export function mimeForFormat(format: SellerReportFormat): string {
  switch (format) {
    case "excel":
      return "text/csv;charset=utf-8";
    case "pdf":
      return "text/plain;charset=utf-8";
    default:
      return "text/csv;charset=utf-8";
  }
}

export function extensionForFormat(format: SellerReportFormat): string {
  switch (format) {
    case "pdf":
      return "txt";
    case "excel":
      return "csv";
    default:
      return "csv";
  }
}

export function downloadReportFile(
  content: string,
  reportName: string,
  format: SellerReportFormat,
): void {
  const ext = extensionForFormat(format);
  const safe = reportName.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "_") || "report";
  const blob = new Blob([content], { type: mimeForFormat(format) });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safe}.${ext}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
