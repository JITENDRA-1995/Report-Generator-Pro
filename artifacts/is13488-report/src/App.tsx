import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import NewReport from "@/pages/NewReport";
import SavedReports from "@/pages/SavedReports";
import DataManagement from "@/pages/DataManagement";
import Login from "@/pages/Login";
import Welcome from "@/pages/Welcome";
import SmsDashboard from "@/pages/SmsDashboard";
import SmsUnderDevelopment from "@/pages/SmsUnderDevelopment";
import SmsStandardDetail from "@/pages/SmsStandardDetail";
import SmsEntryPanel from "@/pages/SmsEntryPanel";
import SmsSettings from "@/pages/SmsSettings";
import SmsUniversal from "@/pages/SmsUniversal";
import SmsRenewalData from "@/pages/SmsRenewalData";
import SmsSmartProduction from "@/pages/SmsSmartProduction";

import { Layout } from "@/components/Layout";
import { SmsLayout } from "@/components/SmsLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  syncReportsFromCloud, 
  syncPresetsFromCloud, 
  syncSpecsFromCloud, 
  syncHeadersFromCloud 
} from "@/lib/storage";

const queryClient = new QueryClient();

function Router() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [, navigate] = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) navigate("/login");
    });

    const handleWheel = (e: WheelEvent) => {
      if (document.activeElement && (document.activeElement as HTMLInputElement).type === "number") {
        (document.activeElement as HTMLInputElement).blur();
      }
    };
    document.addEventListener("wheel", handleWheel);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener("wheel", handleWheel);
    };
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <Switch>
        <Route path="/login" component={Login} />
        <Route component={Login} />
      </Switch>
    );
  }

  return (
    <Switch>
      <Route path="/">
        <Welcome />
      </Route>
      <Route path="/sms">
        <SmsLayout>
          <SmsDashboard />
        </SmsLayout>
      </Route>
      <Route path="/sms/universal">
        <SmsLayout>
          <SmsUniversal />
        </SmsLayout>
      </Route>
      <Route path="/sms/renewal">
        <SmsLayout>
          <SmsRenewalData />
        </SmsLayout>
      </Route>
      <Route path="/sms/develop">
        <SmsLayout>
          <SmsUnderDevelopment />
        </SmsLayout>
      </Route>
      <Route path="/sms/standard/:id">
        <SmsLayout>
          <SmsStandardDetail />
        </SmsLayout>
      </Route>
      <Route path="/sms/standard/:id/:type">
        <SmsLayout>
          <SmsEntryPanel />
        </SmsLayout>
      </Route>
      <Route path="/sms/settings">
        <SmsLayout>
          <SmsSettings />
        </SmsLayout>
      </Route>
      <Route path="/sms/smart-production">
        <SmsLayout>
          <SmsSmartProduction />
        </SmsLayout>
      </Route>
      <Route>
        <Layout>
          <Switch>
            <Route path="/reporting" component={Home} />
            <Route path="/new" component={NewReport} />
            <Route path="/saved" component={SavedReports} />
            <Route path="/data" component={DataManagement} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      </Route>
    </Switch>
  );
}
 
function CloudSync() {
  useEffect(() => {
    // Only sync if user is logged in
    const sync = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      try {
        await Promise.all([
          syncReportsFromCloud(),
          syncPresetsFromCloud(),
          syncSpecsFromCloud(),
          syncHeadersFromCloud()
        ]);
        console.log("Cloud sync complete.");
        // Signal the UI to refresh
        window.dispatchEvent(new CustomEvent('cloud-sync-complete'));
      } catch (e) {
        console.error("Cloud sync failed:", e);
      }
    };
    sync();
  }, []);
  
  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CloudSync />
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
