import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import LoginPage from "@/components/auth/LoginPage";
import SignupPage from "@/pages/SignupPage";
import Dashboard from "@/pages/Dashboard";
import MyLocationPage from "@/pages/MyLocationPage";
import SupervisorLiveMapPage from "@/pages/SupervisorLiveMapPage";
import RosterUploadPage from "@/pages/RosterUploadPage";
import Unauthorized from "@/pages/Unauthorized";
import ProtectedRoute from "@/components/layout/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route 
              path="/login" 
              element={
                isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
              } 
            />
            <Route 
              path="/signup" 
              element={
                isAuthenticated ? <Navigate to="/dashboard" replace /> : <SignupPage />
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/my-location" 
              element={
                <ProtectedRoute>
                  <MyLocationPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/supervisor/live-map" 
              element={
                <ProtectedRoute>
                  <SupervisorLiveMapPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/supervisor/roster-upload" 
              element={
                <ProtectedRoute>
                  <RosterUploadPage />
                </ProtectedRoute>
              } 
            />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route 
              path="/" 
              element={
                <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
              } 
            />
            <Route path="*" element={<Navigate to="/unauthorized" replace />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
