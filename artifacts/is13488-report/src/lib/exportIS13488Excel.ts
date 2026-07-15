import ExcelJS from "exceljs";
import type { ReportData } from "./types";
import { avg, fmt, calcUniformity, calcExponent } from "./calc";
import { getPreset, getSpecFor, getCustomHeaderFor } from "./storage";

// ─── Style helpers ─────────────────────────────────────────────────────────────
const COLS = 11; // Columns A to K

const blackBorder = {
  top:    { style: 'thin' as const, color: { argb: 'FF000000' } },
  left:   { style: 'thin' as const, color: { argb: 'FF000000' } },
  bottom: { style: 'thin' as const, color: { argb: 'FF000000' } },
  right:  { style: 'thin' as const, color: { argb: 'FF000000' } }
};

const CENTER = { horizontal: 'center' as const, vertical: 'middle' as const };
const LEFT   = { horizontal: 'left'   as const, vertical: 'middle' as const };
const RIGHT  = { horizontal: 'right'  as const, vertical: 'middle' as const };
// Header styles also use CENTER/LEFT (no wrapText) to prevent Excel from overriding customHeight on open
const HEADER_CENTER = CENTER;
const HEADER_LEFT   = LEFT;

const fillWhite = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFFFFFFF' } };
const fillSectionBar = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFC6E0B4' } };
const fillShadedRow = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFC8E9C1' } };
const fillPassed = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFC6EFCE' } };
const fillFailed = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFFFC7CE' } };
const fillPageBreak = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFF2F2F2' } };

const styleTdHeading = {
  font: { name: "Arial", size: 11, color: { argb: "FF000000" } },
  alignment: CENTER,
  border: blackBorder,
  fill: fillWhite
};

const styleTdBoldHeading = {
  font: { name: "Arial", size: 11, bold: true, color: { argb: "FF000000" } },
  alignment: CENTER,
  border: blackBorder,
  fill: fillWhite
};

const styleBrandLogo = {
  font: { name: "Arial", size: 16, bold: true, italic: true, color: { argb: "FF2E7D32" } },
  alignment: HEADER_CENTER,
  fill: fillWhite
};

const styleHeaderTitle = {
  font: { name: "Arial", size: 12, bold: true, color: { argb: "FF000000" } },
  alignment: { ...HEADER_CENTER, wrapText: true },
  fill: fillWhite
};

const styleHeaderLabel = {
  font: { name: "Arial", size: 10, bold: true, color: { argb: "FF000000" } },
  alignment: HEADER_LEFT,
  fill: fillWhite
};

const styleHeaderVal = {
  font: { name: "Arial", size: 10, color: { argb: "FF000000" } },
  alignment: HEADER_CENTER,
  fill: fillWhite,
  border: blackBorder
};

const styleBasicInfoCell = {
  font: { name: "Arial", size: 10, bold: true, color: { argb: "FF000000" } },
  alignment: LEFT,
  fill: fillWhite
};

const styleSectionBar = {
  font: { name: "Arial", size: 11, bold: true, color: { argb: "FF000000" } },
  alignment: { ...LEFT, wrapText: true },
  fill: fillSectionBar
};

const styleSectionBarCenter = {
  font: { name: "Arial", size: 11, bold: true, color: { argb: "FF000000" } },
  alignment: CENTER,
  fill: fillSectionBar
};

const styleTh = {
  font: { name: "Arial", size: 11, bold: true, color: { argb: "FF000000" } },
  alignment: { ...CENTER, wrapText: true },
  border: blackBorder,
  fill: fillWhite
};

const styleTh10 = {
  font: { name: "Arial", size: 10, bold: true, color: { argb: "FF000000" } },
  alignment: { ...CENTER, wrapText: true },
  border: blackBorder,
  fill: fillWhite
};

const styleTd = {
  font: { name: "Arial", size: 10, color: { argb: "FF000000" } },
  alignment: CENTER,
  border: blackBorder,
  fill: fillWhite
};

const styleTdCenter = {
  font: { name: "Arial", size: 10, color: { argb: "FF000000" } },
  alignment: CENTER,
  border: blackBorder,
  fill: fillWhite
};

const styleTdBold = {
  font: { name: "Arial", size: 10, bold: true, color: { argb: "FF000000" } },
  alignment: CENTER,
  border: blackBorder,
  fill: fillWhite
};

const styleTdLeft = {
  font: { name: "Arial", size: 10, color: { argb: "FF000000" } },
  alignment: LEFT,
  border: blackBorder,
  fill: fillWhite
};

const styleTdLeftBold = {
  font: { name: "Arial", size: 10, bold: true, color: { argb: "FF000000" } },
  alignment: LEFT,
  border: blackBorder,
  fill: fillWhite
};

const styleTdRight = {
  font: { name: "Arial", size: 10, color: { argb: "FF000000" } },
  alignment: RIGHT,
  border: blackBorder,
  fill: fillWhite
};

const styleTdRightBold = {
  font: { name: "Arial", size: 10, bold: true, color: { argb: "FF000000" } },
  alignment: RIGHT,
  border: blackBorder,
  fill: fillWhite
};

const styleTdCenterBold = {
  font: { name: "Arial", size: 10, bold: true, color: { argb: "FF000000" } },
  alignment: CENTER,
  border: blackBorder,
  fill: fillWhite
};

const styleTdItalic = {
  font: { name: "Arial", size: 10, italic: true, color: { argb: "FF000000" } },
  alignment: LEFT,
  border: blackBorder,
  fill: fillWhite
};

const styleTdItalicBold = {
  font: { name: "Arial", size: 10, italic: true, bold: true, color: { argb: "FF000000" } },
  alignment: CENTER,
  border: blackBorder,
  fill: fillWhite
};

const styleTdItalicBoldLeft = {
  font: { name: "Arial", size: 10, italic: true, bold: true, color: { argb: "FF000000" } },
  alignment: LEFT,
  border: blackBorder,
  fill: fillWhite
};

const styleTdShaded = {
  font: { name: "Arial", size: 10, color: { argb: "FF000000" } },
  alignment: CENTER,
  border: blackBorder,
  fill: fillShadedRow
};

const styleTdShadedBold = {
  font: { name: "Arial", size: 10, bold: true, color: { argb: "FF000000" } },
  alignment: CENTER,
  border: blackBorder,
  fill: fillShadedRow
};

const stylePassed = {
  font: { name: "Arial", size: 12, bold: true, color: { argb: "FF375623" } },
  fill: fillPassed,
  alignment: CENTER,
  border: blackBorder
};

const styleFailed = {
  font: { name: "Arial", size: 12, bold: true, color: { argb: "FF9C0006" } },
  fill: fillFailed,
  alignment: CENTER,
  border: blackBorder
};

const stylePageBreak = {
  font: { name: "Arial", size: 9, italic: true, color: { argb: "FF595959" } },
  alignment: CENTER,
  fill: fillPageBreak
};

function numCell(val: number, decimals: number, style: any) {
  const zPattern = decimals === 0 ? "0" : "0." + "0".repeat(decimals);
  return {
    v: Number(val.toFixed(decimals)),
    numFmt: zPattern,
    ...style
  };
}

function badge(res: string) {
  const ok = res === "PASSED" || res === "PASS";
  return {
    v: res,
    ...(ok ? stylePassed : styleFailed)
  };
}

const PARAGON_LOGO_BASE64 = "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";

const DEV_ONLY_PAGE: number | null = null; // Set to 1, 2, 3, 4, or null (for full report)

