import { Link } from "wouter";
import { FilePlus, FolderOpen, Settings, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getCurrentStandard } from "@/standards/registry";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { StandardSelector } from "@/components/StandardSelector";
import { Button } from "@/components/ui/button";

export default function Home() {
  const currentStandard = getCurrentStandard();
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  const items = currentStandard.homeItems;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold mb-4 uppercase tracking-wider">
            Active Standard: {currentStandard.fullName}
          </div>
          <h1 className="text-4xl font-extrabold text-foreground tracking-tight">Report Generator Pro</h1>
          <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
            Professional quality test report management system for industrial standards.
          </p>
          
          <div className="mt-6 flex justify-center">
            <Dialog open={isSelectorOpen} onOpenChange={setIsSelectorOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="rounded-full px-6">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Switch Standard
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Select Industrial Standard</DialogTitle>
                </DialogHeader>
                <StandardSelector onSelect={() => setIsSelectorOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((it) => (
            <Link key={it.to} href={it.to}>
              <Card className="cursor-pointer p-8 hover-elevate active-elevate-2 h-full transition-all hover:shadow-xl border-2 hover:border-emerald-500/20">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm ${it.color}`}>
                  <it.icon className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-bold mb-2">{it.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{it.desc}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
