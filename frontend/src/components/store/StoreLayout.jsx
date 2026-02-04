
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link, NavLink, Outlet } from 'react-router-dom';
import {
    LayoutGrid,
    Package,
    ShoppingCart,
    BarChart3,
    Ticket,
    Percent,
    Palette,
    Settings,
    ChevronRight,
    LogOut,
    Truck,
    Coins,
    Store
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';

export function StoreLayout() {
    const { storeId } = useParams();
    const navigate = useNavigate();
    const [store, setStore] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Verify authentication
        const isAuth = sessionStorage.getItem(`store_auth_${storeId}`);
        if (!isAuth) {
            navigate('/dashboard');
            return;
        }

        fetchStore();
    }, [storeId]);

    const fetchStore = async () => {
        const { data } = await supabase
            .from('stores')
            .select('*')
            .eq('id', storeId)
            .single();

        setStore(data);
        setLoading(false);
    };

    const handleExit = () => {
        sessionStorage.removeItem(`store_auth_${storeId}`);
        navigate('/dashboard');
    };

    const navItems = [
        { name: 'Categories', icon: <LayoutGrid className="h-5 w-5" />, path: 'categories' },
        { name: 'Products', icon: <Package className="h-5 w-5" />, path: 'products' },
        { name: 'Orders', icon: <ShoppingCart className="h-5 w-5" />, path: 'orders' },
        { name: 'Analytics', icon: <BarChart3 className="h-5 w-5" />, path: 'analytics' },
        { name: 'Coupon', icon: <Ticket className="h-5 w-5" />, path: 'coupons' },
        { name: 'Discount', icon: <Percent className="h-5 w-5" />, path: 'discounts' },
        { type: 'divider' },
        { name: 'Tax', icon: <Coins className="h-5 w-5" />, path: 'tax' },
        { name: 'Shipping', icon: <Truck className="h-5 w-5" />, path: 'shipping' },
    ];

    const bottomItems = [
        { name: 'Customize Store', icon: <Palette className="h-5 w-5" />, path: 'customize' },
        { name: 'Store Settings', icon: <Settings className="h-5 w-5" />, path: 'settings' },
    ];

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
    );

    return (
        <div className="flex h-screen bg-slate-50 font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
                <div className="p-6 border-b border-slate-100">
                    <Link to={`/store/${storeId}/dashboard`} className="flex items-center space-x-3">
                        <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                            {store?.name?.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-800 truncate">{store?.name}</span>
                    </Link>
                </div>

                <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                    {navItems.map((item, index) => {
                        if (item.type === 'divider') {
                            return <div key={`divider-${index}`} className="my-2 border-t border-slate-100 mx-3" />;
                        }
                        return (
                            <NavLink
                                key={item.name}
                                to={`/store/${storeId}/${item.path}`}
                                className={({ isActive }) => `
                flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${isActive
                                        ? 'bg-indigo-50 text-indigo-700'
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
              `}
                            >
                                {item.icon}
                                <span>{item.name}</span>
                            </NavLink>
                        );
                    })}

                    <div className="my-6 border-t border-slate-100 pt-6">
                        {bottomItems.map((item) => (
                            <NavLink
                                key={item.name}
                                to={`/store/${storeId}/${item.path}`}
                                className={({ isActive }) => `
                  flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${isActive
                                        ? 'bg-indigo-50 text-indigo-700'
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                `}
                            >
                                {item.icon}
                                <span>{item.name}</span>
                            </NavLink>
                        ))}
                    </div>
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <button
                        onClick={handleExit}
                        className="flex items-center space-x-3 w-full px-3 py-2.5 text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <LogOut className="h-5 w-5" />
                        <span>Exit Store</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Top Navbar */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
                    <div className="flex items-center space-x-4 text-sm text-slate-500">
                        <Link to="/dashboard" className="hover:text-slate-800">My Stores</Link>
                        <ChevronRight className="h-4 w-4" />
                        <span className="font-medium text-slate-900">{store?.name}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Button variant="secondary" size="sm" onClick={() => window.open(`https://storeplatform.com/${store?.sub_url}`, '_blank')}>
                            View Store
                        </Button>
                    </div>
                </header>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-6xl mx-auto">
                        <Outlet context={{ store, refreshStore: fetchStore }} />
                    </div>
                </div>
            </main>
        </div>
    );
}
