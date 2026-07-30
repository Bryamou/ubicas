import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { LandingPage } from '@/pages/Landing';
import { LoginPage } from '@/pages/Login';
import { RegisterPage } from '@/pages/Register';
import { PlaceholderPage } from '@/pages/PlaceholderPage';
import { PropertyListPage } from '@/pages/PropertyList';
import { PropertyDetailPage } from '@/pages/PropertyDetail';
import { OwnerPanelLayout } from '@/layouts/OwnerPanelLayout';
import { OwnerDashboardPage } from '@/pages/owner/OwnerDashboard';
import { OwnerPropertiesPage } from '@/pages/owner/OwnerProperties';
import { OwnerContactsPage } from '@/pages/owner/OwnerContacts';
import { OwnerProposalsPage } from '@/pages/owner/OwnerProposals';
import { OwnerMetricsPage } from '@/pages/owner/OwnerMetrics';
import { OwnerProfilePage } from '@/pages/owner/OwnerProfile';
import { PublishWizardPage } from '@/pages/owner/PublishWizard';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Públicas */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/inmuebles" element={<PropertyListPage />} />
          <Route path="/inmuebles/:id" element={<PropertyDetailPage />} />
          <Route
            path="/requerimientos"
            element={
              <PlaceholderPage
                title="Requerimientos activos"
                description="El listado de requerimientos para propietarios y agentes se implementa en la Fase 5."
              />
            }
          />

          {/* Protegidas por rol: propietario (HU-01 a HU-07) */}
          <Route element={<ProtectedRoute allowedRoles={['owner']} />}>
            <Route path="/publicar-inmueble" element={<PublishWizardPage />} />
            <Route path="/panel/propietario" element={<OwnerPanelLayout />}>
              <Route index element={<OwnerDashboardPage />} />
              <Route path="inmuebles" element={<OwnerPropertiesPage />} />
              <Route path="contactos" element={<OwnerContactsPage />} />
              <Route path="propuestas" element={<OwnerProposalsPage />} />
              <Route path="metricas" element={<OwnerMetricsPage />} />
              <Route path="perfil" element={<OwnerProfilePage />} />
            </Route>
          </Route>

          {/* Protegidas por rol: agente */}
          <Route element={<ProtectedRoute allowedRoles={['agent']} />}>
            <Route
              path="/dashboard/agent"
              element={
                <PlaceholderPage
                  title="Panel del agente"
                  description="Propuestas enviadas, contactos y vinculación con inmuebles se implementan en la Fase 4."
                />
              }
            />
          </Route>

          {/* Protegidas por rol: comprador/arrendatario */}
          <Route element={<ProtectedRoute allowedRoles={['buyer']} />}>
            <Route
              path="/dashboard/buyer"
              element={
                <PlaceholderPage
                  title="Panel del comprador/arrendatario"
                  description="Favoritos, contactos y requerimientos publicados se implementan en la Fase 5."
                />
              }
            />
            <Route
              path="/publicar-requerimiento"
              element={
                <PlaceholderPage
                  title="Publicar requerimiento"
                  description="El formulario de requerimiento se implementa en la Fase 5."
                />
              }
            />
          </Route>

          {/* 404 */}
          <Route
            path="*"
            element={
              <PlaceholderPage title="Página no encontrada" description="Verifica la URL o vuelve al inicio." />
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
