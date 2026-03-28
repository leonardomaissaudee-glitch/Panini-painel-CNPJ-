import { Routes, Route } from "react-router-dom"
import { Header } from "@/components/Header"
import { CartProvider } from "@/contexts/CartContext"
import Home from "@/pages/Home"
import Cart from "@/pages/Cart"
import CheckoutNew from "@/pages/CheckoutNew"
import LoginPage from "@/features/auth/pages/Login"
import RegisterPage from "@/features/auth/pages/Register"
import AdminLoginPage from "@/features/auth/pages/AdminLogin"
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute"
import { AuthProvider } from "@/features/auth/context/AuthContext"
import AdminDashboard from "@/features/admin/pages/AdminDashboard"
import SellerDashboard from "@/features/seller/pages/SellerDashboard"
import ClientDashboard from "@/features/client/pages/ClientDashboard"
import AboutPage from "@/pages/About"
import ProcessPage from "@/pages/Process"
import PlansPage from "@/pages/Plans"
import OpportunityPage from "@/pages/Opportunity"

export function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <div className="min-h-screen bg-background">
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<CheckoutNew />} />

            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/loginadmin" element={<AdminLoginPage />} />
            <Route path="/sobre" element={<AboutPage />} />
            <Route path="/processo" element={<ProcessPage />} />
            <Route path="/planos" element={<PlansPage />} />
            <Route path="/oportunidade" element={<OpportunityPage />} />

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
