import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/language-context";
import { Sidebar } from "@/components/layout/sidebar";
import Dashboard from "@/pages/dashboard";
import Clients from "@/pages/clients";
import ClientDetail from "@/pages/client";
import Cases from "@/pages/cases";
import Bonds from "@/pages/bonds";
import Financial from "@/pages/financial";
import Documents from "@/pages/documents";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import { OnboardingPage } from "@/pages/onboarding";
import ClientLoginPage from "@/pages/client-login";
import ClientPortalPage from "@/pages/client-portal";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      {/* Client Portal Routes (no sidebar) */}
      <Route path="/client-login" component={ClientLoginPage} />
      <Route path="/client-portal/:clientId" component={ClientPortalPage} />
      
      {/* Main Application Routes (with sidebar) */}
      <Route path="/" nest>
        <div className="flex h-screen bg-background">
          <Sidebar />
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/clients" component={Clients} />
            <Route path="/clients/:id" component={ClientDetail} />
            <Route path="/cases" component={Cases} />
            <Route path="/bonds" component={Bonds} />
            <Route path="/financial" component={Financial} />
            <Route path="/documents" component={Documents} />
            <Route path="/reports" component={Reports} />
            <Route path="/settings" component={Settings} />
            <Route path="/onboarding" component={OnboardingPage} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
