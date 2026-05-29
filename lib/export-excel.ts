import * as XLSX from "xlsx";

/**
 * Export an array of objects to an Excel (.xlsx) file and trigger download.
 */
export function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  fileName: string,
  headerMap?: Partial<Record<keyof T, string>>
) {
  if (data.length === 0) return;

  const mapped = data.map((row) => {
    const transformed: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      const label = headerMap?.[key as keyof T] ?? key;
      transformed[label] = value ?? "";
    }
    return transformed;
  });

  const worksheet = XLSX.utils.json_to_sheet(mapped);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

  // Auto-size columns (rough approximation)
  const colWidths = Object.keys(mapped[0]).map((key) => {
    const maxLen = Math.max(
      key.length,
      ...mapped.map((row) => String(row[key] ?? "").length)
    );
    return { wch: Math.min(maxLen + 3, 60) };
  });
  worksheet["!cols"] = colWidths;

  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}
