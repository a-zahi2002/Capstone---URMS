/**
 * Utility to export an array of objects to a UTF-8 CSV file with BOM.
 */
export function exportToCSV(
  data: any[],
  headers: string[],
  keys: string[],
  filenamePrefix: string = "search_results"
) {
  if (!data || data.length === 0) {
    alert("No data available to export.");
    return;
  }

  // UTF-8 BOM for proper Excel encoding
  const BOM = "\uFEFF";

  // Create header row
  const headerRow = headers.map(h => `"${h.replace(/"/g, '""')}"`).join(",");

  // Create data rows
  const rows = data.map(item => {
    return keys.map(key => {
      let val = item[key];
      if (val === undefined || val === null) {
        val = "";
      } else if (Array.isArray(val)) {
        val = val.join("; ");
      } else {
        val = String(val);
      }
      return `"${val.replace(/"/g, '""')}"`;
    }).join(",");
  });

  const csvContent = BOM + [headerRow, ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  const timestamp = new Date().toISOString().replace(/[-:T.]/g, "").slice(0, 14);
  
  link.setAttribute("href", url);
  link.setAttribute("download", `${filenamePrefix}_${timestamp}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
