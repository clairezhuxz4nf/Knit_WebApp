import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import WelcomePage from "./pages/WelcomePage";
import CreateFamilySpace from "./pages/CreateFamilySpace";
import JoinFamilySpace from "./pages/JoinFamilySpace";
import FamilySpace from "./pages/FamilySpace";
import EventChronicle from "./pages/EventChronicle";
import WorkingProjects from "./pages/WorkingProjects";
import CreateProject from "./pages/CreateProject";
import Project from "./pages/Project";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/welcome-page" replace />} />
          <Route path="/welcome-page" element={<WelcomePage />} />
          <Route path="/create-family-space" element={<CreateFamilySpace />} />
          <Route path="/join-family-space" element={<JoinFamilySpace />} />
          <Route path="/family-space" element={<FamilySpace />} />
          <Route path="/event-chronicle" element={<EventChronicle />} />
          <Route path="/working-projects" element={<WorkingProjects />} />
          <Route path="/create-project" element={<CreateProject />} />
          <Route path="/project/:projectId" element={<Project />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
