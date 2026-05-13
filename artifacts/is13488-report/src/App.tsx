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
import StandardSelector from "@/pages/StandardSelector";

import { Layout } from "@/components/Layout";
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
  const [standardSelected, setStandardSelected] = useState(!!localStorage.getItem('current_standard'));

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) navigate("/login");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
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

  if (!standardSelected) {
    return <StandardSelector />;
  }

  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/new" component={NewReport} />
        <Route path="/saved" component={SavedReports} />
        <Route path="/data" component={DataManagement} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
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
