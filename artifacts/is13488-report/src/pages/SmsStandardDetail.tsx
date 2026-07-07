import { Link, useParams, useLocation } from "wouter";
import { 
  ChevronRight, 
  PlusCircle, 
  Truck, 
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  ArrowUpDown,
  Download,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SmsStandardDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();

  const smsStandards: Record<string, { name: string; subName: string }> = {
    is13488: { name: "IS 13488", subName: "Emitting Pipe" },
    is13487: { name: "IS 13487", subName: "Emitters" },
    is12786: { name: "IS 12786", subName: "Plain Laterals" },
    is4985: { name: "IS 4985", subName: "uPVC Pipe" },
    is17425: { name: "IS 17425", subName: "HDPE Pipe" },
    is14483: { name: "IS 14483", subName: "Venturi Injector" },
  };

  const currentStandard = smsStandards[id || ""] || { name: "SMS", subName: "Standard Operations" };
  const standardTitle = `${currentStandard.name} (${currentStandard.subName})`;

  const actions = [
    {
      id: "production",
      title: "Production Entry",
      desc: "Record new production batches, coil counts, wall thickness runs, and raw material allocations.",
      icon: PlusCircle,
      color: "text-emerald-400 border-emerald-500/10 hover:border-emerald-500/30 hover:shadow-[0_0_25px_-5px_rgba(16,185,129,0.12)] bg-emerald-500/5",
      iconBg: "bg-emerald-500/10 border-emerald-500/25 group-hover:bg-emerald-500/20 text-emerald-400",
      btnColor: "text-emerald-400"
    },
    {
      id: "dispatch",
      title: "Dispatch Entry",
      desc: "Log warehouse delivery orders, dispatch vehicle details, customer invoice mappings, and stock releases.",
      icon: Truck,
      color: "text-indigo-400 border-indigo-500/10 hover:border-indigo-500/30 hover:shadow-[0_0_25px_-5px_rgba(99,102,241,0.12)] bg-indigo-500/5",
      iconBg: "bg-indigo-500/10 border-indigo-500/25 group-hover:bg-indigo-500/20 text-indigo-400",
      btnColor: "text-indigo-400"
    },
    {
      id: "stock",
      title: "Daily Stock",
      desc: "View current inventory balances, daily closing stock registers, and overall product stock logs.",
      icon: TrendingUp,
      color: "text-amber-400 border-amber-500/10 hover:border-amber-500/30 hover:shadow-[0_0_25px_-5px_rgba(245,158,11,0.12)] bg-amber-500/5",
      iconBg: "bg-amber-500/10 border-amber-500/25 group-hover:bg-amber-500/20 text-amber-400",
      btnColor: "text-amber-400"
    },
    {
      id: "export",
      title: "Export Ledger",
      desc: "Export highly-formatted Excel daily stock registers with custom column layouts, grid borders, and monthly summaries.",
      icon: Download,
      color: "text-sky-400 border-sky-500/10 hover:border-sky-500/30 hover:shadow-[0_0_25px_-5px_rgba(56,189,248,0.12)] bg-sky-500/5",
      iconBg: "bg-sky-500/10 border-sky-500/25 group-hover:bg-sky-500/20 text-sky-400",
      btnColor: "text-sky-400"
    },
    {
      id: "consignee",
      title: "Consignee Data",
      desc: "Generate month-wise sums of dispatched products to selected consignees across all sizes covered in this standard.",
      icon: Users,
      color: "text-rose-400 border-rose-500/10 hover:border-rose-500/30 hover:shadow-[0_0_25px_-5px_rgba(244,63,94,0.12)] bg-rose-500/5",
      iconBg: "bg-rose-500/10 border-rose-500/25 group-hover:bg-rose-500/20 text-rose-400",
      btnColor: "text-rose-400"
    }
  ];

  const handleActionClick = (actionId: string) => {
    navigate(`/sms/standard/${id}/${actionId}`);
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-slate-950 text-slate-100 py-12 px-6 font-sans relative overflow-hidden">
      {/* Background Radial Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.05),transparent_40%)] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 mb-6 font-medium">
          <Link href="/sms" className="hover:text-indigo-400 transition-colors">Stock Dashboard</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-300">{currentStandard.name}</span>
        </nav>

        {/* Title Section */}
        <div className="mb-10 border-b border-slate-900 pb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight">
              {currentStandard.name}{" "}
              <span className="text-slate-400 font-normal">({currentStandard.subName})</span>
            </h1>
            <p className="text-slate-400 text-sm max-w-lg">
              Manage inventory logs, production records, and dispatch sheets for this standard.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/sms")}
            className="text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-900 border-slate-900 self-start sm:self-center gap-1.5 h-9"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>SMS Dashboard</span>
          </Button>
        </div>

        {/* Action Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {actions.map((act) => {
            const IconComponent = act.icon;
            return (
              <div
                key={act.id}
                onClick={() => handleActionClick(act.id)}
                className={`group relative rounded-2xl border p-6 cursor-pointer transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between ${act.color}`}
              >
                <div>
                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-5 transition-all duration-300 ${act.iconBg}`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-100 group-hover:text-indigo-400 transition-colors duration-300">
                    {act.title}
                  </h3>
                  <p className="mt-2.5 text-slate-400 text-xs leading-relaxed">
                    {act.desc}
                  </p>
                </div>

                <div className={`mt-6 flex items-center gap-1.5 font-semibold text-xs group-hover:translate-x-1.5 transition-transform duration-300 ${act.btnColor}`}>
                  <span>Enter Panel</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
