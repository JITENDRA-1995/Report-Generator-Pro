import { useLocation } from "wouter";
import { Hammer, Boxes, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SmsUnderDevelopment() {
  const [, navigate] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const standardName = searchParams.get("standard") || "Selected Standard";
  const actionName = searchParams.get("action") || "";
  const standardId = searchParams.get("id") || "";

  const handleBackClick = () => {
    if (standardId) {
      navigate(`/sms/standard/${standardId}`);
    } else {
      navigate("/sms");
    }
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-slate-950 text-slate-100 flex flex-col items-center justify-center relative overflow-hidden font-sans py-12">
      {/* Background Radial Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.06),transparent_50%)] pointer-events-none" />

      {/* Main Content */}
      <div className="relative z-10 px-6 max-w-lg mx-auto text-center flex flex-col items-center">
        {/* Animated Icon Set */}
        <div className="relative mb-8 flex items-center justify-center">
          <div className="absolute inset-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl animate-pulse" />
          <div className="relative w-20 h-20 rounded-2xl bg-slate-900 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Boxes className="w-10 h-10 animate-bounce duration-1000" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-indigo-500 flex items-center justify-center text-slate-950">
              <Hammer className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
            </div>
          </div>
        </div>

        {/* Standard Info Header */}
        <span className="text-[10px] px-3 py-1 rounded-full border border-indigo-500/35 bg-indigo-500/10 text-indigo-300 font-bold uppercase tracking-widest mb-4">
          SMS Integration
        </span>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-3">
          {actionName ? `${actionName}` : `${standardName}`}
        </h1>
        <h2 className="text-base text-slate-400 font-semibold mt-1.5 text-indigo-400">
          {actionName ? `for ${standardName}` : "Currently Under Development"}
        </h2>
        <div className="text-xs text-indigo-300 font-bold uppercase tracking-wider mt-1">
          Currently Under Development
        </div>

        <p className="mt-5 text-slate-400 text-sm leading-relaxed max-w-sm">
          {actionName ? (
            <>
              Stock management features for <span className="text-slate-100 font-semibold">{actionName}</span> under standard <span className="text-slate-100 font-semibold">{standardName}</span> are currently being integrated step-by-step.
            </>
          ) : (
            <>
              Stock management features for <span className="text-slate-100 font-semibold">{standardName}</span> (including material receipt, quality clearance, and warehouse bin allocation) are currently being integrated step-by-step.
            </>
          )}
        </p>

        {/* Action Button */}
        <div className="mt-8">
          <Button
            onClick={handleBackClick}
            className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2 transition-all duration-300 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] px-6 py-5 rounded-xl font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{standardId ? "Back to Standard" : "Back to Dashboard"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
