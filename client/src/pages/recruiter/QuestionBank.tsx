import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recruiterApi } from '@/api/recruiter.api';
import { adminApi } from '@/api/admin.api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Plus, Trash2, BookOpen, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
type QType = 'MCQ' | 'SUBJECTIVE';

const DIFF_COLORS: Record<Difficulty, string> = {
    EASY: 'bg-green-100 text-green-800 border-green-200',
    MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    HARD: 'bg-red-100 text-red-800 border-red-200',
};

const DEFAULT_OPTIONS = [
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
];

export default function QuestionBankPage() {
    const { roomId } = useParams<{ roomId: string }>();
    const queryClient = useQueryClient();
    const [showForm, setShowForm] = useState(false);

    // Form state
    const [skillId, setSkillId] = useState('');
    const [type, setType] = useState<QType>('MCQ');
    const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');
    const [promptText, setPromptText] = useState('');
    const [options, setOptions] = useState(DEFAULT_OPTIONS.map(o => ({ ...o })));
    const [correctOption, setCorrectOption] = useState(0);

    const { data: questions, isLoading, error } = useQuery({
        queryKey: ['qb', roomId],
        queryFn: () => recruiterApi.getQuestionBank(roomId!),
        enabled: !!roomId,
    });

    const { data: allSkills } = useQuery({
        queryKey: ['admin-skills'],
        queryFn: () => adminApi.getSkills(),
    });

    // Flatten all skills from categories
    const flatSkills: { id: string; name: string }[] = allSkills?.flatMap((cat: any) =>
        cat.skills.map((s: any) => ({ id: s.id, name: s.name }))
    ) || [];

    const addMutation = useMutation({
        mutationFn: () => recruiterApi.addQuestion(roomId!, {
            skillId,
            type,
            difficulty,
            promptText,
            options: type === 'MCQ' ? options : undefined,
            correctOption: type === 'MCQ' ? correctOption : undefined,
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['qb', roomId] });
            setShowForm(false);
            setPromptText('');
            setOptions(DEFAULT_OPTIONS.map(o => ({ ...o })));
            setCorrectOption(0);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (questionId: string) => recruiterApi.deleteQuestion(roomId!, questionId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['qb', roomId] }),
    });

    const updateOption = (idx: number, text: string) => {
        setOptions(prev => prev.map((o, i) => i === idx ? { ...o, text } : o));
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link to={`/recruiter/rooms/${roomId}`}>
                        <Button variant="ghost" className="flex items-center gap-2">
                            <ArrowLeft className="w-4 h-4" /> Back to Room
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <BookOpen className="w-6 h-6 text-blue-600" />
                            Question Bank
                        </h1>
                        <p className="text-sm text-gray-500">Custom questions that will be shown to all candidates in this room.</p>
                    </div>
                </div>
                <Button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                >
                    <Plus className="w-4 h-4" />
                    Add Question
                </Button>
            </div>

            {/* Add Question Form */}
            {showForm && (
                <Card className="border-2 border-blue-200 bg-blue-50/40">
                    <CardHeader>
                        <CardTitle className="text-lg text-blue-900">New Custom Question</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Skill, Type, Difficulty */}
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="text-sm font-semibold text-gray-700 block mb-1">Skill *</label>
                                <select
                                    value={skillId}
                                    onChange={e => setSkillId(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select skill</option>
                                    {flatSkills.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-700 block mb-1">Type</label>
                                <select
                                    value={type}
                                    onChange={e => setType(e.target.value as QType)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="MCQ">MCQ</option>
                                    <option value="SUBJECTIVE">Subjective</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-700 block mb-1">Difficulty</label>
                                <select
                                    value={difficulty}
                                    onChange={e => setDifficulty(e.target.value as Difficulty)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="EASY">Easy</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="HARD">Hard</option>
                                </select>
                            </div>
                        </div>

                        {/* Question Text */}
                        <div>
                            <label className="text-sm font-semibold text-gray-700 block mb-1">Question Text *</label>
                            <textarea
                                value={promptText}
                                onChange={e => setPromptText(e.target.value)}
                                rows={3}
                                placeholder="Enter the question..."
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 resize-none"
                            />
                        </div>

                        {/* MCQ Options */}
                        {type === 'MCQ' && (
                            <div>
                                <label className="text-sm font-semibold text-gray-700 block mb-2">Options (select the correct one)</label>
                                <div className="space-y-2">
                                    {options.map((opt, idx) => (
                                        <div key={idx} className="flex items-center gap-3">
                                            <input
                                                type="radio"
                                                name="correctOption"
                                                checked={correctOption === idx}
                                                onChange={() => setCorrectOption(idx)}
                                                className="w-4 h-4 text-blue-600"
                                            />
                                            <input
                                                type="text"
                                                value={opt.text}
                                                onChange={e => updateOption(idx, e.target.value)}
                                                placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                                                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400"
                                            />
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-400 mt-1">The radio button marks the correct answer.</p>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <Button
                                onClick={() => addMutation.mutate()}
                                disabled={!skillId || !promptText.trim() || addMutation.isPending}
                                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                            >
                                {addMutation.isPending ? 'Adding...' : 'Add to Question Bank'}
                            </Button>
                            <Button variant="outline" onClick={() => setShowForm(false)} className="rounded-lg">
                                Cancel
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Question List */}
            {isLoading && (
                <div className="flex items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
                </div>
            )}

            {error && (
                <div className="text-center py-12">
                    <AlertCircle className="mx-auto h-10 w-10 text-red-400 mb-2" />
                    <p className="text-red-500">Error loading question bank.</p>
                </div>
            )}

            {!isLoading && !error && (
                <div className="space-y-3">
                    {questions?.length === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="py-16 text-center">
                                <BookOpen className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                                <h3 className="text-lg font-semibold text-gray-600">No custom questions yet</h3>
                                <p className="text-gray-400 text-sm mt-1">
                                    Add questions above — they'll be shown to all candidates joining this room, mixed in with the standard AI-generated pool.
                                </p>
                            </CardContent>
                        </Card>
                    ) : questions?.map((q: any, idx: number) => (
                        <Card key={q.id} className="hover:border-blue-200 transition-colors">
                            <CardContent className="pt-4 pb-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xs font-bold text-gray-400">Q{idx + 1}</span>
                                            <Badge variant="outline" className={DIFF_COLORS[q.difficulty as Difficulty]}>
                                                {q.difficulty}
                                            </Badge>
                                            <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-200">
                                                {q.type}
                                            </Badge>
                                            <span className="text-xs text-blue-600 font-semibold">{q.skill?.name}</span>
                                        </div>
                                        <p className="text-sm font-medium text-gray-800 leading-relaxed">{q.promptText}</p>
                                        {q.type === 'MCQ' && Array.isArray(q.options) && (
                                            <div className="mt-2 space-y-1">
                                                {q.options.map((opt: any, i: number) => (
                                                    <div key={i} className={`flex items-center gap-2 text-xs ${i === q.correctOption ? 'text-green-700 font-semibold' : 'text-gray-500'}`}>
                                                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${i === q.correctOption ? 'bg-green-100' : 'bg-gray-100'}`}>
                                                            {String.fromCharCode(65 + i)}
                                                        </span>
                                                        {opt.text || <span className="italic text-gray-300">empty</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                                        onClick={() => {
                                            if (confirm('Remove this question from the bank?')) {
                                                deleteMutation.mutate(q.id);
                                            }
                                        }}
                                        disabled={deleteMutation.isPending}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
