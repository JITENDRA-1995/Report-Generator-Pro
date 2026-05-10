import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import NewReport from "@/pages/NewReport";
import SavedReports from "@/pages/SavedReports";
import DataManagement from "@/pages/DataManagement";

import { Layout } from "@/components/Layout";
import { useEffect } from "react";
import { 
  syncReportsFromCloud, 
  syncPresetsFromCloud, 
  syncSpecsFromCloud, 
  syncHeadersFromCloud 
} from "@/lib/storage";

const queryClient = new QueryClient();

function Router() {
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
    // Initial sync from cloud to local storage
    const sync = async () => {
      try {
        await Promise.all([
          syncReportsFromCloud(),
          syncPresetsFromCloud(),
          syncSpecsFromCloud(),
          syncHeadersFromCloud()
        ]);
        console.log("Cloud sync complete.");
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
