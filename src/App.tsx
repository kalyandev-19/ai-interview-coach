import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NewInterview from "./pages/NewInterview";
import Interview from "./pages/Interview";
import Feedback from "./pages/Feedback";
import ResumeUpload from "./pages/ResumeUpload";
import CareerGuidance from "./pages/CareerGuidance";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "@/components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/new-interview" element={<ProtectedRoute><NewInterview /></ProtectedRoute>} />
            <Route path="/interview/:sessionId" element={<ProtectedRoute><Interview /></ProtectedRoute>} />
            <Route path="/feedback/:sessionId" element={<ProtectedRoute><Feedback /></ProtectedRoute>} />
            <Route path="/resume" element={<ProtectedRoute><ResumeUpload /></ProtectedRoute>} />
            <Route path="/career-guidance" element={<ProtectedRoute><CareerGuidance /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
