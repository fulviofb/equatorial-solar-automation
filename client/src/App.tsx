import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Clients from "./pages/Clients";
import TechnicalResponsibles from "./pages/TechnicalResponsibles";
import SolarModules from "./pages/SolarModules";
import Inverters from "./pages/Inverters";
import Projects from "./pages/Projects";
import ProjectForm from "./pages/ProjectForm";
import ProjectDetails from "./pages/ProjectDetails";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/clientes"} component={Clients} />
      <Route path={"/responsaveis"} component={TechnicalResponsibles} />
      <Route path={"/modulos"} component={SolarModules} />
      <Route path={"/inversores"} component={Inverters} />
      <Route path={"/projetos"} component={Projects} />
      <Route path={"/projetos/novo"} component={ProjectForm} />
      <Route path={"/projetos/:id/editar"} component={ProjectForm} />
      <Route path={"/projetos/:id"} component={ProjectDetails} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
