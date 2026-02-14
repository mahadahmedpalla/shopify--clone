import React from 'react';
import { Outlet, Link, useLocation, useNavigate, NavLink } from 'react-router-dom';
import { LayoutDashboard, Bell, LogOut, ShieldAlert, ChevronRight } from 'lucide-react';
import { Button } from '../ui/Button';

export function AdminLayout() {
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('admin_session');
            localStorage.removeItem('admin_user');
            navigate('/sec/admin/login');
        }
    };

    const navItems = [
        { path: '/sec/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/sec/admin/notifications', label: 'Notifications', icon: Bell },
    ];

    return (
        <div className="flex h-screen bg-slate-50 font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
                <div className="p-6 border-b border-slate-100">
                    <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                            <ShieldAlert className="h-5 w-5" />
                        </div>
                        <span className="font-bold text-slate-800 text-lg tracking-tight">Super Admin</span>
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `
                                flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                                ${isActive
                                    ? 'bg-indigo-50 text-indigo-700'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                            `}
                        >
                            <item.icon className="h-5 w-5" />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 w-full px-3 py-2.5 text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <LogOut className="h-5 w-5" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Top Navbar */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
                    <div className="flex items-center space-x-4 text-sm text-slate-500">
                        <span className="font-medium text-slate-900">Administration</span>
                        <ChevronRight className="h-4 w-4" />
                        <span className="text-slate-500">Overview</span>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-xs border border-indigo-200">
                            SA
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-6xl mx-auto">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
}
