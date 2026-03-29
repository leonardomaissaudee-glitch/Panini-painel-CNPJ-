import { Routes, Route, useLocation } from "react-router-dom"
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
import AboutPage from "@/pages/About"
import ProcessPage from "@/pages/Process"
import OpportunityPage from "@/pages/Opportunity"
import CadastroPage from "@/pages/Cadastro"
import CadastroSucesso from "@/pages/CadastroSucesso"
import PainelPage from "@/pages/Painel"

export function App() {
  const location = useLocation()
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
            />

            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

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

export default App;
