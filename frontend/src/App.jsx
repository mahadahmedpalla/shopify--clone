
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
            <Route path="orders" element={<div className="p-8 text-center text-slate-400 font-medium">Orders Feature Coming Soon</div>} />
            <Route path="analytics" element={<div className="p-8 text-center text-slate-400 font-medium">Analytics Feature Coming Soon</div>} />
            <Route path="coupons" element={<div className="p-8 text-center text-slate-400 font-medium">Coupons Feature Coming Soon</div>} />
            <Route path="discounts" element={<div className="p-8 text-center text-slate-400 font-medium">Discounts Feature Coming Soon</div>} />
            <Route path="customize" element={<div className="p-8 text-center text-slate-400 font-medium">Customize Store Coming Soon</div>} />
            <Route path="settings" element={<div className="p-8 text-center text-slate-400 font-medium">Store Settings Coming Soon</div>} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
