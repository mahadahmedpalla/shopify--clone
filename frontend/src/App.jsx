
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Dashboard } from './pages/Dashboard';
import { Navbar } from './components/common/Navbar';
import { StoreLayout } from './components/store/StoreLayout';
import { CategoriesPage } from './components/store/CategoriesPage';
import { ProductsPage } from './components/store/ProductsPage';
import { CustomizeDashboard } from './components/store/CustomizeDashboard';
import { StoreBuilder } from './components/store/StoreBuilder';
import { PublicStorefront } from './pages/PublicStorefront';
import { PublicProductPage } from './pages/PublicProductPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { DiscountsPage } from './components/store/discounts/DiscountsPage';
import { CouponsPage } from './components/store/coupons/CouponsPage';
import { TaxesPage } from './components/store/taxes/TaxesPage';
import { ShippingPage } from './components/store/shipping/ShippingPage';
import { OrdersPage } from './components/store/orders/OrdersPage';
import { OrderSuccessPage } from './pages/OrderSuccessPage';
import { StoreSettingsPage } from './components/store/settings/StoreSettingsPage';
// ... existing imports ...


// Simple Layout Wrapper
function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {children}
    </div>
  );
}

// Public Page Wrapper (Login/Register)
function AuthLayout({ children }) {
  return (
    <Layout>
      <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md mb-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-indigo-600 tracking-tight">StorePlatform</h1>
          </div>
        </div>
        {children}
      </div>
    </Layout>
  );
}

// Protected Page Wrapper
function DashboardLayout({ children }) {
  return (
    <Layout>
      {children}
    </Layout>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Public Storefront Route */}
        <Route path="/s/:storeSubUrl" element={<PublicStorefront />} />
        <Route path="/s/:storeSubUrl/:pageSlug" element={<PublicStorefront />} />
        <Route path="/s/:storeSubUrl/p/:productId" element={<PublicProductPage />} />
        <Route path="/s/:storeSubUrl/checkout" element={<CheckoutPage />} />
        <Route path="/s/:storeSubUrl/order/:orderId" element={<OrderSuccessPage />} />

        <Route path="/login" element={
          <AuthLayout>
            <LoginForm />
          </AuthLayout>
        } />

        <Route path="/register" element={
          <AuthLayout>
            <RegisterForm />
          </AuthLayout>
        } />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          } />

          {/* Store Sub-Dashboard Routes */}
          <Route path="/store/:storeId" element={<StoreLayout />}>
            <Route index element={<Navigate to="categories" replace />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="analytics" element={<div className="p-8 text-center text-slate-400 font-medium">Analytics Feature Coming Soon</div>} />
            <Route path="coupons" element={<CouponsPage />} />
            <Route path="discounts" element={<DiscountsPage />} />
            <Route path="tax" element={<TaxesPage />} />
            <Route path="shipping" element={<ShippingPage />} />
            <Route path="customize" element={<CustomizeDashboard />} />
            <Route path="settings" element={<StoreSettingsPage />} />
          </Route>

          {/* Full Screen Builder Route */}
          <Route path="/store/:storeId/builder/:pageId" element={<StoreBuilder />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
