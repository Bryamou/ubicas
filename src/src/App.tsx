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
import { AgentPanelLayout } from '@/layouts/AgentPanelLayout';
import { AgentDashboardPage } from '@/pages/agent/AgentDashboard';
import { AgentPropertiesPage } from '@/pages/agent/AgentProperties';
import { AgentProposalsPage } from '@/pages/agent/AgentProposals';
import { AgentProfilePage } from '@/pages/agent/AgentProfile';
import { RequirementsListPage } from '@/pages/RequirementsList';
import { RequirementDetailPage } from '@/pages/RequirementDetail';
import { BuyerPanelLayout } from '@/layouts/BuyerPanelLayout';
import { BuyerFavoritesPage } from '@/pages/buyer/BuyerFavorites';
import { BuyerContactsPage } from '@/pages/buyer/BuyerContacts';
import { BuyerRequirementsPage } from '@/pages/buyer/BuyerRequirements';
import { BuyerProposalsPage } from '@/pages/buyer/BuyerProposals';
import { BuyerProfilePage } from '@/pages/buyer/BuyerProfile';
import { PublishRequirementPage } from '@/pages/buyer/PublishRequirement';
import { MessagesPage } from '@/pages/Messages';
import { AdminRoute } from '@/routes/AdminRoute';
import { AdminAgentsPage } from '@/pages/admin/AdminAgents';

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
          <Route path="/requerimientos" element={<RequirementsListPage />} />
          <Route path="/requerimientos/:id" element={<RequirementDetailPage />} />

          {/* Protegidas por sesión (cualquier rol) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/mensajes" element={<MessagesPage />} />
          </Route>

          {/* Protegidas por flag de administrador (Fase 5) */}
          <Route element={<AdminRoute />}>
            <Route path="/admin/agentes" element={<AdminAgentsPage />} />
          </Route>

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

          {/* Protegidas por rol: agente (Fase 2) */}
          <Route element={<ProtectedRoute allowedRoles={['agent']} />}>
            <Route path="/panel/agente" element={<AgentPanelLayout />}>
              <Route index element={<AgentDashboardPage />} />
              <Route path="inmuebles" element={<AgentPropertiesPage />} />
              <Route path="propuestas" element={<AgentProposalsPage />} />
              <Route path="perfil" element={<AgentProfilePage />} />
            </Route>
          </Route>

          {/* Protegidas por rol: comprador/arrendatario (Fase 3) */}
          <Route element={<ProtectedRoute allowedRoles={['buyer']} />}>
            <Route path="/publicar-requerimiento" element={<PublishRequirementPage />} />
            <Route path="/panel/comprador" element={<BuyerPanelLayout />}>
              <Route index element={<BuyerFavoritesPage />} />
              <Route path="contactos" element={<BuyerContactsPage />} />
              <Route path="requerimientos" element={<BuyerRequirementsPage />} />
              <Route path="propuestas" element={<BuyerProposalsPage />} />
              <Route path="perfil" element={<BuyerProfilePage />} />
            </Route>
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
