import * as XLSX from "xlsx-js-style";

/**
 * Applies professional table styling (Navy #366092 header, bold white text, autofilter, and borders)
 * to any sheet generated for SMS templates or export reports.
 */
export const applyWorksheetTableStyle = (ws: any, customCols?: { wch: number }[]) => {
  if (!ws || !ws["!ref"]) return;

  const thinBorder = {
    top: { style: "thin", color: { rgb: "D9D9D9" } },
    bottom: { style: "thin", color: { rgb: "D9D9D9" } },
    left: { style: "thin", color: { rgb: "D9D9D9" } },
    right: { style: "thin", color: { rgb: "D9D9D9" } }
  };

  const headerStyle = {
    font: { name: "Arial", size: 10, bold: true, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "366092" } },
    alignment: { horizontal: "center", vertical: "center" },
    border: thinBorder
  };

  const dataStyle = {
    font: { name: "Arial", size: 10 },
    alignment: { horizontal: "left", vertical: "center" },
    border: thinBorder
  };

  const numStyle = {
    font: { name: "Arial", size: 10 },
    alignment: { horizontal: "right", vertical: "center" },
    border: thinBorder
  };

  const range = XLSX.utils.decode_range(ws["!ref"]);

  // Set !autofilter for native Excel Table filtering dropdowns
  ws["!autofilter"] = { ref: ws["!ref"] };

  if (customCols && customCols.length > 0) {
    ws["!cols"] = customCols;
  } else if (!ws["!cols"]) {
    const cols: any[] = [];
    for (let c = range.s.c; c <= range.e.c; c++) {
      let maxLen = 12;
      for (let r = range.s.r; r <= range.e.r; r++) {
        const cellRef = XLSX.utils.encode_cell({ r, c });
        if (ws[cellRef] && ws[cellRef].v !== undefined && ws[cellRef].v !== null) {
          const str = String(ws[cellRef].v);
          if (str.length > maxLen) maxLen = str.length;
        }
      }
      cols.push({ wch: Math.min(maxLen + 4, 45) });
    }
    ws["!cols"] = cols;
  }

  // Apply cell styling to every cell inside table boundary
  for (let r = range.s.r; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      if (!ws[cellRef]) continue;

      if (r === range.s.r) {
        ws[cellRef].s = headerStyle;
      } else {
        const val = ws[cellRef].v;
        if (typeof val === "number" || (!isNaN(Number(val)) && typeof val === "string" && val.trim() !== "" && /^[0-9.]+$/.test(val))) {
          ws[cellRef].s = numStyle;
        } else {
          ws[cellRef].s = dataStyle;
        }
      }
    }
  }
};
