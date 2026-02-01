
import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Navbar } from './components/common/Navbar';

// Skeletons
import { StorefrontSkeleton } from './components/skeletons/StorefrontSkeleton';
import { ProductDetailSkeleton } from './components/skeletons/ProductDetailSkeleton';
import { CheckoutSkeleton } from './components/skeletons/CheckoutSkeleton';
import { Skeleton } from './components/ui/Skeleton';

// Lazy Load Pages
const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const StoreLayout = lazy(() => import('./components/store/StoreLayout').then(module => ({ default: module.StoreLayout })));
const CategoriesPage = lazy(() => import('./components/store/CategoriesPage').then(module => ({ default: module.CategoriesPage })));
const ProductsPage = lazy(() => import('./components/store/ProductsPage').then(module => ({ default: module.ProductsPage })));
const CustomizeDashboard = lazy(() => import('./components/store/CustomizeDashboard').then(module => ({ default: module.CustomizeDashboard })));
const StoreBuilder = lazy(() => import('./components/store/StoreBuilder').then(module => ({ default: module.StoreBuilder })));
const PublicStorefront = lazy(() => import('./pages/PublicStorefront').then(module => ({ default: module.PublicStorefront })));
const PublicProductPage = lazy(() => import('./pages/PublicProductPage').then(module => ({ default: module.PublicProductPage })));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage').then(module => ({ default: module.CheckoutPage })));
const DiscountsPage = lazy(() => import('./components/store/discounts/DiscountsPage').then(module => ({ default: module.DiscountsPage })));
const CouponsPage = lazy(() => import('./components/store/coupons/CouponsPage').then(module => ({ default: module.CouponsPage })));
const TaxesPage = lazy(() => import('./components/store/taxes/TaxesPage').then(module => ({ default: module.TaxesPage })));
const ShippingPage = lazy(() => import('./components/store/shipping/ShippingPage').then(module => ({ default: module.ShippingPage })));
const OrdersPage = lazy(() => import('./components/store/orders/OrdersPage').then(module => ({ default: module.OrdersPage })));
const OrderSuccessPage = lazy(() => import('./pages/OrderSuccessPage').then(module => ({ default: module.OrderSuccessPage })));
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
      <Suspense fallback={<AdminLoader />}>
        {children}
      </Suspense>
    </Layout>
  );
}

function AdminLoader() {
  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Public Storefront Route */}
        {/* Public Storefront Route */}
        <Route path="/s/:storeSubUrl" element={
          <Suspense fallback={<StorefrontSkeleton />}>
            <PublicStorefront />
          </Suspense>
        } />
        <Route path="/s/:storeSubUrl/:pageSlug" element={
          <Suspense fallback={<StorefrontSkeleton />}>
            <PublicStorefront />
          </Suspense>
        } />
        <Route path="/s/:storeSubUrl/p/:productId" element={
          <Suspense fallback={<ProductDetailSkeleton />}>
            <PublicProductPage />
          </Suspense>
        } />
        <Route path="/s/:storeSubUrl/checkout" element={
          <Suspense fallback={<CheckoutSkeleton />}>
            <CheckoutPage />
          </Suspense>
        } />
        <Route path="/s/:storeSubUrl/order/:orderId" element={
          <Suspense fallback={<Skeleton className="h-screen w-full" />}>
            <OrderSuccessPage />
          </Suspense>
        } />

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
          <Route path="/store/:storeId" element={
            <Suspense fallback={<AdminLoader />}>
              <StoreLayout />
            </Suspense>
          }>
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
            <Route path="settings" element={<div className="p-8 text-center text-slate-400 font-medium">Store Settings Coming Soon</div>} />
          </Route>

          {/* Full Screen Builder Route */}
          <Route path="/store/:storeId/builder/:pageId" element={
            <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center bg-zinc-900"><div className="animate-spin text-white">Loading Builder...</div></div>}>
              <StoreBuilder />
            </Suspense>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
