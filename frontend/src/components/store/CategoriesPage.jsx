
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Plus, LayoutGrid, ToggleLeft as Toggle, ToggleRight, Trash2, Edit2, Search, ChevronRight, ChevronDown } from 'lucide-react';
import { CreateCategoryModal } from './CreateCategoryModal';

export function CategoriesPage() {
    const { storeId } = useParams();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [expandedParents, setExpandedParents] = useState(new Set());

    useEffect(() => {
        fetchCategories();
    }, [storeId]);

    const fetchCategories = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('product_categories')
            .select('*')
            .eq('store_id', storeId)
            .order('created_at', { ascending: false });

        if (error) console.error('Error fetching categories:', error);
        else setCategories(data || []);
        setLoading(false);
    };

    const handleToggleStatus = async (category) => {
        const { error } = await supabase
            .from('product_categories')
            .update({ is_active: !category.is_active })
            .eq('id', category.id);

        if (error) alert('Failed to update status');
        else fetchCategories();
    };

    const handleDeleteCategory = async (id) => {
        if (!confirm('Are you sure you want to delete this category? All sub-categories will also be deleted.')) return;

        const { error } = await supabase
            .from('product_categories')
            .delete()
            .eq('id', id);

        if (error) alert('Failed to delete category: ' + error.message);
        else fetchCategories();
    };

    const toggleExpand = (id) => {
        const newExpanded = new Set(expandedParents);
        if (newExpanded.has(id)) newExpanded.delete(id);
        else newExpanded.add(id);
        setExpandedParents(newExpanded);
    };

    const filteredCategories = categories.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Build a tree structure for recursive rendering
    const buildTree = (items, parentId = null) => {
        return items
            .filter(item => item.parent_id === parentId)
            .map(item => ({
                ...item,
                children: buildTree(items, item.id)
            }));
    };

    const categoryTree = buildTree(filteredCategories);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Categories</h1>
                    <p className="text-slate-500 text-sm">Organize your products by creating categories and sub-categories.</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="h-5 w-5 mr-2" />
                    Create Category
                </Button>
            </div>

            <Card className="p-0">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search categories..."
                            className="pl-10 pr-4 py-2 w-full bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                                <th className="px-6 py-3">Category Name & ID</th>
                                <th className="px-6 py-3">Created</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-slate-400">Loading categories...</td>
                                </tr>
                            ) : categoryTree.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-slate-400">No categories found. Click "Create Category" to get started.</td>
                                </tr>
                            ) : (
                                categoryTree.map(node => (
                                    <CategoryNodes
                                        key={node.id}
                                        node={node}
                                        level={0}
                                        expandedParents={expandedParents}
                                        onToggleExpand={toggleExpand}
                                        onToggleStatus={handleToggleStatus}
                                        onDelete={handleDeleteCategory}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            <CreateCategoryModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    setIsModalOpen(false);
                    fetchCategories();
                }}
                storeId={storeId}
                allCategories={categories}
            />
        </div>
    );
}

function CategoryNodes({ node, level, expandedParents, onToggleExpand, onToggleStatus, onDelete }) {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedParents.has(node.id);

    return (
        <React.Fragment>
            <CategoryRow
                category={node}
                level={level}
                hasChildren={hasChildren}
                isExpanded={isExpanded}
                onToggleExpand={onToggleExpand}
                onToggleStatus={onToggleStatus}
                onDelete={onDelete}
            />
            {isExpanded && node.children.map(child => (
                <CategoryNodes
                    key={child.id}
                    node={child}
                    level={level + 1}
                    expandedParents={expandedParents}
                    onToggleExpand={onToggleExpand}
                    onToggleStatus={onToggleStatus}
                    onDelete={onDelete}
                />
            ))}
        </React.Fragment>
    );
}

function CategoryRow({ category, level, hasChildren, isExpanded, onToggleExpand, onToggleStatus, onDelete }) {
    return (
        <tr className={`hover:bg-slate-50 transition-colors ${level > 0 ? 'bg-slate-50/10' : ''}`}>
            <td className="px-6 py-4">
                <div className="flex items-center">
                    <div style={{ width: `${level * 24}px` }} />
                    {hasChildren ? (
                        <button onClick={() => onToggleExpand(category.id)} className="mr-2 text-slate-400 hover:text-slate-600">
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>
                    ) : (
                        <div className="mr-2 w-4" />
                    )}
                    <div className="flex flex-col">
                        <span className="font-semibold text-slate-800 text-sm flex items-center">
                            <LayoutGrid className="h-3 w-3 mr-2 text-slate-400" />
                            {category.name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 mt-1 uppercase tracking-tight">ID: {category.id}</span>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4 text-xs text-slate-500 font-medium">
                {new Date(category.created_at).toLocaleDateString()}
            </td>
            <td className="px-6 py-4">
                <button
                    onClick={() => onToggleStatus(category)}
                    className={`flex items-center space-x-2 text-xs font-bold transition-colors ${category.is_active ? 'text-green-600' : 'text-slate-400'}`}
                >
                    {category.is_active ? <ToggleRight className="h-5 w-5" /> : <Toggle className="h-5 w-5" />}
                    <span className="uppercase tracking-widest">{category.is_active ? 'Active' : 'Inactive'}</span>
                </button>
            </td>
            <td className="px-6 py-4 text-right">
                <div className="flex justify-end space-x-2">
                    <button className="p-1 text-slate-400 hover:text-indigo-600"><Edit2 className="h-4 w-4" /></button>
                    <button
                        onClick={() => onDelete(category.id)}
                        className="p-1 text-slate-400 hover:text-red-600"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </td>
        </tr>
    );
}
