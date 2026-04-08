import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/admin.api';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Trash2, BookOpen, Layers } from 'lucide-react';

export default function QuestionsManagementPage() {
    const queryClient = useQueryClient();
    const [selectedSkill, setSelectedSkill] = useState<string | undefined>();

    const { data: questions, isLoading: questionsLoading } = useQuery({
        queryKey: ['admin', 'questions', selectedSkill],
        queryFn: () => adminApi.getQuestions(selectedSkill)
    });

    const { data: skills } = useQuery({
        queryKey: ['admin', 'skills'],
        queryFn: () => adminApi.getSkills()
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => adminApi.deleteQuestion(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'questions'] });
        }
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Question Bank</h1>
                    <p className="mt-1 text-gray-600">Review and manage the platform's question repository.</p>
                </div>
                <select
                    className="p-2 border border-gray-300 rounded-md bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={selectedSkill || ''}
                    onChange={(e) => setSelectedSkill(e.target.value || undefined)}
                >
                    <option value="">All Skills</option>
                    {skills?.map((cat: any) => (
                        <optgroup key={cat.id} label={cat.name}>
                            {cat.skills.map((skill: any) => (
                                <option key={skill.id} value={skill.id}>{skill.name}</option>
                            ))}
                        </optgroup>
                    ))}
                </select>
            </div>

            {questionsLoading ? (
                <div className="space-y-4 animate-pulse">
                    {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-lg" />)}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {questions?.map((q: any) => (
                        <Card key={q.id}>
                            <CardContent className="py-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold uppercase rounded">
                                                {q.type}
                                            </span>
                                            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${q.difficulty === 'BEGINNER' ? 'bg-green-50 text-green-700' :
                                                q.difficulty === 'INTERMEDIATE' ? 'bg-yellow-50 text-yellow-700' :
                                                    'bg-red-50 text-red-700'
                                                }`}>
                                                {q.difficulty}
                                            </span>
                                            <span className="text-xs text-gray-500 flex items-center gap-1 ml-2">
                                                <Layers size={12} />
                                                {q.skill.name}
                                            </span>
                                        </div>
                                        <p className="text-gray-900 font-medium">{q.promptText}</p>
                                        {q.type === 'MCQ' && (
                                            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                                                {(q.options as any[]).map((opt, idx) => (
                                                    <div key={idx} className={`p-2 rounded text-xs border ${idx === q.correctOption ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-100 text-gray-600'
                                                        }`}>
                                                        {opt.text}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                        onClick={() => deleteMutation.mutate(q.id)}
                                    >
                                        <Trash2 size={18} />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {questions?.length === 0 && (
                        <div className="py-20 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                            <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No questions found for the selected criteria.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
