import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950">
      <Card className="w-full max-w-md mx-4 bg-slate-900/40 border-slate-800/80">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-550" />
            <h1 className="text-2xl font-bold text-slate-100">404 Page Not Found</h1>
          </div>

          <p className="mt-4 text-sm text-slate-400">
            Did you forget to add the page to the router?
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
