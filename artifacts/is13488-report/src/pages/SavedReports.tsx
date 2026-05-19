import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ArrowLeft, Eye, Printer, Trash2, Pencil, Download, FileText, 
  CheckSquare, Square, Trash, Archive, X, CheckCircle2, Search, Filter,
  ChevronDown, Tag
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { getReports, deleteReport } from "@/lib/storage";
import type { ReportData } from "@/lib/types";
import { getCurrentStandard } from "@/standards/registry";
import { HeaderActions } from "@/components/HeaderActions";
// JSZip removed as requested

function getWeekRangeStr(dateStr: string): string {
  if (!dateStr) return "Unknown Week";
  const parts = dateStr.split('/');
  if (parts.length !== 3) return "Unknown Week";
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // 0-indexed month
  const year = parseInt(parts[2], 10);
  const date = new Date(year, month, day);
  if (isNaN(date.getTime())) return "Unknown Week";

  // Get Monday as start of the week
  const dayOfWeek = date.getDay(); // 0 is Sunday, 1 is Monday, ...
  const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const startOfWeek = new Date(date.setDate(diff));

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  const pad = (n: number) => String(n).padStart(2, '0');
  const startStr = `${pad(startOfWeek.getDate())}/${pad(startOfWeek.getMonth() + 1)}/${startOfWeek.getFullYear()}`;
  const endStr = `${pad(endOfWeek.getDate())}/${pad(endOfWeek.getMonth() + 1)}/${endOfWeek.getFullYear()}`;

  // Get week number
  const tempDate = new Date(startOfWeek.getFullYear(), 0, 1);
  const days = Math.floor((startOfWeek.getTime() - tempDate.getTime()) / (24 * 60 * 60 * 1000));
  const weekNum = Math.ceil((days + tempDate.getDay() + 1) / 7);

  return `Week ${weekNum} (${startStr} - ${endStr})`;
}

function getMonthStr(dateStr: string): string {
  if (!dateStr) return "Unknown Month";
  const parts = dateStr.split('/');
  if (parts.length !== 3) return "Unknown Month";
  const monthNum = parseInt(parts[1], 10);
  const year = parts[2];
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  if (monthNum >= 1 && monthNum <= 12) {
    return `${months[monthNum - 1]} ${year}`;
  }
  return "Unknown Month";
}

