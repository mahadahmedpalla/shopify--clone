
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';

export function RegisterForm() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords don't match");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // 1. Sign up with Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.fullName,
                    },
                },
            });

            if (authError) throw authError;

            if (authData.user) {
                // 2. Create profile in store_owners table
                // Note: The trigger/RLS policy we set up might handle some of this, 
                // but explicit creation ensures we control the data
                const { error: profileError } = await supabase
                    .from('store_owners')
                    .insert([
                        {
                            id: authData.user.id,
                            email: formData.email,
                            full_name: formData.fullName,
                            credits: 0 // Initial credits
                        }
                    ]);

                if (profileError) {
                    // If profile creation fails, we might want to alert or retry
                    // But for now let's just log it, as the auth user is created
                    console.error('Error creating profile:', profileError);
                }

                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="max-w-md w-full mx-auto">
            <div className="text-center mb-6">
                <h2 className="text-3xl font-extrabold text-gray-900">Start your journey</h2>
                <p className="mt-2 text-sm text-gray-600">
                    Create your account and build your store
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    label="Full Name"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                />

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

                <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    label="Confirm Password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                />

                {error && (
                    <div className="rounded-md bg-red-50 p-4">
                        <div className="flex">
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">Registration failed</h3>
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
                        Create Account
                    </Button>
                </div>

                <div className="text-center text-sm">
                    <span className="text-gray-500">Already have an account? </span>
                    <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                        Sign in
                    </Link>
                </div>
            </form>
        </Card>
    );
}
