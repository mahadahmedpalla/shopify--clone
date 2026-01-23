
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Dashboard } from './pages/Dashboard';
import { Navbar } from './components/common/Navbar';

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
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
