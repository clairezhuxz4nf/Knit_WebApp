import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Auth from "./pages/Auth";
import WelcomePage from "./pages/WelcomePage";
import PhoneSignup from "./pages/PhoneSignup";
import CreateFamilySpace from "./pages/CreateFamilySpace";
import JoinFamilySpace from "./pages/JoinFamilySpace";
import FamilySpace from "./pages/FamilySpace";
import FamilySettings from "./pages/FamilySettings";
import Profile from "./pages/Profile";
import Gems from "./pages/Gems";
import Stories from "./pages/Stories";
import Podcasts from "./pages/Podcasts";
import FreeSpace from "./pages/FreeSpace";
import EventChronicle from "./pages/EventChronicle";
import EventDetail from "./pages/EventDetail";

import CreateProject from "./pages/CreateProject";
import CreateStoryBite from "./pages/CreateStoryBite";
import ProjectPage from "./pages/Project";
import Family from "./pages/Family";
import PhotoRepository from "./pages/PhotoRepository";
import SelectPhoto from "./pages/SelectPhoto";
import StorybookPreview from "./pages/StorybookPreview";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/welcome-page" replace />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/welcome-page" element={<WelcomePage />} />
            <Route path="/phone-signup" element={<PhoneSignup />} />
            <Route path="/create-family-space" element={<CreateFamilySpace />} />
            <Route path="/join-family-space" element={<JoinFamilySpace />} />
            <Route path="/family-space" element={<Navigate to="/gems" replace />} />
            <Route path="/family" element={<Family />} />
            <Route path="/family-settings" element={<FamilySettings />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/gems" element={<Gems />} />
            <Route path="/stories" element={<Stories />} />
            <Route path="/podcasts" element={<Podcasts />} />
            <Route path="/free-space" element={<FreeSpace />} />
            <Route path="/event-chronicle" element={<EventChronicle />} />
            <Route path="/working-projects" element={<EventChronicle />} />
            
            <Route path="/create-project" element={<CreateProject />} />
            <Route path="/create-story-bite" element={<CreateStoryBite />} />
            <Route path="/photo-repository" element={<PhotoRepository />} />
            <Route path="/select-photo" element={<SelectPhoto />} />
            <Route path="/storybook-preview" element={<StorybookPreview />} />
            <Route path="/project/:projectId" element={<ProjectPage />} />
            <Route path="/event/:eventId" element={<EventDetail />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