export default function SavedReports() {
  const getReportFilename = (r: ReportData): string => {
    const is13487 = r.basicInfo.formatNo?.includes("13487");
    let filename = `${r.basicInfo.mcNo}_${r.basicInfo.batchNo}`;
    if (is13487) {
      const size = r.basicInfo.size || "";
      const sizeClean = size.toUpperCase().replace(/\s*LPH\s*/i, "").trim();
      filename = `${sizeClean} LPH ${r.basicInfo.batchNo}`;
    }
    return filename.replace(/[\/\\?%*:|"<>]/g, '-');
  };

  const [, navigate] = useLocation();
  const [reports, setReports] = useState<ReportData[]>(getReports());
  const [viewing, setViewing] = useState<ReportData | null>(null);

  const [downloadingReport, setDownloadingReport] = useState<ReportData | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  // Batch selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const [filterType, setFilterType] = useState<string>("all");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [selectedMcNoFilters, setSelectedMcNoFilters] = useState<string[]>([]);
  const [selectedSizeFilters, setSelectedSizeFilters] = useState<string[]>([]);

  const filterOptions = useMemo(() => {
    const weekLabels = reports.map(r => getWeekRangeStr(r.basicInfo.dateOfTest))
      .filter(w => w !== "Unknown Week");
    const uniqueWeeks = Array.from(new Set(weekLabels)).sort((a, b) => {
      const matchA = a.match(/\((\d{2})\/(\d{2})\/(\d{4})/);
      const matchB = b.match(/\((\d{2})\/(\d{2})\/(\d{4})/);
      if (matchA && matchB) {
        const dateA = new Date(parseInt(matchA[3]), parseInt(matchA[2]) - 1, parseInt(matchA[1]));
        const dateB = new Date(parseInt(matchB[3]), parseInt(matchB[2]) - 1, parseInt(matchB[1]));
        return dateB.getTime() - dateA.getTime(); // Descending order
      }
      return b.localeCompare(a);
    });

    const monthLabels = reports.map(r => getMonthStr(r.basicInfo.dateOfTest))
      .filter(m => m !== "Unknown Month");
    const uniqueMonths = Array.from(new Set(monthLabels)).sort((a, b) => {
      const matchA = a.split(' ');
      const matchB = b.split(' ');
      if (matchA.length === 2 && matchB.length === 2) {
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const monthA = months.indexOf(matchA[0]);
        const monthB = months.indexOf(matchB[0]);
        const yearA = parseInt(matchA[1]);
        const yearB = parseInt(matchB[1]);
        if (yearA !== yearB) return yearB - yearA;
        return monthB - monthA;
      }
      return b.localeCompare(a);
    });

    const options: Record<string, string[]> = {
      mcNo: Array.from(new Set(reports.map(r => r.basicInfo.mcNo))).sort(),
      dateOfTest: Array.from(new Set(reports.map(r => r.basicInfo.dateOfTest))).sort(),
      week: uniqueWeeks,
      month: uniqueMonths,
      size: Array.from(new Set(reports.map(r => r.basicInfo.size))).sort(),
      batchNo: Array.from(new Set(reports.map(r => r.basicInfo.batchNo))).sort(),
    };
    return options;
  }, [reports]);

  const filteredReports = useMemo(() => {
    const hasMainFilter = filterType !== "all" && selectedFilters.length > 0;
    const hasMcNoFilter = selectedMcNoFilters.length > 0;
    const hasSizeFilter = selectedSizeFilters.length > 0;
    
    if (!hasMainFilter && !hasMcNoFilter && !hasSizeFilter) return reports;

    const currentStandardId = getCurrentStandard().id;
    const isDateFilter = ["dateOfTest", "month", "week"].includes(filterType);

    return reports.filter(r => {
      const b = r.basicInfo;

      // 1. Primary main filter check
      if (hasMainFilter) {
        let val = "";
        if (filterType === "mcNo") val = b.mcNo;
        else if (filterType === "dateOfTest") val = b.dateOfTest;
        else if (filterType === "week") val = getWeekRangeStr(b.dateOfTest);
        else if (filterType === "month") val = getMonthStr(b.dateOfTest);
        else if (filterType === "size") val = b.size;
        else if (filterType === "batchNo") val = b.batchNo;

        if (!selectedFilters.includes(val)) return false;
      }

      // 2. Secondary Machine Number filter check
      if (isDateFilter && currentStandardId === "is13488" && hasMcNoFilter) {
        if (!selectedMcNoFilters.includes(b.mcNo)) return false;
      }

      // 3. Secondary Size filter check
      if (isDateFilter && (currentStandardId === "is13488" || currentStandardId === "is13487") && hasSizeFilter) {
        if (!selectedSizeFilters.includes(b.size)) return false;
      }

      return true;
    });
  }, [reports, filterType, selectedFilters, selectedMcNoFilters, selectedSizeFilters]);

  const toggleFilter = (val: string) => {
    setSelectedFilters(prev => 
      prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
    );
  };
 
  useEffect(() => {
    const handleSync = () => {
      setReports(getReports());
    };
    window.addEventListener('cloud-sync-complete', handleSync);
    return () => window.removeEventListener('cloud-sync-complete', handleSync);
  }, []);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const visibleIds = filteredReports.map(r => r.id);
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.includes(id));
    
    if (allVisibleSelected) {
      setSelectedIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...visibleIds])]);
    }
  };

  const exportPDFBlob = async (r: ReportData): Promise<Blob> => {
    setDownloadingReport(r);
    // Reduced wait time from 1200ms to 600ms for faster processing.
    // This is generally sufficient for Recharts to initialize.
    await new Promise(resolve => setTimeout(resolve, 600));
    
    try {
      const container = document.getElementById('download-target');
      if (!container) throw new Error("Container not found");
      
      const pages = container.querySelectorAll(".report-page");
      if (pages.length === 0) throw new Error("No pages found");
      
      // @ts-ignore
      const jsPDFLib = window.jspdf?.jsPDF || window.jsPDF;
      // @ts-ignore
      const html2canvasLib = window.html2canvas;
      
      if (!jsPDFLib || !html2canvasLib) throw new Error("PDF libraries not loaded");
      
      const pdf = new jsPDFLib('p', 'mm', [210, 294.1]);
      
      for (let i = 0; i < pages.length; i++) {
        const canvas = await html2canvasLib(pages[i], {
          scale: 2.5, // Restored to 2.5 as requested
          useCORS: true,
          backgroundColor: '#ffffff',
          scrollY: 0,
          scrollX: 0,
          logging: false
        });
        
        const imgData = canvas.toDataURL('image/jpeg', 0.9);
        if (i > 0) pdf.addPage([210, 294.1], 'p');
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 294.1);
      }
      
      return pdf.output('blob');
    } finally {
      setDownloadingReport(null);
    }
  };

  const exportPDF = async (r: ReportData) => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const blob = await exportPDFBlob(r);
      const filename = getReportFilename(r);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleBatchDelete = () => {
    if (confirm(`Delete ${selectedIds.length} selected reports? This action cannot be undone.`)) {
      selectedIds.forEach(id => deleteReport(id));
      const remaining = getReports();
      setReports(remaining);
      setSelectedIds([]);
    }
  };

  const handleBatchDownload = async () => {
    if (isBatchProcessing) return;
    setIsBatchProcessing(true);
    setBatchProgress({ current: 0, total: selectedIds.length });
    
    try {
      for (let i = 0; i < selectedIds.length; i++) {
        const id = selectedIds[i];
        const r = reports.find(report => report.id === id);
        if (!r) continue;
        
        setBatchProgress(prev => ({ ...prev, current: i + 1 }));
        const blob = await exportPDFBlob(r);
        const filename = getReportFilename(r);
        
        // Trigger individual download
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        // Wait between individual downloads to avoid browser block and keep UI responsive
        await new Promise(r => setTimeout(r, 600));
      }
      setSelectedIds([]);
    } catch (err) {
      console.error("Batch download failed:", err);
      alert("Batch download failed. Some reports might be missing.");
    } finally {
      setIsBatchProcessing(false);
      setBatchProgress({ current: 0, total: 0 });
    }
  };

  if (viewing) {
    const filename = getReportFilename(viewing);
    
    const handlePrint = () => {
      const oldTitle = document.title;
      document.title = filename;
      window.print();
      document.title = oldTitle;
    };

    const handleExport = async () => {
      if (isExporting) return;
      setIsExporting(true);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      try {
        const pages = document.querySelectorAll(".print-area .report-page");
        if (pages.length === 0) throw new Error("No pages found");
        
        // @ts-ignore
        const jsPDFLib = window.jspdf?.jsPDF || window.jsPDF;
        // @ts-ignore
        const html2canvasLib = window.html2canvas;
        
        if (!jsPDFLib || !html2canvasLib) throw new Error("PDF libraries not loaded");
        
        const pdf = new jsPDFLib('p', 'mm', [210, 294.1]);
        for (let i = 0; i < pages.length; i++) {
          const canvas = await html2canvasLib(pages[i], {
            scale: 3,
            useCORS: true,
            backgroundColor: '#ffffff',
            scrollY: 0,
            scrollX: 0,
            logging: false
          });
          const imgData = canvas.toDataURL('image/jpeg', 0.95);
          if (i > 0) pdf.addPage([210, 294.1], 'p');
          pdf.addImage(imgData, 'JPEG', 0, 0, 210, 294.1);
        }
        pdf.save(`${filename}.pdf`);
      } catch (err) {
        console.error("Export failed:", err);
        alert("Failed to generate PDF. Please try again.");
      } finally {
        setIsExporting(false);
      }
    };

    return (
      <div className="min-h-screen bg-slate-100/50">
        <HeaderActions>
          <div className="flex items-center gap-2 pr-4 border-r mr-2">
            <Button variant="ghost" size="sm" onClick={() => setViewing(null)}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
              {filename}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-1" />
            Print
          </Button>
          <Button size="sm" onClick={handleExport} disabled={isExporting} className="bg-emerald-600 hover:bg-emerald-700">
            <Download className="w-4 h-4 mr-1" />
            {isExporting ? 'Generating...' : 'PDF'}
          </Button>
        </HeaderActions>
        <div className="py-8">
          {(() => {
            const Template = getCurrentStandard().components.Template;
            return <Template data={viewing} isExporting={isExporting} />;
          })()}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl pb-32">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-600 p-2 rounded-lg text-white">
            <FileText className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Saved Reports</h1>
        </div>
        <div className="flex gap-2">
          {reports.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleSelectAll}
              className="text-slate-600"
            >
              {selectedIds.length === reports.length ? <CheckSquare className="w-4 h-4 mr-2" /> : <Square className="w-4 h-4 mr-2" />}
              {selectedIds.length === reports.length ? "Deselect All" : "Select All"}
            </Button>
          )}
          <Button onClick={() => navigate("/")} variant="outline" size="sm">
            Home
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        {reports.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium">No reports found.</p>
            <Button className="mt-4" onClick={() => navigate("/new")}>
              Create New Report
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 min-w-[80px]">
                  <Filter className="w-4 h-4" /> Filter By:
                </div>
                <Select value={filterType} onValueChange={(v) => { setFilterType(v); setSelectedFilters([]); setSelectedMcNoFilters([]); setSelectedSizeFilters([]); }}>
                  <SelectTrigger className="w-[180px] bg-white border-slate-200">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Reports</SelectItem>
                    <SelectItem value="mcNo">M/C No</SelectItem>
                    <SelectItem value="dateOfTest">Date</SelectItem>
                    <SelectItem value="month">Month</SelectItem>
                    <SelectItem value="week">Week</SelectItem>
                    <SelectItem value="size">Size</SelectItem>
                    <SelectItem value="batchNo">Batch No</SelectItem>
                  </SelectContent>
                </Select>

                {filterType !== "all" && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setSelectedFilters([]);
                      setSelectedMcNoFilters([]);
                      setSelectedSizeFilters([]);
                    }}
                    className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 ml-auto"
                  >
                    Clear Filter
                  </Button>
                )}
              </div>

              {filterType !== "all" && (
                <div className="space-y-4 pt-2 border-t border-slate-200 mt-2">
                  {/* Category 1: Main Selected Filter Group */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Select {filterType === "dateOfTest" ? "Date" : filterType === "week" ? "Week" : filterType === "month" ? "Month" : filterType === "size" ? "Size" : filterType === "mcNo" ? "M/C No" : "Batch No"}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {filterOptions[filterType].map(val => (
                        <Badge 
                          key={val}
                          variant={selectedFilters.includes(val) ? "default" : "outline"}
                          className={`cursor-pointer px-3 py-1 text-xs transition-all ${
                            selectedFilters.includes(val) 
                              ? "bg-emerald-600 hover:bg-emerald-700 border-emerald-600" 
                              : "bg-white hover:bg-slate-100 text-slate-600 border-slate-300"
                          }`}
                          onClick={() => toggleFilter(val)}
                        >
                          {val}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Category 2: Machine (M/C No) Filter - conditional for Date, Month, Week under IS 13488 */}
                  {["dateOfTest", "month", "week"].includes(filterType) && getCurrentStandard().id === "is13488" && (
                    <div className="flex flex-col gap-1.5 pt-3 border-t border-slate-150">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Tag className="w-3 h-3 text-slate-400" /> Filter by Machine (M/C No)
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {filterOptions.mcNo.map(val => (
                          <Badge 
                            key={val}
                            variant={selectedMcNoFilters.includes(val) ? "default" : "outline"}
                            className={`cursor-pointer px-3 py-1 text-xs transition-all ${
                              selectedMcNoFilters.includes(val) 
                                ? "bg-emerald-600 hover:bg-emerald-700 border-emerald-600" 
                                : "bg-white hover:bg-slate-100 text-slate-600 border-slate-300"
                            }`}
                            onClick={() => setSelectedMcNoFilters(prev => 
                              prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
                            )}
                          >
                            {val}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Category 3: Size Filter - conditional for Date, Month, Week under IS 13488 or IS 13487 */}
                  {["dateOfTest", "month", "week"].includes(filterType) && (getCurrentStandard().id === "is13488" || getCurrentStandard().id === "is13487") && (
                    <div className="flex flex-col gap-1.5 pt-3 border-t border-slate-150">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Filter className="w-3 h-3 text-slate-400" /> Filter by Size
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {filterOptions.size.map(val => (
                          <Badge 
                            key={val}
                            variant={selectedSizeFilters.includes(val) ? "default" : "outline"}
                            className={`cursor-pointer px-3 py-1 text-xs transition-all ${
                              selectedSizeFilters.includes(val) 
                                ? "bg-emerald-600 hover:bg-emerald-700 border-emerald-600" 
                                : "bg-white hover:bg-slate-100 text-slate-600 border-slate-300"
                            }`}
                            onClick={() => setSelectedSizeFilters(prev => 
                              prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
                            )}
                          >
                            {val}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {filteredReports.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                <Search className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No reports match the selected filters.</p>
                <Button variant="ghost" size="sm" onClick={() => { setFilterType("all"); setSelectedFilters([]); setSelectedMcNoFilters([]); setSelectedSizeFilters([]); }} className="mt-2 text-emerald-600">
                  Reset Filters
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredReports.map((r) => (
              <Card 
                key={r.id} 
                className={`p-4 hover:shadow-md transition-all flex items-center justify-between border-slate-200 cursor-pointer ${selectedIds.includes(r.id) ? 'border-emerald-500 bg-emerald-50/30' : ''}`}
                onClick={() => toggleSelect(r.id)}
              >
                <div className="flex items-center gap-4">
                  <div 
                    className="flex-shrink-0"
                    onClick={(e) => { e.stopPropagation(); toggleSelect(r.id); }}
                  >
                    <Checkbox checked={selectedIds.includes(r.id)} onCheckedChange={() => toggleSelect(r.id)} />
                  </div>
                  <div className="bg-slate-50 p-2 rounded-md border border-slate-100">
                    <FileText className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 leading-tight">
                      {r.basicInfo.mcNo} - {r.basicInfo.batchNo}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {r.basicInfo.dateOfTest} • {r.basicInfo.size} • {r.basicInfo.className}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" onClick={() => setViewing(r)} className="hover:bg-emerald-50 hover:text-emerald-600">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => exportPDF(r)} disabled={downloadingReport?.id === r.id} className="hover:bg-emerald-50 hover:text-emerald-600">
                    <Download className={`w-4 h-4 ${downloadingReport?.id === r.id ? "animate-bounce text-emerald-600" : ""}`} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => navigate(`/new?edit=${r.id}`)} className="hover:bg-blue-50 hover:text-blue-600">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-red-50 hover:text-red-600"
                    onClick={() => {
                      if (confirm("Delete this report?")) {
                        deleteReport(r.id);
                        setReports(getReports());
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Batch Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-50">
          <Card className="bg-slate-900 text-white p-4 shadow-2xl border-none flex items-center justify-between animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-4">
              <div className="bg-emerald-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
                {selectedIds.length}
              </div>
              <div>
                <p className="font-bold text-sm">Reports Selected</p>
                <p className="text-xs text-slate-400">Perform bulk actions</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-white hover:bg-slate-800"
                onClick={() => setSelectedIds([])}
                disabled={isBatchProcessing}
              >
                <X className="w-4 h-4 mr-2" /> Cancel
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleBatchDelete}
                disabled={isBatchProcessing}
              >
                <Trash className="w-4 h-4 mr-2" /> Delete
              </Button>
              <Button 
                className="bg-emerald-600 hover:bg-emerald-700 text-white" 
                size="sm"
                onClick={handleBatchDownload}
                disabled={isBatchProcessing}
              >
                {isBatchProcessing ? (
                  <>
                    <Download className="w-4 h-4 mr-2 animate-bounce" />
                    {batchProgress.current}/{batchProgress.total}
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" /> Start Batch
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Processing Overlay */}
      {isBatchProcessing && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[60] flex items-center justify-center">
          <Card className="p-8 max-w-sm w-full text-center">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle className="text-slate-100 stroke-current" strokeWidth="8" fill="transparent" r="40" cx="50" cy="50" />
                <circle 
                  className="text-emerald-600 stroke-current transition-all duration-300" 
                  strokeWidth="8" 
                  strokeLinecap="round" 
                  fill="transparent" 
                  r="40" cx="50" cy="50"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * batchProgress.current) / batchProgress.total}
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-xl font-bold text-emerald-600">
                {Math.round((batchProgress.current / batchProgress.total) * 100)}%
              </div>
            </div>
            <h3 className="text-xl font-bold mb-2">Downloading Reports</h3>
            <p className="text-sm text-slate-500">
              Generating PDF {batchProgress.current} of {batchProgress.total}.<br/>
              This may take a moment...
            </p>
          </Card>
        </div>
      )}

      {/* Hidden container for direct downloads */}
      {downloadingReport && (
        <div id="download-target" style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          {(() => {
            const Template = getCurrentStandard().components.Template;
            return <Template data={downloadingReport} isExporting={true} />;
          })()}
        </div>
      )}
    </div>
  );
}
