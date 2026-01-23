
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';

export function LoginForm() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password,
            });

            if (error) throw error;

            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="max-w-md w-full mx-auto">
            <div className="text-center mb-6">
                <h2 className="text-3xl font-extrabold text-gray-900">Welcome back</h2>
                <p className="mt-2 text-sm text-gray-600">
                    Sign in to access your store dashboard
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                    id="email"
                    name="email"
                    type="email"
                    label="Email address"
                    required
                    value={formData.email}
                    onChange={handleChange}
                />

                <Input
                    id="password"
                    name="password"
                    type="password"
                    label="Password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                />

                {error && (
                    <div className="rounded-md bg-red-50 p-4">
                        <div className="flex">
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">Login failed</h3>
                                <div className="mt-2 text-sm text-red-700">
                                    <p>{error}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div>
                    <Button
                        type="submit"
                        className="w-full"
                        isLoading={loading}
                    >
                        Sign in
                    </Button>
                </div>

                <div className="text-center text-sm">
                    <span className="text-gray-500">Don't have an account? </span>
                    <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
                        Create one today
                    </Link>
                </div>
            </form>
        </Card>
    );
}
