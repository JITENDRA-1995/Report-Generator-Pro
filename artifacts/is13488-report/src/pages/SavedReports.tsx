import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Eye, Printer, Trash2 } from "lucide-react";
import { getReports, deleteReport } from "@/lib/storage";
import type { ReportData } from "@/lib/types";
import { ReportTemplate } from "@/components/ReportTemplate";

export default function SavedReports() {
  const [, navigate] = useLocation();
  const [reports, setReports] = useState<ReportData[]>(getReports());
  const [viewing, setViewing] = useState<ReportData | null>(null);

  if (viewing) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="no-print sticky top-0 z-10 bg-white border-b px-6 py-3 flex justify-between items-center">
          <Button variant="outline" onClick={() => setViewing(null)}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to list
          </Button>
          <Button onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-1" />
            Print / Export PDF
          </Button>
        </div>
        <div className="py-4">
          <ReportTemplate data={viewing} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-white px-6 py-3 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Home
        </Button>
        <span className="font-semibold">Saved Reports</span>
      </div>
      <div className="max-w-4xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-bold mb-6">Saved Reports ({reports.length})</h2>
        {reports.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground">
            No saved reports yet. Create one from the home page.
          </Card>
        ) : (
          <div className="space-y-3">
            {reports.map((r) => (
              <Card key={r.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold">
                    Batch {r.basicInfo.batchNo || "—"} · {r.basicInfo.size || "—"} · Class {r.basicInfo.className || "—"}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Discharge: {r.basicInfo.discharge || "—"} · Spacing: {r.basicInfo.spacing || "—"} cm · Saved:{" "}
                    {new Date(r.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setViewing(r)}>
                    <Eye className="w-4 h-4 mr-1" />
                    View
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
    </div>
  );
}
