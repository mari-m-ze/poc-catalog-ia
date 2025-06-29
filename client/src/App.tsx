import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import NotFound from "./pages/not-found";
import Settings from "./pages/settings";
import { WineAttributesPage } from "./pages/wine-attributes";
import { WineEnrichmentPage } from "./pages/wine-enrichment";
import { WineComparisonPage } from "./pages/wine-comparison";
import WineAccuracy from "./pages/wine-accuracy";

function Router() {
  return (
    <Switch>
      <Route path="/">
        <Redirect to="/wine-attributes" />
      </Route>
      <Route path="/settings" component={Settings} />
      <Route path="/wine-attributes" component={WineAttributesPage} />
      <Route path="/wine-enrichment" component={WineEnrichmentPage} />
      <Route path="/wine-comparison" component={WineComparisonPage} />
      <Route path="/wine-accuracy" component={WineAccuracy} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
          <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
