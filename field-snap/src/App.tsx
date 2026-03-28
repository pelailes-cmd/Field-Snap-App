import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { CapturePage } from './pages/CapturePage';
import { EditPage } from './pages/EditPage';
import { SketchPage } from './pages/SketchPage';
import { UtilityBillingPage } from './pages/UtilityBillingPage';
import { TenantDetailsPage } from './pages/TenantDetailsPage';
import { TechnicalReportPage } from './pages/TechnicalReportPage';
import { MonitoringPage } from './pages/MonitoringPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/auth" />;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/capture" element={<ProtectedRoute><CapturePage /></ProtectedRoute>} />
        <Route path="/sketch" element={<ProtectedRoute><SketchPage /></ProtectedRoute>} />
        <Route path="/edit" element={<ProtectedRoute><EditPage /></ProtectedRoute>} />
        <Route path="/utility-billing" element={<ProtectedRoute><UtilityBillingPage /></ProtectedRoute>} />
        <Route path="/tenant/:id" element={<ProtectedRoute><TenantDetailsPage /></ProtectedRoute>} />
        <Route path="/technical-report" element={<ProtectedRoute><TechnicalReportPage /></ProtectedRoute>} />
        <Route path="/monitoring" element={<ProtectedRoute><MonitoringPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
