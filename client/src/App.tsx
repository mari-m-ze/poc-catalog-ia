import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import NotFound from "./pages/not-found";
import Home from "./pages/home";
import Settings from "./pages/settings";
import { ProductsPage } from "./pages/products";
import { AllProductsPage } from "./pages/all-products";
import { AllProductsPage as DbView } from "./pages/db-view";
import { WineAttributesPage } from "./pages/wine-attributes";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/settings" component={Settings} />
      <Route path="/products" component={ProductsPage} />
      <Route path="/all-products" component={AllProductsPage} />
      <Route path="/db-view" component={DbView} />
      <Route path="/wine-attributes" component={WineAttributesPage} />
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
