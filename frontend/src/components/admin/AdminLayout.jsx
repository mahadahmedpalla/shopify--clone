import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Bell, LogOut, ShieldAlert } from 'lucide-react';
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
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white flex flex-col fixed inset-y-0 left-0 z-50">
                <div className="p-6 flex items-center space-x-3 border-b border-slate-800">
                    <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                        <ShieldAlert className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-lg tracking-tight">Super Admin</span>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-1">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50'
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                    }`}
                            >
                                <Icon className={`w-5 h-5 mr-3 transition-colors ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-900/10 rounded-xl transition-all"
                    >
                        <LogOut className="w-5 h-5 mr-3" />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8">
                <div className="max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
