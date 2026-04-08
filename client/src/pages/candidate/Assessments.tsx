import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { assessmentApi, AssessmentSession } from '@/api/assessment.api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ClipboardList, Play, CheckCircle, Clock, AlertTriangle, FileText, Sparkles, Rocket } from 'lucide-react';
import { useState, useEffect as useReactEffect } from 'react';

export function AssessmentsPage() {
    const [searchParams] = useSearchParams();
    const resumeId = searchParams.get('resumeId');
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: sessions, isLoading } = useQuery({
        queryKey: ['assessment-sessions'],
        queryFn: assessmentApi.getSessions,
    });

    const createMutation = useMutation({
        mutationFn: (rId: string) => {
            const roomContext = sessionStorage.getItem('room_context');
            const participantId = roomContext ? JSON.parse(roomContext).participantId : undefined;
            return assessmentApi.createSession(rId, participantId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assessment-sessions'] });
            // Don't navigate away yet, wait for progress to complete
            setIsGenerating(true);
        },
        onError: (err: any) => {
            console.error('Failed to create session', err);
            // Remove resumeId from URL on error too to avoid infinite loops
            navigate('/candidate/assessments', { replace: true });
        }
    });

    const hasCreated = useRef(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [progressData, setProgressData] = useState({ total: 10, generated: 0, message: 'Initializing specialized AI assessment...' });

    // Live progress tracking
    useReactEffect(() => {
        if (!isGenerating || !resumeId) return;

        const interval = setInterval(async () => {
            try {
                const data = await assessmentApi.getCreationProgress(resumeId);
                setProgressData(data);
                
                // More robust check for completion (case-insensitive or reaching total)
                const isDone = data.message.toLowerCase() === 'complete' || (data.total > 0 && data.generated >= data.total);
                
                if (isDone) {
                    setIsGenerating(false);
                    // Full reload as requested by user to ensure fresh state
                    window.location.href = '/candidate/assessments';
                }
            } catch (err) {
                // Ignore silent poll errors
            }
        }, 1500);

        return () => clearInterval(interval);
    }, [isGenerating, resumeId, navigate, queryClient]);

    // Automatically create a session if redirected from resume upload with a resumeId
    useEffect(() => {
        if (resumeId && !createMutation.isPending && !createMutation.isSuccess && !hasCreated.current && !isGenerating) {
            hasCreated.current = true;
            createMutation.mutate(resumeId);
        }
    }, [resumeId, createMutation, isGenerating]);

    const getStatusBadge = (status: AssessmentSession['status']) => {
        switch (status) {
            case 'PENDING':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Ready to start</span>;
            case 'IN_PROGRESS':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" /> In Progress</span>;
            case 'COMPLETED':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" /> Completed</span>;
            case 'TIMED_OUT':
            case 'ABANDONED':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><AlertTriangle className="w-3 h-3 mr-1" /> {status === 'TIMED_OUT' ? 'Timed Out' : 'Abandoned'}</span>;
            default:
                return null;
        }
    };

    if (createMutation.isPending || isGenerating) {
        return (
            <div className="flex flex-col items-center justify-center py-32 space-y-8 animate-in fade-in zoom-in duration-700">
                <div className="relative w-24 h-24">
                    {/* Ring background */}
                    <div className="absolute inset-0 border-4 border-blue-50 rounded-full"></div>

                    {/* Spinning outer ring */}
                    <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>

                    {/* Floating sparkles */}
                    <Sparkles className="absolute -top-4 -right-4 w-6 h-6 text-yellow-400 animate-bounce" />
                    <Sparkles className="absolute -bottom-2 -left-4 w-4 h-4 text-blue-300 animate-pulse" />

                    {/* Central Rocket Icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Rocket className="w-10 h-10 text-blue-600 animate-pulse" />
                    </div>
                </div>

                <div className="text-center space-y-3 max-w-sm px-4">
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Preparing Assessment</h2>
                    <p className="text-gray-500 font-medium animate-pulse">{progressData.message}</p>

                    {/* Progress track */}
                    <div className="mt-4 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(10, (progressData.generated / Math.max(1, progressData.total)) * 100)}%` }}></div>
                    </div>
                    <div className="flex justify-between w-full mt-2">
                        <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold pt-2">
                            Powered by Gemini AI
                        </p>
                        <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold pt-2">
                            {progressData.generated} / {progressData.total} Generated
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="space-y-6 max-w-5xl mx-auto animate-pulse">
                <div className="space-y-3">
                    <div className="h-10 w-64 bg-gray-200 rounded-lg" />
                    <div className="h-4 w-96 bg-gray-100 rounded" />
                </div>

                <Card className="border-none shadow-none bg-transparent">
                    <CardHeader className="px-0">
                        <div className="h-8 w-48 bg-gray-200 rounded" />
                    </CardHeader>
                    <CardContent className="px-0 space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-24 w-full bg-white border border-gray-100 rounded-xl" />
                        ))}
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                        Skill Assessments
                    </h1>
                    <p className="text-lg text-gray-500 max-w-2xl">
                        Verify your technical competencies and boost your <span className="text-blue-600 font-semibold">Truth Score</span> profile.
                    </p>
                </div>
            </div>

            {createMutation.isError && (
                <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                    <p className="text-sm font-medium">Failed to create a new session. Please ensure your resume has skills extracted first.</p>
                </div>
            )}

            <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0 pb-6">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <ClipboardList className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <CardTitle className="text-xl">Assessment History</CardTitle>
                            <CardDescription>Track your verification progress across all uploaded resumes.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="px-0">
                    {sessions && sessions.length > 0 ? (
                        <div className="grid gap-4">
                            {sessions.map((session) => (
                                <div
                                    key={session.id}
                                    className="group relative flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300"
                                >
                                    <div className="flex items-start gap-5">
                                        <div className="flex-shrink-0 mt-1">
                                            <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                                                <FileText className="h-6 w-6 text-blue-600 group-hover:text-white" />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition-colors">
                                                {session.resume?.fileName || 'Resume Assessment'}
                                            </h4>
                                            <div className="flex flex-wrap items-center gap-y-2 gap-x-4">
                                                {getStatusBadge(session.status)}
                                                <div className="flex items-center text-sm text-gray-400">
                                                    <Clock className="w-4 h-4 mr-1.5" />
                                                    {new Date(session.createdAt).toLocaleDateString()}
                                                </div>
                                                {session._count && session._count.sessionAnswers > 0 && (
                                                    <div className="flex items-center text-sm text-gray-400">
                                                        <CheckCircle className="w-4 h-4 mr-1.5 text-green-500" />
                                                        {session._count.sessionAnswers} Answered
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 sm:mt-0 w-full sm:w-auto">
                                        {(session.status === 'PENDING' || session.status === 'IN_PROGRESS') ? (
                                            <Link to={`/candidate/assessments/${session.id}`} className="block">
                                                <Button className="w-full sm:w-auto rounded-xl px-8 py-6 h-auto shadow-lg shadow-blue-100 hover:shadow-blue-200 transition-all active:scale-95 bg-blue-600 hover:bg-blue-700">
                                                    <Play className="w-4 h-4 mr-2 fill-current" />
                                                    {session.status === 'PENDING' ? 'Start Now' : 'Continue'}
                                                </Button>
                                            </Link>
                                        ) : (
                                            <Link to={`/candidate/reports/${session.resumeId}`} className="block">
                                                <Button variant="outline" className="w-full sm:w-auto rounded-xl px-8 py-6 h-auto border-gray-200 hover:bg-gray-50 hover:text-blue-600 hover:border-blue-200 transition-all active:scale-95">
                                                    View Insights
                                                </Button>
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-white border border-dashed border-gray-200 rounded-3xl">
                            <div className="relative mx-auto h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                <ClipboardList className="h-10 w-10 text-gray-300" />
                                <div className="absolute -top-1 -right-1 h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center border-2 border-white">
                                    <span className="text-blue-600 font-bold text-[10px]">?</span>
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">No assessments found</h3>
                            <p className="mt-2 text-gray-500 max-w-sm mx-auto">
                                Upload your resume to start verifying your technical skills with AI-generated challenges.
                            </p>
                            <div className="mt-8">
                                <Link to="/candidate/upload">
                                    <Button className="rounded-xl px-8 py-6 h-auto bg-gray-900 hover:bg-black transition-all">
                                        Upload Resume
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
