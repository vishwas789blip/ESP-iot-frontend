import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { RealtimeProvider } from '@/context/RealtimeContext';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/layout/Layout';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { DevicesPage } from '@/pages/DevicesPage';
import { DeviceDetailsPage } from '@/pages/DeviceDetailsPage';
import { SensorsPage } from '@/pages/SensorsPage';
import { ActuatorsPage } from '@/pages/ActuatorsPage';
import { AutomationsPage } from '@/pages/AutomationsPage';
import { EventsPage } from '@/pages/EventsPage';
import { FirmwarePage } from '@/pages/FirmwarePage';
import { AIAssistantPage } from '@/pages/AIAssistantPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
    <AuthProvider>
      <ToastProvider>
        <RealtimeProvider>
          <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/dashboard" element={<DashboardPage />} />
                      <Route path="/devices" element={<DevicesPage />} />
                      <Route path="/devices/:id" element={<DeviceDetailsPage />} />
                      <Route path="/devices/:id/edit" element={<DeviceDetailsPage />} />
                      <Route path="/sensors" element={<SensorsPage />} />
                      <Route path="/actuators" element={<ActuatorsPage />} />
                      <Route path="/automations" element={<AutomationsPage />} />
                      <Route path="/events" element={<EventsPage />} />
                      <Route path="/firmware" element={<FirmwarePage />} />
                      <Route path="/ai-assistant" element={<AIAssistantPage />} />
                      <Route path="/settings" element={<SettingsPage />} />
                      <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
            <ToastContainer />
          </BrowserRouter>
        </RealtimeProvider>
      </ToastProvider>
    </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