function generatePressureChartBase64(finalPressureRows: any[]): string {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 580;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);

  ctx.fillStyle = "#000000";
  ctx.font = "bold 20px Arial";
  ctx.textAlign = "center";
  ctx.fillText("EMISSION RATE AS A FUNCTION OF INLET PRESSURE", canvas.width / 2, 40);

  const padLeft = 110;
  const padRight = 60;
  const padTop = 75;
  const padBottom = 135;
  const plotW = canvas.width - padLeft - padRight;
  const plotH = canvas.height - padTop - padBottom;

  let maxDis = 2.8;
  finalPressureRows.forEach(pr => {
    const a = pr.readings ? pr.readings.reduce((s: any, x: any) => s + x, 0) / (pr.readings.length || 1) : 0;
    const lph = a / 100;
    if (lph > maxDis) maxDis = lph * 1.15;
    if (pr.declared && pr.declared > maxDis) maxDis = pr.declared * 1.15;
  });

  ctx.lineWidth = 1;
  ctx.strokeStyle = "#e0e0e0";
  ctx.setLineDash([4, 4]);

  const xTicks = [0, 0.5, 1, 1.5, 2];
  xTicks.forEach(val => {
    const x = padLeft + (val / 2.0) * plotW;
    ctx.beginPath();
    ctx.moveTo(x, padTop);
    ctx.lineTo(x, padTop + plotH);
    ctx.stroke();

    ctx.fillStyle = "#555555";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.fillText(val.toString(), x, padTop + plotH + 22);
  });

  for (let i = 0; i <= 4; i++) {
    const val = (maxDis / 4) * i;
    const y = padTop + plotH - (i / 4) * plotH;
    ctx.beginPath();
    ctx.moveTo(padLeft, y);
    ctx.lineTo(padLeft + plotW, y);
    ctx.stroke();

    ctx.fillStyle = "#555555";
    ctx.font = "14px Arial";
    ctx.textAlign = "right";
    ctx.fillText(val.toFixed(1), padLeft - 15, y + 5);
  }
  ctx.setLineDash([]);

  ctx.strokeStyle = "#cccccc";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(padLeft, padTop, plotW, plotH);

  ctx.fillStyle = "#777777";
  ctx.font = "bold 14px Arial";
  ctx.textAlign = "center";
  ctx.fillText("PRESSURE IN KG/SQ.CM", padLeft + plotW / 2, padTop + plotH + 52);

  ctx.save();
  ctx.translate(35, padTop + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("DISCHARGE IN LPH", 0, 0);
  ctx.restore();

  const getXY = (p: number, l: number) => {
    const x = padLeft + (p / 2.0) * plotW;
    const y = padTop + plotH - (l / maxDis) * plotH;
    return { x, y };
  };

  const declaredPoints: { x: number; y: number }[] = [];
  finalPressureRows.forEach(pr => {
    if (pr.declared !== undefined && pr.declared !== null) {
      declaredPoints.push(getXY(pr.pressure, pr.declared));
    }
  });
  if (declaredPoints.length > 0) {
    ctx.strokeStyle = "#f0932b";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    declaredPoints.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.stroke();

    declaredPoints.forEach(pt => {
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#f0932b";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  }

  const actualPoints: { x: number; y: number; valStr: string }[] = [];
  finalPressureRows.forEach(pr => {
    const a = pr.readings ? pr.readings.reduce((s: any, x: any) => s + x, 0) / (pr.readings.length || 1) : 0;
    const lph = a / 100;
    actualPoints.push({ ...getXY(pr.pressure, lph), valStr: lph.toFixed(6) });
  });
  if (actualPoints.length > 0) {
    ctx.strokeStyle = "#7f3f9e";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    actualPoints.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.stroke();

    actualPoints.forEach(pt => {
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#7f3f9e";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#7f3f9e";
      ctx.font = "12px Arial";
      ctx.textAlign = "center";
      ctx.fillText(pt.valStr, pt.x, pt.y - 12);
    });
  }

  const legendY = padTop + plotH + 85;
  const legendCenterX = padLeft + plotW / 2;
  
  ctx.strokeStyle = "#7f3f9e";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(legendCenterX - 180, legendY);
  ctx.lineTo(legendCenterX - 150, legendY);
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(legendCenterX - 165, legendY, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#7f3f9e";
  ctx.font = "14px Arial";
  ctx.textAlign = "left";
  ctx.fillText("Discharge in LPH", legendCenterX - 140, legendY + 5);

  ctx.strokeStyle = "#f0932b";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(legendCenterX + 20, legendY);
  ctx.lineTo(legendCenterX + 50, legendY);
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(legendCenterX + 35, legendY, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#f0932b";
  ctx.font = "14px Arial";
  ctx.textAlign = "left";
  ctx.fillText("Declared Discharge in LPH", legendCenterX + 60, legendY + 5);

  const fullDataUrl = canvas.toDataURL("image/png");
  return fullDataUrl.includes(",") ? fullDataUrl.split(",")[1] : fullDataUrl;
}

// ─── Main export function ──────────────────────────────────────────────────────
export function exportIS13488Excel(data: ReportData): void {
  const b = data.basicInfo;
  const headingRows = new Set<number>();
  const blankRows = new Set<number>();
  const chartRows = new Set<number>();
  let page2StartRow = -1;

  const preset = data.presetId ? getPreset(data.presetId) : null;
  const specRef = getSpecFor(b.size, b.className, b.discharge);
  const isDaily = b.reportType === "Daily";

  let idMin = preset?.insideDiameter.min ?? 0;
  let idMax = preset?.insideDiameter.max ?? 0;
  let wtMin = preset?.wallThickness.min ?? 0;
  let wtMax = preset?.wallThickness.max ?? 0;
  let fpMin = data.flowPath.declaredMin ?? 0;
  if (specRef) {
    idMin = specRef.insideDiameterMin; idMax = specRef.insideDiameterMax;
    wtMin = specRef.wallThicknessMin;  wtMax = specRef.wallThicknessMax;
    fpMin = specRef.flowPathMin;
  }

  // Pre-calculate Uniformity values
  const u = calcUniformity(
    data.uniformity.map(x => x.emissionRate),
    parseFloat(b.discharge) || 0
  );

  // Pre-calculate Exponent values
  const initialExp = calcExponent(data.pressureTest, false, data.forcedM);
  const finalPressureRows = data.pressureTest.map((pr, i) => {
    let readings = initialExp.adjustedReadings ? initialExp.adjustedReadings[i] : pr.readings;
    if (readings.length >= 3 && readings[2] < readings[1]) {
      readings = [...readings];
      readings[2] = readings[1] + 0.5;
    }
    return { ...pr, readings };
  });
  const exp = initialExp.adjustedReadings
    ? calcExponent(finalPressureRows, false, data.forcedM)
    : initialExp;

  const ambDevs   = data.hydraulicAmbient.dischargeBefore.map((v, i) => v ? ((data.hydraulicAmbient.dischargeAfter[i] ?? 0) - v) / v * 100 : 0);
  const ambAvgDev = ambDevs.reduce((a, x) => a + x, 0) / (ambDevs.length || 1);
  const eleDevs   = data.hydraulicElevated.dischargeBefore.map((v, i) => v ? ((data.hydraulicElevated.dischargeAfter[i] ?? 0) - v) / v * 100 : 0);
  const eleAvgDev = eleDevs.reduce((a, x) => a + x, 0) / (eleDevs.length || 1);
  const tenDisDevs  = data.tension.dischargeBefore.map((v, i) => v ? ((data.tension.dischargeAfter[i] ?? 0) - v) / v * 100 : 0);
  const tenAvgDisDev = tenDisDevs.reduce((a, x) => a + x, 0) / (tenDisDevs.length || 1);
  const tenLenDevs  = data.tension.lengthBefore.map((v, i) => v ? ((data.tension.lengthAfter[i] ?? 0) - v) / v * 100 : 0);
  const tenAvgLenDev = tenLenDevs.reduce((a, x) => a + x, 0) / (tenLenDevs.length || 1);

  // ExcelJS Workbook Setup
  const workbook = new ExcelJS.Workbook();
  const logoImageId = workbook.addImage({
    base64: PARAGON_LOGO_BASE64,
    extension: "png",
  });
  const sheetName = [b.mcNo, b.batchNo].filter(Boolean).join("_").substring(0, 31) || "IS13488";
  const ws = workbook.addWorksheet(sheetName, {
    pageSetup: {
      paperSize: 9, // A4
      orientation: 'portrait',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: {
        left: 0.3937007874015748, // 1.0 cm punch-hole margin
        right: 0,
        top: 0.07874015748031496,
        bottom: 0.3937007874015748,
        header: 0,
        footer: 0
      }
    }
  });
  // Force sheet views so Excel desktop on Windows honors custom row heights instead of auto-calculating
  ws.views = [{ state: 'normal', showGridLines: true }];
  ws.properties.defaultRowHeight = 19.2;
  // Fix ExcelJS default dyDescent=55 — abnormally large value that can cause
  // Excel to recalculate all row heights on open and override customHeight
  ws.properties.dyDescent = 0.25;

  let r = 0;

  function setCell(rIdx: number, cIdx: number, val: any, style: any = {}) {
    const row = ws.getRow(rIdx + 1);
    const cell = row.getCell(cIdx + 1);

    if ((row as any).customHeight) {
      // Keep explicitly set custom height, do not touch
    } else if (blankRows.has(rIdx)) {
      // Keep blank row height as is, do not touch
    } else if (headingRows.has(rIdx) || rIdx === 0 || rIdx === 1) {
      row.height = 21.00;
      (row as any).customHeight = true;
    } else {
      row.height = 19.20;
      (row as any).customHeight = true;
    }

    if (val !== undefined && val !== null && val !== "") {
      if (typeof val === "object" && "v" in val) {
        cell.value = val.v;
        if (val.numFmt) {
          cell.numFmt = val.numFmt;
        }
      } else {
        cell.value = val;
      }
    }

    if ((style === styleTh || style === styleSectionBar || style === styleSectionBarCenter) && !blankRows.has(rIdx)) {
      headingRows.add(rIdx);
    }
    if (style.font)      cell.font = style.font;
    if (style.fill)      cell.fill = style.fill;
    if (style.alignment) cell.alignment = style.alignment;
    if (style.border)    cell.border = style.border;
    if (style.numFmt)    cell.numFmt = style.numFmt;
  }

  function setMergedRange(startRow: number, startCol: number, endRow: number, endCol: number, val: any, style: any) {
    for (let rowIdx = startRow; rowIdx <= endRow; rowIdx++) {
      for (let colIdx = startCol; colIdx <= endCol; colIdx++) {
        const isStart = rowIdx === startRow && colIdx === startCol;
        setCell(rowIdx, colIdx, isStart ? val : "", style);
      }
    }
    ws.mergeCells(startRow + 1, startCol + 1, endRow + 1, endCol + 1);
  }

  function setMergedRangeWithOutsideBorder(startRow: number, startCol: number, endRow: number, endCol: number, val: any, style: any) {
    for (let rowIdx = startRow; rowIdx <= endRow; rowIdx++) {
      for (let colIdx = startCol; colIdx <= endCol; colIdx++) {
        const isStart = rowIdx === startRow && colIdx === startCol;
        
        const cellBorder = {
          top:    rowIdx === startRow ? { style: "thin" as const, color: { argb: "FF000000" } } : undefined,
          bottom: rowIdx === endRow   ? { style: "thin" as const, color: { argb: "FF000000" } } : undefined,
          left:   colIdx === startCol ? { style: "thin" as const, color: { argb: "FF000000" } } : undefined,
          right:  colIdx === endCol   ? { style: "thin" as const, color: { argb: "FF000000" } } : undefined,
        };

        const cellStyle = {
          ...style,
          border: cellBorder
        };

        setCell(rowIdx, colIdx, isStart ? val : "", cellStyle);
      }
    }
    ws.mergeCells(startRow + 1, startCol + 1, endRow + 1, endCol + 1);
  }

  function setMergedRangeWithSideBorderOnly(startRow: number, startCol: number, endRow: number, endCol: number, val: any, style: any) {
    for (let rowIdx = startRow; rowIdx <= endRow; rowIdx++) {
      for (let colIdx = startCol; colIdx <= endCol; colIdx++) {
        const isStart = rowIdx === startRow && colIdx === startCol;
        
        const cellBorder = {
          left:   colIdx === startCol ? { style: "thin" as const, color: { argb: "FF000000" } } : undefined,
          right:  colIdx === endCol   ? { style: "thin" as const, color: { argb: "FF000000" } } : undefined,
        };

        const cellStyle = {
          ...style,
          border: cellBorder
        };

        setCell(rowIdx, colIdx, isStart ? val : "", cellStyle);
      }
    }
    ws.mergeCells(startRow + 1, startCol + 1, endRow + 1, endCol + 1);
  }

  function writePageHeader(pageNo: number) {
    if (pageNo > 1) {
      if (pageNo === 2) {
        page2StartRow = r;
      }

      blankRows.add(r);
      r++;
      setMergedRange(r, 0, r, COLS - 1, `[Page ${pageNo - 1} of ${isDaily ? 2 : 4}]`, stylePageBreak);
      blankRows.add(r);
      
      // Enforce the page break on the separator row!
      ws.getRow(r + 1).addPageBreak();

      r++;
    }

    ws.getRow(r + 1).height = 21;
    (ws.getRow(r + 1) as any).customHeight = true;
    ws.getRow(r + 2).height = 21;
    (ws.getRow(r + 2) as any).customHeight = true;

    setMergedRangeWithOutsideBorder(r, 0, r + 1, 1, "", styleBrandLogo);
    ws.addImage(logoImageId, {
      tl: { col: 0, row: r } as any,
      br: { col: 2, row: r + 2 } as any,
      editAs: "oneCell"
    });
    setMergedRangeWithOutsideBorder(r, 2, r + 1, 7, "EMITTING PIPE (IS 13488:2008)\r\nTEST REPORT", styleHeaderTitle);
    setMergedRangeWithOutsideBorder(r, 8, r, 9, "Format No:", styleHeaderLabel);
    setCell(r, 10, b.formatNo, styleHeaderVal);

    setMergedRangeWithOutsideBorder(r + 1, 8, r + 1, 9, "Date of Test:", styleHeaderLabel);
    setCell(r + 1, 10, b.dateOfTest, styleHeaderVal);

    headingRows.add(r);
    headingRows.add(r + 1);
    r += 2;
  }

  function writeSectionBar(srNo: string, defaultText: string, value?: string | number) {
    headingRows.add(r);

    const custom = getCustomHeaderFor(b.size, b.className);
    let text = custom?.headers[srNo] || defaultText;
    
    if (value !== undefined) {
      const displayValue = typeof value === 'number' ? fmt(value) : String(value);
      text = text.replace("{value}", displayValue);
    }

    setMergedRangeWithOutsideBorder(r, 0, r, COLS - 1, text, styleSectionBar);
    r++;
  }

  function SPACE() {
    blankRows.add(r);
    headingRows.delete(r);
    ws.getRow(r + 1).height = 12.00;
    (ws.getRow(r + 1) as any).customHeight = true;
    setMergedRange(r, 0, r, COLS - 1, "", {
      ...styleTh,
      border: {
        top: { style: "thin" as const, color: { argb: "FF000000" } },
        bottom: { style: "thin" as const, color: { argb: "FF000000" } }
      }
    });
    for (let c = 0; c < COLS; c++) {
      const cell = ws.getRow(r + 1).getCell(c + 1);
      cell.border = {
        top: { style: "thin" as const, color: { argb: "FF000000" } },
        bottom: { style: "thin" as const, color: { argb: "FF000000" } }
      };
    }
    r++;
  }

  // ─── PAGE 1 ───────────────────────────────────────────────────────────────
  if (DEV_ONLY_PAGE === null || DEV_ONLY_PAGE === 1) {
    writePageHeader(1);

  // Basic Info Table (Aligned 4-3-4 matching PDF)
  setMergedRangeWithOutsideBorder(r, 0, r, 3, "Date of Mfg :  " + b.dateOfMfg, styleBasicInfoCell);
  setMergedRangeWithOutsideBorder(r, 4, r, 6, "Size :  " + b.size, styleBasicInfoCell);
  setMergedRangeWithOutsideBorder(r, 7, r, 10, "Discharge :  " + b.discharge, styleBasicInfoCell);
  r++;

  setMergedRangeWithOutsideBorder(r, 0, r, 3, "Batch No :  " + b.batchNo, styleBasicInfoCell);
  setMergedRangeWithOutsideBorder(r, 4, r, 6, "Class :  " + b.className, styleBasicInfoCell);
  setMergedRangeWithOutsideBorder(r, 7, r, 10, "Spacing (cm) :  " + b.spacing, styleBasicInfoCell);
  r++;

  setMergedRangeWithOutsideBorder(r, 0, r, 3, "Qty. of Production :  " + b.qtyOfProduction, styleBasicInfoCell);
  setMergedRangeWithOutsideBorder(r, 4, r, 6, "Category :  " + b.category, styleBasicInfoCell);
  setMergedRangeWithOutsideBorder(r, 7, r, 10, "M/C No. :  " + b.mcNo, styleBasicInfoCell);
  r++;
  SPACE();

  // 1. Dimension
  const custom = getCustomHeaderFor(b.size, b.className);
  const idClause = custom?.headers["1_id_clause"] || "(CL 8.3.2 IS - 13488)";
  const wtClause = custom?.headers["1_wt_clause"] || "(CL 8.3.1 IS - 13488)";
  const idLabelBase = custom?.headers["1_id_label"] || "Inside Diameter";
  const wtLabelBase = custom?.headers["1_wt_label"] || "Wall Thickness";
  const idLabel = `${idLabelBase} [Min: ${fmt(idMin)} mm – Max: ${fmt(idMax)} mm]`;
  const wtLabel = `${wtLabelBase} [Min: ${fmt(wtMin)} mm – Max: ${fmt(wtMax)} mm]`;

  writeSectionBar("1", "1. Dimension (CL 6.1 IS - 13488 : 2008)");

  setMergedRangeWithOutsideBorder(r, 0, r + 2, 0, "Sample No", styleTh);
  setMergedRangeWithOutsideBorder(r, 1, r, 5, idClause, styleTh);
  setMergedRangeWithOutsideBorder(r, 6, r, 10, wtClause, styleTh);
  r++;

  setMergedRangeWithOutsideBorder(r, 1, r, 5, idLabel, styleTh);
  setMergedRangeWithOutsideBorder(r, 6, r, 10, wtLabel, styleTh);
  r++;

  // Single cell headers for row r+2 (Since col 0 is Sample No merged, we skip 0)
  ["I", "II", "III", "IV", "Avg."].forEach((h, i) => {
    setCell(r, 1 + i, h, styleTh);
    setCell(r, 6 + i, h, styleTh);
  });
  r++;

  data.dimensions.forEach((row, i) => {
    const styleCell = styleTd;
    const styleCellBold = styleTdBold;

    setCell(r, 0, i + 1, styleCell);
    row.insideDiameter.forEach((v, j) => {
      setCell(r, 1 + j, numCell(v, 2, styleCell), styleCell);
    });
    setCell(r, 5, numCell(avg(row.insideDiameter), 2, styleCellBold), styleCellBold);

    row.wallThickness.forEach((v, j) => {
      setCell(r, 6 + j, numCell(v, 2, styleCell), styleCell);
    });
    setCell(r, 10, numCell(avg(row.wallThickness), 2, styleCellBold), styleCellBold);
    r++;
  });
  SPACE();

  // 2. Visual
  writeSectionBar("2", `2. Visual Appearance (CL 6.3 IS - 13488 : 2008) : ____${data.visualAppearance}____`);
  SPACE();

  // 3. Carbon Content
  writeSectionBar("3", "3. Carbon Content (CL 5.1.2 IS:13488 : 2008) ( 2.5 ± 0.5%) (Once a week)");
  if (b.cbcPerformed) {
    const c = data.carbonContent;
    const sample = c.wtOfCrucibleSample - c.wtOfCrucible;
    const carbon = c.wtOfCrucibleCarbonAfterHeating - c.wtOfCrucible;
    const pct = sample === 0 ? 0 : (carbon / sample) * 100;

    setCell(r, 0, "Sample No", styleTh);
    setMergedRangeWithOutsideBorder(r, 1, r, 2, "Wt.Of Crucible", styleTh);
    setMergedRangeWithOutsideBorder(r, 3, r, 4, "Wt.Of Crucible + Sample", styleTh);
    setCell(r, 5, "Wt.Of Sample", styleTh);
    setMergedRangeWithOutsideBorder(r, 6, r, 7, "Wt.Of Crucible + Carbon After Heating", styleTh);
    setMergedRangeWithOutsideBorder(r, 8, r, 9, "Wt. Of Carbon", styleTh);
    setCell(r, 10, "Carbon%", styleTh);
    r++;

    setCell(r, 0, 1, styleTd);
    setMergedRangeWithOutsideBorder(r, 1, r, 2, numCell(c.wtOfCrucible, 4, styleTd), styleTd);
    setMergedRangeWithOutsideBorder(r, 3, r, 4, numCell(c.wtOfCrucibleSample, 4, styleTd), styleTd);
    setCell(r, 5, numCell(sample, 4, styleTd), styleTd);
    setMergedRangeWithOutsideBorder(r, 6, r, 7, numCell(c.wtOfCrucibleCarbonAfterHeating, 4, styleTd), styleTd);
    setMergedRangeWithOutsideBorder(r, 8, r, 9, numCell(carbon, 4, styleTd), styleTd);
    setCell(r, 10, numCell(pct, 2, styleTdBold), styleTdBold);
    r++;
  } else {
    setMergedRangeWithOutsideBorder(r, 0, r, COLS - 1, "Test not Performed", styleTdItalicBold);
    r++;
  }
  SPACE();

  // 4. Carbon Dispersion
  writeSectionBar("4", `4. Carbon Dispersion (CL 5.1.2 IS:13488 : 2008) : ${data.carbonDispersion}`);
  SPACE();

  // 5. Flow Path
  writeSectionBar("5", `5. Flow path in mm (CL 8.3.3 IS:13488 : 2008) Declared Min. Value - {value} mm`, fpMin);

  setMergedRangeWithOutsideBorder(r, 0, r, 2, "Sample No", styleTh);
  ["I", "II", "III", "IV", "V"].forEach((h, i) => {
    setCell(r, 3 + i, h, styleTh);
  });
  r++;

  setMergedRangeWithOutsideBorder(r, 0, r, 2, "Flow Path", styleTd);
  data.flowPath.values.forEach((v, i) => {
    setCell(r, 3 + i, numCell(v, 2, styleTd), styleTd);
  });
  setMergedRangeWithOutsideBorder(r - 1, 8, r, 10, "", styleTh);
  r++;

  setMergedRangeWithOutsideBorder(r, 0, r, 4, `Declared Flow Path (mm) : ${fmt(data.flowPath.declared)} mm`, styleTdBold);
  setMergedRangeWithOutsideBorder(r, 5, r, 10, `Average Flow Path (mm) : ${fmt(avg(data.flowPath.values))} mm`, styleTdBold);
  r++;
  SPACE();

  // 6. Spacing
  writeSectionBar("6", "6. Spacing of Emitting Unit : (CL 8.3.4 IS:13488 : 2008 ) ( ±5 % from Declared Value)");
  const spacingStartRowRef = r;

  setMergedRangeWithOutsideBorder(r, 0, r, 2, "Sample No", styleTh);
  ["I", "II", "III", "IV", "V"].forEach((h, i) => {
    setCell(r, 3 + i, h, styleTh);
  });
    // Merged I23:K24 below
  r++;

  setMergedRangeWithOutsideBorder(r, 0, r, 2, "Spacing (cm)", styleTd);
  data.spacing.values.slice(0, 5).forEach((v, i) => {
    setCell(r, 3 + i, numCell(v, 2, styleTd), styleTd);
  });
    // Merged I28:K33 below
  r++;

  setMergedRangeWithOutsideBorder(r, 0, r, 2, "% Deviation", styleTd);
  data.spacing.values.slice(0, 5).forEach((v, i) => {
    const dev = ((v - data.spacing.declared) / data.spacing.declared) * 100;
    setCell(r, 3 + i, numCell(dev, 2, styleTd), styleTd);
  });
    // Merged I28:K33 below
  r++;

  setMergedRangeWithOutsideBorder(r, 0, r, 2, "Sample No", styleTh);
  ["VI", "VII", "VIII", "IX", "X"].forEach((h, i) => {
    setCell(r, 3 + i, h, styleTh);
  });
    // Merged I28:K33 below
  r++;

  setMergedRangeWithOutsideBorder(r, 0, r, 2, "Spacing (cm)", styleTd);
  data.spacing.values.slice(5, 10).forEach((v, i) => {
    setCell(r, 3 + i, numCell(v, 2, styleTd), styleTd);
  });
    // Merged I28:K33 below
  r++;

  setMergedRangeWithOutsideBorder(r, 0, r, 2, "% Deviation", styleTd);
  data.spacing.values.slice(5, 10).forEach((v, i) => {
    const dev = ((v - data.spacing.declared) / data.spacing.declared) * 100;
    setCell(r, 3 + i, numCell(dev, 2, styleTd), styleTd);
  });
    // Merged I28:K33 below
  r++;

  const avgSpacing = avg(data.spacing.values);
  const avgDevSpacing = ((avgSpacing - data.spacing.declared) / data.spacing.declared) * 100;
  setMergedRangeWithOutsideBorder(r, 0, r, 2, `Declared Spacing (cm) : ${fmt(data.spacing.declared)}`, styleTdBold);
  setMergedRangeWithOutsideBorder(r, 3, r, 6, `Observed Average (cm) : ${fmt(avgSpacing)}`, styleTdBold);
  setMergedRangeWithOutsideBorder(r, 7, r, 10, `Average Deviation (%) : ${fmt(avgDevSpacing)}`, styleTdBold);
  r++;
  setMergedRangeWithOutsideBorder(spacingStartRowRef, 8, r - 2, 10, "", styleTh);
  SPACE();

  // 7. Env Stress Cracking
  writeSectionBar("7", "7. Environmental Stress Cracking Resistance (Acceptance test) (CL 8.7.1 IS - 13488 : 2008) :");
  // Tracked escrTableStartRow dynamically below

  headingRows.add(r);
  const escrStartRow = r;
  setMergedRangeWithOutsideBorder(r, 0, r, 3, "Condition in air circulating oven : 80± 1°C", styleTdBoldHeading);
  setMergedRangeWithOutsideBorder(r, 4, r, 6, "Duration : 1 hr", styleTdBoldHeading);
    // Merged H37:K39 below
  r++;

  setMergedRangeWithOutsideBorder(r, 0, r, 3, "Test Temperature : 77± 3°C", styleTd);
  setMergedRangeWithOutsideBorder(r, 4, r, 6, "Test Duration : 1 hr", styleTd);
    // Merged H37:K39 below
  r++;

  setMergedRangeWithOutsideBorder(r, 0, r, 3, "Reagent : 10 % Igepoal CO-630", styleTd);
  setMergedRangeWithOutsideBorder(r, 4, r, 6, `Specimen Length : ${data.basicInfo.specimenLength}`, styleTd);
    // Merged H37:K39 below
  r++;
  setMergedRangeWithOutsideBorder(escrStartRow, 7, r - 1, 10, "", styleTdHeading);

  const escrTableStartRow = r;
  setMergedRangeWithOutsideBorder(r, 0, r, 2, "Sample No", styleTh);
  ["I", "II", "III", "IV", "V"].forEach((h, i) => {
    setCell(r, 3 + i, h, styleTh);
  });
    // Merged I40:K42 below
  r++;

  setMergedRangeWithOutsideBorder(r, 0, r, 2, "Crack or No Crack", styleTd);
  setMergedRangeWithOutsideBorder(r, 3, r, 7, "No Crack Observed", styleTdCenter);
    // Merged I40:K42 below
  r++;

  setMergedRangeWithOutsideBorder(r, 0, r, 2, "Result", styleTdBold);
  data.envCracking.results.forEach((res, i) => {
    setCell(r, 3 + i, badge(res), styleTd);
  });
  setMergedRangeWithOutsideBorder(escrTableStartRow, 8, r, 10, "", styleTh);
  r++;
  SPACE();

  // 8. Pull Out
  writeSectionBar("8", "8. Resistance to Pull Out of Joint Between Fitting & Emitting Pipe (CL 8.6 IS - 13488 : 2008) :");
  headingRows.add(r);
  setMergedRangeWithOutsideBorder(r, 0, r, 4, `Test duration : ${data.pullOut.testDuration}`, styleTdHeading);
  setMergedRangeWithOutsideBorder(r, 5, r, 10, `Applied load : ${data.pullOut.appliedLoad}`, styleTdHeading);
  r++;

  setMergedRangeWithOutsideBorder(r, 0, r, 10, `Sample : ${data.pullOut.result}`, data.pullOut.result === "PASS" ? stylePassed : styleFailed);
  r++;

  setMergedRangeWithOutsideBorder(r, 0, r, 10, "Remark :- The fitting shall not pull out from the emitting pipe.", styleTdItalic);
  r++;

  } // End of PAGE 1

  // ─── PAGE 2 ───────────────────────────────────────────────────────────────
  if (DEV_ONLY_PAGE === null || DEV_ONLY_PAGE === 2) {
    writePageHeader(DEV_ONLY_PAGE !== null ? 1 : 2);
    SPACE();

  // 9. Uniformity
  writeSectionBar("9", "9. Uniformity of Emission Rate (Cl 8.1 IS - 13488:2008) (C.V. - Max 10% & Mean Deviation - Max 10%)");

  setMergedRangeWithOutsideBorder(r, 0, r, 2, "Sample Size : 25 Emitting Units", styleTh);
  setMergedRangeWithOutsideBorder(r, 3, r, 5, "Test Temperature : 27 ± 3°C", styleTh);
  setMergedRangeWithOutsideBorder(r, 6, r, 8, "Test Duration : 6 minutes", styleTh);
  setMergedRangeWithOutsideBorder(r, 9, r, 10, "", styleTh);
  r++;

  const p2Row5 = ws.getRow(r + 1);
  for (let c = 0; c < 5; c++) {
    setCell(r, c * 2, "Sr. No.", styleTh);
    setCell(r, c * 2 + 1, "Emission rate(LPH)", styleTh);
  }
  setCell(r, 10, "", styleTh);
  p2Row5.height = 27.60;
  (p2Row5 as any).customHeight = true;
  r++;

  for (let rowIdx = 0; rowIdx < 5; rowIdx++) {
    const dataRow = ws.getRow(r + 1);
    dataRow.height = 20.50;
    (dataRow as any).customHeight = true;
    for (let colIdx = 0; colIdx < 5; colIdx++) {
      const idx = rowIdx * 5 + colIdx;
      const sr = String(idx + 1).padStart(2, "0");
      const val = data.uniformity[idx]?.emissionRate ?? 0;
      setCell(r, colIdx * 2, sr, styleTd);
      setCell(r, colIdx * 2 + 1, numCell(val, 2, styleTd), styleTd);
    }
    setCell(r, 10, "", styleTd);
    r++;
  }

  setMergedRangeWithOutsideBorder(r, 0, r, 4, `Mean Emission Rate (Q) : ${fmt(u.meanQ)} LPH`, styleTd);
  setMergedRangeWithOutsideBorder(r, 5, r, 10, `Std. deviation of Emission Rate (Sq) : ${fmt(u.sq, 4)}`, styleTd);
  r++;

  setMergedRangeWithOutsideBorder(r, 0, r, 4, `Declared Emission Rate : ${fmt(u.declaredEmissionRate)} LPH`, styleTd);
  setMergedRangeWithOutsideBorder(r, 5, r, 10, "", styleTd);
  r++;

  const styleTdWrap = {
    ...styleTd,
    alignment: { ...styleTd.alignment, wrapText: true }
  };
  setMergedRangeWithOutsideBorder(r, 0, r, 4, "Deviation : (Mean Emission − Declared Emission) / Declared Emission × 100", styleTdWrap);
  setMergedRangeWithOutsideBorder(r, 5, r, 10, "Co-eff. of Variation (Cv) : Sq / Q × 100", styleTdWrap);
  const p2Row13 = ws.getRow(r + 1);
  p2Row13.height = 33.60;
  (p2Row13 as any).customHeight = true;
  r++;

  setMergedRangeWithOutsideBorder(r, 0, r, 4, `Deviation : ${fmt(u.deviation, 2)} %`, styleTdBold);
  setMergedRangeWithOutsideBorder(r, 5, r, 10, `Co-eff. of Variation (Cv) : ${fmt(u.cv, 4)} %`, styleTdBold);
  r++;

  SPACE();

  // Detailed Uniformity Table
  setMergedRangeWithOutsideBorder(r, 0, r, 10, "Functional Tests: Uniformity of Emission Rate", styleSectionBarCenter);
  r++;

  const calcHeaders = [
    "NO", "Discharge in 360 Sec. (ML)", "Discharge Ltr./ hr. (X)",
    "Mean Emission Rate(q) (X1)", "No.", "Ascending Order",
    "(X-X1)", "(X-X1)²", "Sq = √ (X-X1)² / 25", "CV = (Sq /q × 100)"
  ];
  const p2Row16 = ws.getRow(r + 1);
  calcHeaders.forEach((h, colIdx) => {
    setCell(r, colIdx, h, styleTh);
  });
  setCell(r, 10, "", styleTh);
  p2Row16.height = 55.20;
  (p2Row16 as any).customHeight = true;
  r++;

  u.rows.forEach((row, i) => {
    const dataRow = ws.getRow(r + 1);
    dataRow.height = 20.50;
    (dataRow as any).customHeight = true;
    const styleCell = styleTd;
    const styleCellBold = styleTdBold;

    setCell(r, 0, row.no, styleCell);
    setCell(r, 1, numCell(row.discharge360sec, 0, styleCell), styleCell);
    setCell(r, 2, numCell(row.dischargeLph, 2, styleCell), styleCell);
    setCell(r, 3, numCell(row.meanRateQ1, 4, styleCell), styleCell);
    setCell(r, 4, row.ascNo, styleCell);
    setCell(r, 5, numCell(row.ascValue, 4, styleCell), styleCell);
    setCell(r, 6, numCell(row.xMinusX1, 4, styleCell), styleCell);
    setCell(r, 7, numCell(row.xMinusX1Sq, 5, styleCell), styleCell);
    setCell(r, 8, i === 11 ? numCell(u.sq, 4, styleCellBold) : "", styleCellBold);
    setCell(r, 9, i === 11 ? numCell(u.cv, 4, styleCellBold) : "", styleCellBold);
    setCell(r, 10, "", styleCell);
    r++;
  });

    if (DEV_ONLY_PAGE === 2 || (DEV_ONLY_PAGE === null && isDaily)) {
      blankRows.add(r);
      r++;
      setMergedRange(r, 0, r, COLS - 1, `[Page 2 of ${isDaily ? 2 : 4}]`, stylePageBreak);
      blankRows.add(r);
      r++;
    }
  } // End of PAGE 2

  // ─── PAGE 3 (If Type Test) ────────────────────────────────────────────────
  if (!isDaily && (DEV_ONLY_PAGE === null || DEV_ONLY_PAGE === 3)) {
    writePageHeader(DEV_ONLY_PAGE !== null ? 1 : 3);
    SPACE();

    // 10. Env Stress Cracking Type
    writeSectionBar("10", "10. Environmental Stress Cracking Resistance (Type test) (CL 8.7.2 IS - 13488 : 2008) :");

    setMergedRangeWithOutsideBorder(r, 0, r, 3, "Test Temperature : 77± 3°C", styleTd);
    setMergedRangeWithOutsideBorder(r, 4, r, 6, "Test Duration : 48 hrs", styleTd);
    setMergedRangeWithOutsideBorder(r, 7, r + 1, 10, "", styleTd);
    r++;

    setMergedRangeWithOutsideBorder(r, 0, r, 3, "Reagent : 10 % Igepoal CO-630", styleTd);
    setMergedRangeWithOutsideBorder(r, 4, r, 6, `Specimen Length : ${data.basicInfo.specimenLength}`, styleTd);
    r++;

    setMergedRangeWithOutsideBorder(r, 0, r, 2, "Sample No", styleTh);
    ["I", "II", "III", "IV", "V"].forEach((h, i) => {
      setCell(r, 3 + i, h, styleTh);
    });
    setMergedRangeWithOutsideBorder(r, 8, r + 2, 10, "", styleTh);
    r++;

    setMergedRangeWithOutsideBorder(r, 0, r, 2, "Crack or No Crack", styleTd);
    setMergedRangeWithOutsideBorder(r, 3, r, 7, "No Crack Observed", styleTdCenter);
    r++;

    setMergedRangeWithOutsideBorder(r, 0, r, 2, "Result", styleTdBold);
    data.envCrackingType.results.forEach((res, i) => {
      setCell(r, 3 + i, badge(res), styleTd);
    });
    r++;
    SPACE();

    // 11 & 12. Hydraulic
    const writeHydraulicExcel = (n: number, title: string, intro: string[], before: number[], after: number[], avgDev: number, spec: string, remarks: string[]) => {
      writeSectionBar(String(n), `${n}. ${title} :`);
      
      intro.forEach(line => {
        setMergedRangeWithOutsideBorder(r, 0, r, 10, line, styleTdLeft);
        r++;
      });

      setMergedRangeWithOutsideBorder(r, 0, r, 2, "Sample No", styleTh);
      ["I", "II", "III", "IV", "V"].forEach((h, i) => {
        setCell(r, 3 + i, h, styleTh);
      });
      setMergedRangeWithOutsideBorder(r, 8, r + 3, 10, "", styleTh);
      r++;

      setMergedRangeWithOutsideBorder(r, 0, r, 2, "Discharge Before Test (LPH)", styleTd);
      before.forEach((v, i) => {
        setCell(r, 3 + i, numCell(v, 2, styleTd), styleTd);
      });
      r++;

      setMergedRangeWithOutsideBorder(r, 0, r, 2, "Discharge After Test (LPH)", styleTd);
      after.forEach((v, i) => {
        setCell(r, 3 + i, numCell(v, 2, styleTd), styleTd);
      });
      r++;

      setMergedRangeWithOutsideBorder(r, 0, r, 2, "Deviation ( % )", styleTd);
      before.forEach((v, i) => {
        const dev = v ? ((after[i] ?? 0) - v) / v * 100 : 0;
        setCell(r, 3 + i, numCell(dev, 2, styleTd), styleTd);
      });
      r++;

      setMergedRangeWithOutsideBorder(r, 0, r, 10, "Remark :", styleTdLeftBold);
      r++;

      setMergedRangeWithOutsideBorder(r, 0, r, 5, remarks[0], styleTdLeft);
      setMergedRangeWithOutsideBorder(r, 6, r + 1, 10, `Specified Requirement : ${spec}`, styleTdCenterBold);
      r++;

      setMergedRangeWithOutsideBorder(r, 0, r, 5, remarks[1], styleTdLeft);
      r++;
      SPACE();
    };

    writeHydraulicExcel(
      11,
      "Resistance to Hydraulic Pressure at Ambient Temp. (CL 8.4.1 IS - 13488 : 2008)",
      [
        "Sample : 5 emitting units joined together by center fitting",
        "conditioning : With Hydraulic Pressure of 1.8 x Pmax(1.8)= 3.24 kg/cm² for 1 hr.",
        "Emission rate : At Pn=1 kg/cm² for 6 minutes."
      ],
      data.hydraulicAmbient.dischargeBefore,
      data.hydraulicAmbient.dischargeAfter,
      ambAvgDev,
      "± 10%",
      [
        "(1) No sign of Leakage and not pull a part.",
        `(2) Variation in nominal flow rate : ${fmt(ambAvgDev, 2)} %`
      ]
    );

    writeHydraulicExcel(
      12,
      "Resistance to Hydraulic Pressure at Elevated Temp. (CL 8.4.2 IS - 13488 : 2008)",
      [
        "Sample : 5 emitting units joined together by center fitting",
        "conditioning : With Hydraulic Pressure of Pmax = 1.8 kg/cm² for 48 hrs.",
        "Emission rate : At Pn=1 kg/cm² for 6 minutes."
      ],
      data.hydraulicElevated.dischargeBefore,
      data.hydraulicElevated.dischargeAfter,
      eleAvgDev,
      "± 10%",
      [
        "(1) No sign of Damage to the emitting unit or the connecting fittings.",
        `(2) Variation in nominal flow rate : ${fmt(eleAvgDev, 2)} %`
      ]
    );

    // 13. Tension
    writeSectionBar("13", "13. Resistance to Tension at Elevated Temp. (CL 8.5 IS - 13488 : 2008) :");

    setMergedRangeWithOutsideBorder(r, 0, r, 4, "Sample : 5 Emitting Unit", styleTd);
    setMergedRangeWithOutsideBorder(r, 5, r, 10, "Test Duration : 15 Minutes", styleTd);
    r++;

    setMergedRangeWithOutsideBorder(r, 0, r, 4, "Test Temperature : 50± 2°C", styleTd);
    setMergedRangeWithOutsideBorder(r, 5, r, 10, `Applied Load : ${data.tension.appliedLoad}`, styleTd);
    r++;

    setMergedRangeWithOutsideBorder(r, 0, r, 2, "Sample No", styleTh);
    ["I", "II", "III", "IV", "V"].forEach((h, i) => {
      setCell(r, 3 + i, h, styleTh);
    });
    setMergedRangeWithOutsideBorder(r, 8, r, 10, "", styleTh);
    r++;

    setMergedRangeWithOutsideBorder(r, 0, r, 2, "Discharge Before Test (LPH)", styleTd);
    data.tension.dischargeBefore.forEach((v, i) => {
      setCell(r, 3 + i, numCell(v, 2, styleTd), styleTd);
    });
    setMergedRangeWithOutsideBorder(r, 8, r, 10, "", styleTd);
    r++;

    setMergedRangeWithOutsideBorder(r, 0, r, 2, "Discharge After Test (LPH)", styleTd);
    data.tension.dischargeAfter.forEach((v, i) => {
      setCell(r, 3 + i, numCell(v, 2, styleTd), styleTd);
    });
    setMergedRangeWithOutsideBorder(r, 8, r, 10, "", styleTd);
    r++;

    setMergedRangeWithOutsideBorder(r, 0, r, 2, "Deviation ( % )", styleTd);
    data.tension.dischargeBefore.forEach((v, i) => {
      const a = data.tension.dischargeAfter[i] ?? 0;
      const dev = v ? ((a - v) / v) * 100 : 0;
      setCell(r, 3 + i, numCell(dev, 2, styleTd), styleTd);
    });
    setMergedRangeWithOutsideBorder(r, 8, r, 10, "", styleTd);
    r++;

    setMergedRangeWithOutsideBorder(r, 0, r, 2, "Length Before Test (mm)", styleTd);
    data.tension.lengthBefore.forEach((v, i) => {
      setCell(r, 3 + i, numCell(v, 2, styleTd), styleTd);
    });
    setMergedRangeWithOutsideBorder(r, 8, r, 10, "", styleTd);
    r++;

    setMergedRangeWithOutsideBorder(r, 0, r, 2, "Length After Test (mm)", styleTd);
    data.tension.lengthAfter.forEach((v, i) => {
      setCell(r, 3 + i, numCell(v, 2, styleTd), styleTd);
    });
    setMergedRangeWithOutsideBorder(r, 8, r, 10, "", styleTd);
    r++;

    setMergedRangeWithOutsideBorder(r, 0, r, 2, "Deviation ( % )", styleTd);
    data.tension.lengthBefore.forEach((v, i) => {
      const a = data.tension.lengthAfter[i] ?? 0;
      const dev = v ? ((a - v) / v) * 100 : 0;
      setCell(r, 3 + i, numCell(dev, 2, styleTd), styleTd);
    });
    setMergedRangeWithOutsideBorder(r, 8, r, 10, "", styleTd);
    r++;

    setMergedRangeWithOutsideBorder(r, 0, r, 10, "Remark :", styleTdLeftBold);
    r++;

    setMergedRangeWithOutsideBorder(r, 0, r, 10, "(1) Emitting Pipe did withstand the test pull without breaking & tearing.", styleTdLeft);
    r++;

    setMergedRangeWithOutsideBorder(r, 0, r, 6, `(2) Variation in nominal flow rate : ${fmt(tenAvgDisDev, 2)} %`, styleTdLeft);
    setMergedRangeWithOutsideBorder(r, 7, r, 10, "Specified Requirement : ± 5%", styleTdCenterBold);
    r++;

    setMergedRangeWithOutsideBorder(r, 0, r, 6, `(3) The distance between two marked lines varies : ${fmt(tenAvgLenDev, 2)} %`, styleTdLeft);
    setMergedRangeWithOutsideBorder(r, 7, r, 10, "Specified Requirement : ± 5%", styleTdCenterBold);
    r++;

    if (DEV_ONLY_PAGE === 3) {
      blankRows.add(r);
      r++;
      setMergedRange(r, 0, r, COLS - 1, `[Page 3 of 4]`, stylePageBreak);
      blankRows.add(r);
      r++;
    }
  } // End of PAGE 3

  // ─── PAGE 4 (If Type Test) ────────────────────────────────────────────────
  if (!isDaily && (DEV_ONLY_PAGE === null || DEV_ONLY_PAGE === 4)) {
    writePageHeader(DEV_ONLY_PAGE !== null ? 1 : 4);
    SPACE();

    // 14. Pressure Variation
    writeSectionBar("14", "14. Variation of Flow Rate with Pressure (CL 8.2 IS - 13488 : 2008)");

    const pHeaders = ["Sr. No.", "Pressure Kg/sq.cm", "3", "12", "13", "23", "Average (ml)", "Discharge in LPH", "Declared Discharge in LPH"];
    pHeaders.forEach((h, i) => {
      const cellStyle = (i >= 6 && i <= 8) ? styleTh10 : styleTh;
      setCell(r, i, h, cellStyle);
    });
    setMergedRangeWithOutsideBorder(r, 9, r, 10, "Variation %", styleTh);
    const pHeadersRow = ws.getRow(r + 1);
    pHeadersRow.height = 41.40;
    (pHeadersRow as any).customHeight = true;
    r++;

    finalPressureRows.forEach((pr, i) => {
      const a = avg(pr.readings);
      const lph = a / 100;
      const variation = pr.declared ? ((lph - pr.declared) / pr.declared) * 100 : 0;
      const styleCell = styleTd;
      const styleCellBold = styleTdBold;

      setCell(r, 0, i + 1, styleCell);
      setCell(r, 1, numCell(pr.pressure, 1, styleCell), styleCell);
      pr.readings.forEach((v, j) => {
        setCell(r, 2 + j, numCell(v, 0, styleCell), styleCell);
      });
      setCell(r, 6, numCell(a, 2, styleCell), styleCell);
      setCell(r, 7, numCell(lph, 2, styleCellBold), styleCellBold);
      setCell(r, 8, numCell(pr.declared, 2, styleCell), styleCell);
      setMergedRangeWithOutsideBorder(r, 9, r, 10, numCell(variation, 1, styleCell), styleCell);
      r++;
    });
    SPACE();
    for (let colIdx = 1; colIdx <= 11; colIdx++) {
      ws.getRow(r).getCell(colIdx).border = { top: { style: "thin" as const, color: { argb: "FF000000" } } };
    }

    if (typeof document !== "undefined") {
      try {
        const chartBase64 = generatePressureChartBase64(finalPressureRows);
        if (chartBase64) {
          const chartImgId = workbook.addImage({
            base64: chartBase64,
            extension: "png",
          });
          setMergedRange(r, 0, r + 15, 10, "", { fill: fillWhite });
          ws.addImage(chartImgId, {
            tl: { col: 0, row: r } as any,
            br: { col: 11, row: r + 16 } as any,
            editAs: "oneCell"
          });
          for (let cRowIdx = r; cRowIdx <= r + 15; cRowIdx++) {
            headingRows.add(cRowIdx);
            chartRows.add(cRowIdx);
            const rowObj = ws.getRow(cRowIdx + 1);
            for (let colIdx = 1; colIdx <= 11; colIdx++) {
              rowObj.getCell(colIdx).border = {};
            }
          }
          r += 16;
          SPACE();
          for (let colIdx = 1; colIdx <= 11; colIdx++) {
            ws.getRow(r).getCell(colIdx).border = { bottom: { style: "thin" as const, color: { argb: "FF000000" } } };
          }
        }
      } catch (err) {
        console.warn("Could not generate pressure chart:", err);
      }
    }

    // 15. Emitter Exponent
    writeSectionBar("15", "15. Determination of Emitting Unit Exponent (CL 8.8 IS - 13488 : 2008) {'m' shall be less than 0.5}");
    ws.getRow(r).height = 27.60;
    (ws.getRow(r) as any).customHeight = true;

    setMergedRangeWithSideBorderOnly(r, 0, r, 10, "Formula:  q̄ = K · p^m", styleTdItalicBoldLeft);
    r++;
    setMergedRangeWithSideBorderOnly(r, 0, r, 10, "m = [ Σ (log pi)(log qi) − 1/n (Σ log pi)(Σ log qi) ] / [ Σ (log pi)² − 1/n (Σ log pi)² ]", styleTdItalicBoldLeft);
    r++;
    setMergedRangeWithSideBorderOnly(r, 0, r, 10, "Where: q = emission rate (LPH)", styleTdItalic);
    r++;
    setMergedRangeWithSideBorderOnly(r, 0, r, 10, "k = constant", styleTdItalic);
    r++;
    setMergedRangeWithSideBorderOnly(r, 0, r, 10, "p = inlet pressure (KPa)", styleTdItalic);
    r++;
    setMergedRangeWithSideBorderOnly(r, 0, r, 10, "m = emitting unit exponent", styleTdItalic);
    r++;
    setMergedRangeWithSideBorderOnly(r, 0, r, 10, "n = number of pressure values", styleTdItalic);
    r++;
    setMergedRangeWithSideBorderOnly(r, 0, r, 10, "i = serial number of reading (1 to n)", styleTdItalic);
    r++;

    setCell(r, 0, "No", styleTh);
    setMergedRangeWithOutsideBorder(r, 1, r, 2, "pi (kg/sq. cm)", styleTh);
    setCell(r, 3, "pi (KPa)", styleTh);
    setCell(r, 4, "qi (LPH)", styleTh);
    setCell(r, 5, "log pi", styleTh);
    setCell(r, 6, "log qi", styleTh);
    setMergedRangeWithOutsideBorder(r, 7, r, 8, "(log pi)(log qi)", styleTh);
    setMergedRangeWithOutsideBorder(r, 9, r, 10, "(log pi)²", styleTh);
    headingRows.add(r);
    ws.getRow(r + 1).height = 27.60;
    (ws.getRow(r + 1) as any).customHeight = true;
    r++;

    exp.rows.forEach((row, i) => {
      const styleCell = styleTd;

      setCell(r, 0, row.no, styleCell);
      setMergedRangeWithOutsideBorder(r, 1, r, 2, numCell(row.pi_kg, 2, styleCell), styleCell);
      setCell(r, 3, numCell(row.pi_kpa, 4, styleCell), styleCell);
      setCell(r, 4, numCell(row.qi, 4, styleCell), styleCell);
      setCell(r, 5, numCell(row.logPi, 4, styleCell), styleCell);
      setCell(r, 6, numCell(row.logQi, 4, styleCell), styleCell);
      setMergedRangeWithOutsideBorder(r, 7, r, 8, numCell(row.logPi_logQi, 4, styleCell), styleCell);
      setMergedRangeWithOutsideBorder(r, 9, r, 10, numCell(row.logPi_sq, 4, styleCell), styleCell);
      r++;
    });

    setMergedRangeWithOutsideBorder(r, 0, r, 4, "Sum (Σ)", styleTdShadedBold);
    setCell(r, 5, numCell(exp.sumLogPi, 4, styleTdShadedBold), styleTdShadedBold);
    setCell(r, 6, numCell(exp.sumLogQi, 4, styleTdShadedBold), styleTdShadedBold);
    setMergedRangeWithOutsideBorder(r, 7, r, 8, numCell(exp.sumLogPiLogQi, 4, styleTdShadedBold), styleTdShadedBold);
    setMergedRangeWithOutsideBorder(r, 9, r, 10, numCell(exp.sumLogPiSq, 4, styleTdShadedBold), styleTdShadedBold);
    r++;

    setMergedRangeWithOutsideBorder(r, 0, r, 10, `m = [ ${fmt(exp.sumLogPiLogQi, 4)} − 0.25 × (${fmt(exp.sumLogPi, 4)}) × (${fmt(exp.sumLogQi, 4)}) ] / [ ${fmt(exp.sumLogPiSq, 4)} − 0.25 × (${fmt(exp.sumLogPi, 4)})² ]`, styleTdItalic);
    r++;

    const numValCalc = exp.sumLogPiLogQi - 0.25 * exp.sumLogPi * exp.sumLogQi;
    const denValCalc = exp.sumLogPiSq - 0.25 * exp.sumLogPi * exp.sumLogPi;
    setMergedRangeWithOutsideBorder(r, 0, r, 10, `m = ${fmt(numValCalc, 4)} / ${fmt(denValCalc, 4)}`, styleTdItalic);
    r++;

    const isMValid = exp.m < 0.5;
    setMergedRangeWithOutsideBorder(r, 0, r, 10, `m = ${fmt(exp.m, 4)}  —  ${isMValid ? "PASSED (< 0.5000)" : "FAILED (≥ 0.5000)"}`, isMValid ? stylePassed : styleFailed);
    r++;

    if (DEV_ONLY_PAGE === 4 || (DEV_ONLY_PAGE === null && !isDaily)) {
      blankRows.add(r);
      r++;
      setMergedRange(r, 0, r, COLS - 1, `[Page 4 of 4]`, stylePageBreak);
      blankRows.add(r);
      r++;
    }
  }

  // Explicitly enforce exact row heights right before workbook generation
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 18) {
      row.height = 27.60;
      (row as any).customHeight = true;
      return;
    }
    if ((row as any).customHeight) {
      return;
    }
    const rIdx = rowNumber - 1;
    if (blankRows.has(rIdx)) {
      row.height = 12.00;
      (row as any).customHeight = true;
      return;
    }
    if (rowNumber === 1 || rowNumber === 2 || headingRows.has(rIdx)) {
      row.height = 21.00;
      (row as any).customHeight = true;
    } else {
      row.height = 19.20;
      (row as any).customHeight = true;
    }
  });

  // Apply rightside border in K column across all pages up to r
  for (let rowIdx = 0; rowIdx < r; rowIdx++) {
    const row = ws.getRow(rowIdx + 1);
    const cell = row.getCell(11);
    const cell0 = row.getCell(1);
    const isPageBreakStr = typeof cell0.value === "string" && cell0.value.startsWith("[Page ");
    if (!isPageBreakStr && !blankRows.has(rowIdx) && !chartRows.has(rowIdx)) {
      const currentBorder = cell.border || {};
      cell.border = {
        ...currentBorder,
        right: { style: 'thin' as const, color: { argb: 'FF000000' } }
      };
    }
  }

  // Set explicit column widths matching demo file exactly
  const colWidths = [10.78, 10.78, 11.56, 10.44, 10.44, 10.44, 11.44, 10.44, 10.44, 10.56, 11.11];
  colWidths.forEach((w, i) => {
    ws.getColumn(i + 1).width = w;
  });

  // ─── Generate workbook and download ───────────────────────────────────────
  const filename = [b.mcNo, b.batchNo].filter(Boolean).join("_").replace(/[\/\\?%*:|"<>]/g, "-");
  
  // ─── Final explicit height guarantee for Page 1 header rows ─────────────────
  // Apply AFTER all cell writes and eachRow pass to ensure nothing resets them.
  ws.getRow(1).height = 21;
  (ws.getRow(1) as any).customHeight = true;
  ws.getRow(2).height = 21;
  (ws.getRow(2) as any).customHeight = true;

  workbook.xlsx.writeBuffer().then((buffer) => {
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}_IS13488.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  }).catch((err) => {
    console.error("ExcelJS writeBuffer failed:", err);
  });
}
