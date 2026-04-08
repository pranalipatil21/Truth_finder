import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/admin.api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
    Layers, Plus, Trash2, BookOpen, Users, AlertCircle, Tag, ChevronDown, ChevronRight
} from 'lucide-react';

export default function SkillCategoriesPage() {
    const queryClient = useQueryClient();
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryDesc, setNewCategoryDesc] = useState('');

    const { data: categories, isLoading, error } = useQuery({
        queryKey: ['admin-skills'],
        queryFn: () => adminApi.getSkills(),
    });

    const createMutation = useMutation({
        mutationFn: () => adminApi.createSkillCategory(newCategoryName.trim(), newCategoryDesc.trim() || undefined),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-skills'] });
            setNewCategoryName('');
            setNewCategoryDesc('');
            setShowAddForm(false);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => adminApi.deleteSkillCategory(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-skills'] }),
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
                <h3 className="text-lg font-semibold">Error loading skill categories</h3>
            </div>
        );
    }

    const totalSkills = categories?.reduce((acc: number, cat: any) => acc + cat.skills.length, 0) || 0;
    const totalQuestions = categories?.reduce((acc: number, cat: any) =>
        acc + cat.skills.reduce((a: number, s: any) => a + (s._count?.questions || 0), 0), 0) || 0;

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Skill Categories</h1>
                    <p className="text-gray-500 mt-1">Manage the taxonomy of skills used across all resumes and assessments.</p>
                </div>
                <Button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                >
                    <Plus className="w-4 h-4" />
                    Add Category
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Total Categories', value: categories?.length || 0, icon: Layers, color: 'blue' },
                    { label: 'Total Skills', value: totalSkills, icon: Tag, color: 'green' },
                    { label: 'Total Questions', value: totalQuestions, icon: BookOpen, color: 'purple' },
                ].map(({ label, value, icon: Icon, color }) => (
                    <Card key={label}>
                        <CardContent className="pt-5 pb-4">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl bg-${color}-50`}>
                                    <Icon className={`w-6 h-6 text-${color}-600`} />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">{label}</p>
                                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Add Category Form */}
            {showAddForm && (
                <Card className="border-2 border-blue-200 bg-blue-50/50">
                    <CardHeader>
                        <CardTitle className="text-lg text-blue-900">New Skill Category</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-sm font-semibold text-gray-700 block mb-1">Category Name *</label>
                            <input
                                type="text"
                                placeholder="e.g. Frontend Development"
                                value={newCategoryName}
                                onChange={e => setNewCategoryName(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-700 block mb-1">Description (optional)</label>
                            <input
                                type="text"
                                placeholder="Brief description of this category"
                                value={newCategoryDesc}
                                onChange={e => setNewCategoryDesc(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div className="flex gap-3">
                            <Button
                                onClick={() => createMutation.mutate()}
                                disabled={!newCategoryName.trim() || createMutation.isPending}
                                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                            >
                                {createMutation.isPending ? 'Creating...' : 'Create Category'}
                            </Button>
                            <Button variant="outline" onClick={() => setShowAddForm(false)} className="rounded-lg">
                                Cancel
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Category List */}
            <div className="space-y-3">
                {categories?.map((category: any) => (
                    <Card key={category.id} className="overflow-hidden">
                        <div
                            className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
                        >
                            <div className="flex items-center gap-3">
                                {expandedCategory === category.id
                                    ? <ChevronDown className="w-5 h-5 text-gray-400" />
                                    : <ChevronRight className="w-5 h-5 text-gray-400" />
                                }
                                <div>
                                    <h3 className="font-semibold text-gray-900">{category.name}</h3>
                                    {category.description && (
                                        <p className="text-sm text-gray-500">{category.description}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Tag className="w-4 h-4" />
                                    {category.skills.length} skills
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm(`Delete category "${category.name}"? This cannot be undone.`)) {
                                            deleteMutation.mutate(category.id);
                                        }
                                    }}
                                    disabled={deleteMutation.isPending}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {expandedCategory === category.id && (
                            <div className="border-t border-gray-100 divide-y divide-gray-50">
                                {category.skills.length === 0 ? (
                                    <div className="p-4 text-center text-sm text-gray-400">
                                        No skills in this category yet. They'll appear here once candidates upload resumes.
                                    </div>
                                ) : (
                                    category.skills.map((skill: any) => (
                                        <div key={skill.id} className="flex items-center justify-between px-6 py-3 bg-gray-50/60">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-blue-400" />
                                                <span className="text-sm font-medium text-gray-900">{skill.name}</span>
                                            </div>
                                            <div className="flex items-center gap-6 text-xs text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <BookOpen className="w-3 h-3" /> {skill._count?.questions || 0} questions
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Users className="w-3 h-3" /> {skill._count?.resumeSkills || 0} candidates
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </Card>
                ))}

                {(!categories || categories.length === 0) && (
                    <Card className="border-dashed">
                        <CardContent className="py-16 text-center">
                            <Layers className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                            <h3 className="text-lg font-semibold text-gray-700">No skill categories yet</h3>
                            <p className="text-gray-400 mt-1">Categories are created automatically when candidates upload resumes, or you can add one manually.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
