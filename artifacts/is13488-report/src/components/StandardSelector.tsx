import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { STANDARDS, getCurrentStandardId } from "@/standards/registry";
import { CheckCircle2, ChevronRight } from "lucide-react";

export function StandardSelector({ onSelect }: { onSelect: () => void }) {
  const currentId = getCurrentStandardId();

  const handleSelect = (id: string) => {
    localStorage.setItem("current_standard", id);
    onSelect();
    window.location.reload(); // Reload to re-initialize dynamic storage keys
  };

  return (
    <div className="grid gap-4 py-4">
      {STANDARDS.map((std) => (
        <Card
          key={std.id}
          className={`p-4 cursor-pointer transition-all border-2 ${
            currentId === std.id 
              ? "border-emerald-500 bg-emerald-50/50" 
              : "hover:border-slate-300 border-transparent bg-slate-50/50"
          }`}
          onClick={() => handleSelect(std.id)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                currentId === std.id ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-600"
              }`}>
                {std.id.replace("is", "")}
              </div>
              <div>
                <h4 className="font-bold text-slate-900">{std.fullName}</h4>
                <p className="text-xs text-slate-500">Quality Test Reporting Engine</p>
              </div>
            </div>
            {currentId === std.id ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            ) : (
              <ChevronRight className="w-5 h-5 text-slate-400" />
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
