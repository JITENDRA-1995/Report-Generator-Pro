import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Eye, Printer, Trash2, Pencil, Download, FileText } from "lucide-react";
import { getReports, deleteReport } from "@/lib/storage";
import type { ReportData } from "@/lib/types";
import { ReportTemplate } from "@/components/ReportTemplate";
import { HeaderActions } from "@/components/HeaderActions";

export default function SavedReports() {
  const [, navigate] = useLocation();
  const [reports, setReports] = useState<ReportData[]>(getReports());
  const [viewing, setViewing] = useState<ReportData | null>(null);

  const [downloadingReport, setDownloadingReport] = useState<ReportData | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const exportPDF = async (r: ReportData) => {
    if (isExporting) return;
    setIsExporting(true);
    setDownloadingReport(r);
    
    // Give time for the hidden component to mount and charts to render
    setTimeout(async () => {
      try {
        const filename = `${r.basicInfo.mcNo}_${r.basicInfo.batchNo}`.replace(/[\/\\?%*:|"<>]/g, '-');
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
        setDownloadingReport(null);
        setIsExporting(false);
      }
    }, 1500);
  };

  if (viewing) {
    const filename = `${viewing.basicInfo.mcNo}_${viewing.basicInfo.batchNo}`.replace(/[\/\\?%*:|"<>]/g, '-');
    
    const handlePrint = () => {
      const oldTitle = document.title;
      document.title = filename;
      window.print();
      document.title = oldTitle;
    };

    const handleExport = async () => {
      if (isExporting) return;
      setIsExporting(true);
      
      // Wait for React to render all pages by passing isExporting=true to ReportTemplate
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
          <ReportTemplate data={viewing} isExporting={isExporting} />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-600 p-2 rounded-lg text-white">
            <FileText className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Saved Reports</h1>
        </div>
        <Button onClick={() => navigate("/")} variant="outline" size="sm">
          Home
        </Button>
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
          <div className="space-y-3">
            {reports.map((r) => (
              <Card key={r.id} className="p-4 hover:shadow-md transition-shadow flex items-center justify-between border-slate-200">
                <div className="flex items-center gap-4">
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
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setViewing(r)}>
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => exportPDF(r)} disabled={downloadingReport?.id === r.id}>
                    <Download className={`w-4 h-4 mr-1 ${downloadingReport?.id === r.id ? "animate-bounce text-emerald-600" : ""}`} />
                    {downloadingReport?.id === r.id ? "Downloading..." : "Download"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigate(`/new?edit=${r.id}`)}>
                    <Pencil className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm("Delete this report?")) {
                        deleteReport(r.id);
                        setReports(getReports());
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Hidden container for direct downloads */}
      {downloadingReport && (
        <div id="download-target" style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <ReportTemplate data={downloadingReport} isExporting={true} />
        </div>
      )}
    </div>
  );
}
