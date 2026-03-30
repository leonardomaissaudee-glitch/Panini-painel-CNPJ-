import { Routes, Route, useLocation, Navigate } from "react-router-dom"
import { Header } from "@/components/Header"
import { CartProvider } from "@/contexts/CartContext"
import Home from "@/pages/Home"
import Cart from "@/pages/Cart"
import CheckoutNew from "@/pages/CheckoutNew"
import LoginPage from "@/features/auth/pages/Login"
import AdminLoginPage from "@/features/auth/pages/AdminLogin"
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute"
import { PublicOnlyRoute } from "@/features/auth/components/PublicOnlyRoute"
import { AuthProvider } from "@/features/auth/context/AuthContext"
import AdminDashboard from "@/features/admin/pages/AdminDashboard"
import SellerDashboard from "@/features/seller/pages/SellerDashboard"
import ClientDashboard from "@/features/client/pages/ClientDashboard"
import ClientCatalogPage from "@/features/client/pages/ClientCatalogPage"
import ClientOrdersPage from "@/features/client/pages/ClientOrdersPage"
import ClientInfoPage from "@/features/client/pages/ClientInfoPage"
import ClientProfilePage from "@/features/client/pages/ClientProfilePage"
import ClientSupportPage from "@/features/client/pages/ClientSupportPage"
import ClientCartPage from "@/features/client/pages/ClientCartPage"
import { OrdersPanel } from "@/features/admin/components/OrdersPanel"
import { ChatsPanel } from "@/features/admin/components/ChatsPanel"
import { MonitoringPanel } from "@/features/monitoring/components/MonitoringPanel"
import { PendingApprovals } from "@/features/admin/components/PendingApprovals"
import { UsersPanel } from "@/features/admin/components/UsersPanel"
import { ApprovedClientsPanel } from "@/features/admin/components/ApprovedClientsPanel"
import { AllClientsPanel } from "@/features/admin/components/AllClientsPanel"
import { GiftsPanel } from "@/features/admin/components/GiftsPanel"
import AboutPage from "@/pages/About"
import ProcessPage from "@/pages/Process"
import OpportunityPage from "@/pages/Opportunity"
import CadastroPage from "@/pages/Cadastro"
import CadastroSucesso from "@/pages/CadastroSucesso"
import PainelPage from "@/pages/Painel"
import AtendimentoPage from "@/pages/Atendimento"
import { useAccessTracking } from "@/features/monitoring/hooks/useAccessTracking"

export function App() {
  const location = useLocation()
  useAccessTracking()
  const hideHeader = /^\/(app|admin|seller|painel)(\/|$)/.test(location.pathname)

  return (
    <AuthProvider>
      <CartProvider>
        <div className="min-h-screen bg-background">
          {!hideHeader && <Header />}
          <Routes>
            <Route
              path="/"
              element={
                <PublicOnlyRoute>
                  <Home />
                </PublicOnlyRoute>
              }
            />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<CheckoutNew />} />
            <Route path="/atendimento" element={<AtendimentoPage />} />

            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <LoginPage />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/cadastro"
              element={
                <PublicOnlyRoute>
                  <CadastroPage />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/credenciamento"
              element={
                <PublicOnlyRoute>
                  <CadastroPage />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicOnlyRoute>
                  <CadastroPage />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/cadastro/sucesso"
              element={
                <PublicOnlyRoute>
                  <CadastroSucesso />
                </PublicOnlyRoute>
              }
            />
            <Route path="/painel" element={<PainelPage />} />
            <Route
              path="/loginadmin"
              element={
                <PublicOnlyRoute>
                  <AdminLoginPage />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/sobre"
              element={
                <PublicOnlyRoute>
                  <AboutPage />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/processo"
              element={
                <PublicOnlyRoute>
                  <ProcessPage />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/oportunidade"
              element={
                <PublicOnlyRoute>
                  <OpportunityPage />
                </PublicOnlyRoute>
              }
            />

            <Route
              path="/app"
              element={
                <ProtectedRoute allowedRoles={["client"]}>
                  <ClientDashboard />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/app/catalogo" replace />} />
              <Route path="catalogo" element={<ClientCatalogPage />} />
              <Route path="pedidos" element={<ClientOrdersPage />} />
              <Route path="informacoes" element={<ClientInfoPage />} />
              <Route path="perfil" element={<ClientProfilePage />} />
              <Route path="gerente" element={<ClientSupportPage />} />
              <Route path="carrinho" element={<ClientCartPage />} />
              <Route path="*" element={<Navigate to="/app/catalogo" replace />} />
            </Route>

            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/admin/pedidos" replace />} />
              <Route path="pedidos" element={<OrdersPanel />} />
              <Route path="chats" element={<ChatsPanel />} />
              <Route path="monitoramento" element={<MonitoringPanel />} />
              <Route path="cadastros-pendentes" element={<PendingApprovals />} />
              <Route path="usuarios" element={<UsersPanel />} />
              <Route path="clientes-aprovados" element={<ApprovedClientsPanel />} />
              <Route path="todos-clientes" element={<AllClientsPanel />} />
              <Route path="brindes" element={<GiftsPanel />} />
              <Route path="*" element={<Navigate to="/admin/pedidos" replace />} />
            </Route>

            <Route
              path="/seller"
              element={
                <ProtectedRoute allowedRoles={["seller"]}>
                  <SellerDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </CartProvider>
    </AuthProvider>
  )
}

export default App
