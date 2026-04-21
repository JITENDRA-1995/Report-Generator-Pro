import { Link } from "wouter";
import { FilePlus, FolderOpen, Settings } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function Home() {
  const items = [
    {
      to: "/new",
      title: "New Test Report",
      desc: "Create a new IS 13488 emitting pipe test report.",
      icon: FilePlus,
      color: "bg-emerald-50 text-emerald-700",
    },
    {
      to: "/saved",
      title: "View Saved Reports",
      desc: "Browse, re-print or export previously saved reports.",
      icon: FolderOpen,
      color: "bg-blue-50 text-blue-700",
    },
    {
      to: "/data",
      title: "Data Management",
      desc: "Configure default sizes, classes, discharges, spacings & ranges.",
      icon: Settings,
      color: "bg-amber-50 text-amber-700",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-foreground">IS 13488 Test Report Generator</h1>
          <p className="text-muted-foreground mt-2">Emitting Pipe (IS 13488:2008) — quality test report system</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((it) => (
            <Link key={it.to} href={it.to}>
              <Card className="cursor-pointer p-6 hover-elevate active-elevate-2 h-full">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${it.color}`}>
                  <it.icon className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-semibold mb-1">{it.title}</h2>
                <p className="text-sm text-muted-foreground">{it.desc}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
