import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assessmentApi, Question } from '@/api/assessment.api';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AlertCircle, Sparkles, Rocket, FileText, Play, Clock, ShieldCheck, AlertTriangle, Camera } from 'lucide-react';

// Help helper for tracking dynamic state per skill
interface SkillState {
    currentDifficulty: 'EASY' | 'MEDIUM' | 'HARD';
    questionsSeen: number;
    targetCount: number;
}

export function TakeAssessmentPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, { answer?: string; selectedOption?: number }>>({});
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [showViolationModal, setShowViolationModal] = useState(false);
    const [violationType, setViolationType] = useState<'TAB_SWITCH' | 'OTHER'>('OTHER');
    const [webcamEnabled, setWebcamEnabled] = useState(false);

    // Dynamic difficulty tracking
    const [skillStates, setSkillStates] = useState<Record<string, SkillState>>({});

    // We'll generate the actual "flattened" path dynamically as they answer,
    // but for UI simplicity in a linear flow we'll pre-calculate the sequence
    // based on their answers. Since they can't go back, this is simpler.
    const [activeQuestionSequence, setActiveQuestionSequence] = useState<Array<{
        skillId: string;
        skillName: string;
        question: Question;
        type: 'MCQ' | 'SUBJECTIVE';
    }>>([]);

    const { data: session, isLoading, error } = useQuery({
        queryKey: ['assessment-session', id],
        queryFn: () => assessmentApi.getSession(id!),
        enabled: !!id,
    });

    const startMutation = useMutation({
        mutationFn: () => assessmentApi.startSession(id!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assessment-session', id] });
        }
    });

    const completeMutation = useMutation({
        mutationFn: async () => {
            const submitPayload = Object.entries(answers).map(([qId, ans]) => ({
                questionId: qId,
                ...ans,
            }));
            if (submitPayload.length > 0) {
                await assessmentApi.submitAnswers(id!, submitPayload);
            }
            return assessmentApi.completeSession(id!);
        },
        onSuccess: () => {
            // Stop webcam
            if (videoRef.current?.srcObject) {
                (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
            }
            navigate(`/candidate/assessments/${id}/result`);
        }
    });

    const violationMutation = useMutation({
        mutationFn: (type: 'TAB_SWITCH' | 'OTHER') =>
            assessmentApi.logViolation(id!, type),
    });

    // Initialize WebCam when session becomes IN_PROGRESS
    useEffect(() => {
        if (session?.status !== 'IN_PROGRESS') return;

        let stream: MediaStream | null = null;
        const initWebcam = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    setWebcamEnabled(true);
                }
            } catch (err) {
                console.error("Webcam access denied", err);
                // Optionally handle denial (e.g. force session end)
            }
        };

        if (!videoRef.current?.srcObject) initWebcam();

        return () => {
            if (stream) stream.getTracks().forEach(track => track.stop());
        };
    }, [session?.status]);

    // Snapshot Interval
    useEffect(() => {
        if (session?.status !== 'IN_PROGRESS' || !webcamEnabled) return;

        const captureSnapshot = () => {
            if (videoRef.current && canvasRef.current) {
                const video = videoRef.current;
                const canvas = canvasRef.current;
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                canvas.getContext('2d')?.drawImage(video, 0, 0);
                const base64 = canvas.toDataURL('image/jpeg', 0.5); // compress slightly

                assessmentApi.uploadSnapshot(id!, base64).catch(console.error);
            }
        };

        // Take snapshot every 60 seconds
        const snapshotInterval = setInterval(captureSnapshot, 60000);

        // Take an initial one after a brief delay
        setTimeout(captureSnapshot, 3000);

        return () => clearInterval(snapshotInterval);
    }, [session?.status, webcamEnabled, id]);

    // Dynamic Logic: Generate next question based on answers
    useEffect(() => {
        if (!session?.questionsBySkill) return;

        // Reset if we are recreating the sequence
        if (activeQuestionSequence.length === 0) {
            const initialSequence: any[] = [];
            const newSkillStates: Record<string, SkillState> = {};
            const allSkillIds = Object.keys(session.questionsBySkill);

            allSkillIds.forEach((skillId, index) => {
                const data = session.questionsBySkill[skillId];
                newSkillStates[skillId] = {
                    currentDifficulty: 'MEDIUM', // Start everyone at Medium
                    questionsSeen: 0,
                    targetCount: data.targetCount,
                };

                // Only add the first question of the FIRST skill to the sequence initially
                if (index === 0) {
                    const firstQ = data.mcqs.find(q => q.difficulty === 'MEDIUM') || data.mcqs[0];
                    if (firstQ) {
                        initialSequence.push({ skillId, skillName: data.skillName, question: firstQ, type: 'MCQ' });
                    }
                }
            });

            setSkillStates(newSkillStates);
            setActiveQuestionSequence(initialSequence);
        }

        if (session?.status === 'IN_PROGRESS' && session.startedAt && session.timeLimitSecs) {
            const startTime = new Date(session.startedAt).getTime();
            const now = Date.now();
            const elapsed = Math.floor((now - startTime) / 1000);
            const remaining = Math.max(0, session.timeLimitSecs - elapsed);
            setTimeLeft(remaining);
        }
    }, [session]);

    // Timer Interval
    useEffect(() => {
        if (timeLeft === null || session?.status !== 'IN_PROGRESS') return;

        if (timeLeft <= 0) {
            handleSubmit();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => (prev !== null && prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, session?.status]);

    // Anti-cheat listeners
    useEffect(() => {
        if (session?.status !== 'IN_PROGRESS') return;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                // Log the violation AND set the modal to show on return in the same handler
                violationMutation.mutate('TAB_SWITCH');
                setViolationType('TAB_SWITCH');
                // We'll show the modal when they return (document.hidden becomes false)
            } else {
                setShowViolationModal(true);
            }
        };

        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            violationMutation.mutate('OTHER');
        };
        const handleCopy = (e: ClipboardEvent) => {
            e.preventDefault();
            violationMutation.mutate('OTHER');
            setViolationType('OTHER');
            setShowViolationModal(true);
        };
        const handlePaste = (e: ClipboardEvent) => {
            e.preventDefault();
            violationMutation.mutate('OTHER');
            setViolationType('OTHER');
            setShowViolationModal(true);
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('copy', handleCopy);
        document.addEventListener('paste', handlePaste);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('copy', handleCopy);
            document.removeEventListener('paste', handlePaste);
        };
    }, [session?.status]);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleStart = () => {
        startMutation.mutate();
    };

    const handleNext = () => {
        if (currentQuestionIndex < activeQuestionSequence.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            return;
        }

        // Dynamic Generation Logic
        if (!session?.questionsBySkill) return;

        const currentQ = activeQuestionSequence[currentQuestionIndex];
        const currentAns = answers[currentQ.question.id];
        const currentSkillState = skillStates[currentQ.skillId];
        const allSkillIds = Object.keys(session.questionsBySkill);
        const currentSkillIndex = allSkillIds.indexOf(currentQ.skillId);

        if (!currentSkillState) return;

        const currentSkillData = session.questionsBySkill[currentQ.skillId];
        const maxAvailable = currentSkillData.mcqs.length + currentSkillData.subjective.length;
        
        // Have we seen enough for this skill (or exhausted available)?
        const isSkillFinished = currentSkillState.questionsSeen + 1 >= currentSkillState.targetCount || currentSkillState.questionsSeen + 1 >= maxAvailable;

        if (isSkillFinished) {
            // Find the NEXT skill that actually has questions
            let foundNext = false;
            for (let i = currentSkillIndex + 1; i < allSkillIds.length; i++) {
                const nextSkillId = allSkillIds[i];
                const nextSkillData = session.questionsBySkill[nextSkillId];
                const nextQ = nextSkillData.mcqs.find(q => q.difficulty === 'MEDIUM') || nextSkillData.mcqs[0] || (nextSkillData.subjective && nextSkillData.subjective[0]);
                
                if (nextQ) {
                    setActiveQuestionSequence(prev => [
                        ...prev,
                        { skillId: nextSkillId, skillName: nextSkillData.skillName, question: nextQ, type: nextSkillData.mcqs.includes(nextQ) ? 'MCQ' : 'SUBJECTIVE' }
                    ]);
                    setCurrentQuestionIndex(prev => prev + 1);
                    foundNext = true;
                    break;
                }
            }

            if (!foundNext) {
                // We reached the actual end (no more skills have questions)
                handleSubmit();
            }
            return;
        }

        // Generate next question for SAME skill based on answer correctness

        // Generate next question for SAME skill based on answer correctness
        const isLikelyCorrect = currentAns?.selectedOption !== undefined;

        let nextDiff: 'EASY' | 'MEDIUM' | 'HARD' = currentSkillState.currentDifficulty;
        if (isLikelyCorrect) {
            if (nextDiff === 'EASY') nextDiff = 'MEDIUM';
            else if (nextDiff === 'MEDIUM') nextDiff = 'HARD';
        } else {
            if (nextDiff === 'HARD') nextDiff = 'MEDIUM';
            else if (nextDiff === 'MEDIUM') nextDiff = 'EASY';
        }

        const data = session.questionsBySkill[currentQ.skillId];
        const usedIds = new Set(activeQuestionSequence.filter(q => q.skillId === currentQ.skillId).map(q => q.question.id));

        // Find next question of desired diff
        let candidateQ = undefined;
        let isSubjective = false;

        // Show subjective question for the very last question of this skill
        if (currentSkillState.questionsSeen + 1 === currentSkillState.targetCount && data.subjective && data.subjective.length > 0) {
            candidateQ = data.subjective[0];
            isSubjective = true;
        } else if (data.mcqs && data.mcqs.length > 0) {
            candidateQ = data.mcqs.find(q => q.difficulty === nextDiff && !usedIds.has(q.id));
            if (!candidateQ) {
                candidateQ = data.mcqs.find(q => !usedIds.has(q.id));
            }
        }

        if (candidateQ) {
            const nextSeqItem = { skillId: currentQ.skillId, skillName: currentQ.skillName, question: candidateQ, type: (isSubjective ? 'SUBJECTIVE' : 'MCQ') as 'MCQ' | 'SUBJECTIVE' };

            setSkillStates(prev => ({
                ...prev,
                [currentQ.skillId]: {
                    ...prev[currentQ.skillId],
                    currentDifficulty: nextDiff,
                    questionsSeen: currentSkillState.questionsSeen + 1,
                },
            }));

            setActiveQuestionSequence(prev => [...prev, nextSeqItem]);
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            // No more questions available for this skill in the DB! We've unexpectedly exhausted it.
            // Find the NEXT skill that actually has questions
            let foundNext = false;
            for (let i = currentSkillIndex + 1; i < allSkillIds.length; i++) {
                const nextSkillId = allSkillIds[i];
                const nextSkillData = session.questionsBySkill[nextSkillId];
                const nextQ = nextSkillData.mcqs.find(q => q.difficulty === 'MEDIUM') || nextSkillData.mcqs[0] || (nextSkillData.subjective && nextSkillData.subjective[0]);
                
                if (nextQ) {
                    setActiveQuestionSequence(prev => [
                        ...prev,
                        { skillId: nextSkillId, skillName: nextSkillData.skillName, question: nextQ, type: nextSkillData.mcqs.includes(nextQ) ? 'MCQ' : 'SUBJECTIVE' }
                    ]);
                    setCurrentQuestionIndex(prev => prev + 1);
                    foundNext = true;
                    break;
                }
            }

            if (!foundNext) {
                // Force target count update to trigger Submit UI or just submit
                handleSubmit();
            }
        }
    };

    const handlePrevious = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const handleSubmit = () => {
        completeMutation.mutate();
    };

    const currentQ = activeQuestionSequence[currentQuestionIndex];

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 space-y-4 animate-in fade-in duration-700">
                <div className="relative w-20 h-20">
                    <div className="absolute inset-0 border-4 border-blue-50 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Rocket className="w-8 h-8 text-blue-600 animate-pulse" />
                    </div>
                </div>
                <div className="text-center space-y-1">
                    <p className="text-gray-900 font-bold text-lg">Initializing session...</p>
                    <p className="text-gray-500 text-sm animate-pulse">Preparing your personalized questions</p>
                </div>
            </div>
        );
    }

    if (error || !session) {
        return (
            <div className="max-w-3xl mx-auto p-4 bg-red-50 text-red-700 rounded-md flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" /> Error loading assessment.
            </div>
        );
    }

    if (session.status === 'COMPLETED' || session.status === 'TIMED_OUT') {
        navigate(`/candidate/assessments/${id}/result`, { replace: true });
        return null;
    }

    if (session.status === 'PENDING') {
        return (
            <div className="max-w-2xl mx-auto mt-12 animate-in slide-in-from-bottom-8 duration-500">
                <Card className="overflow-hidden border-none shadow-2xl rounded-3xl">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 h-3 w-full" />
                    <CardHeader className="text-center pt-10 px-8">
                        <div className="mx-auto w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 transform rotate-3">
                            <Sparkles className="w-8 h-8 text-blue-600" />
                        </div>
                        <CardTitle className="text-3xl font-extrabold text-gray-900">Ready to Start?</CardTitle>
                        <p className="mt-2 text-gray-500">Verify your expertise and earn your Truth Score.</p>
                    </CardHeader>
                    <CardContent className="space-y-8 px-8 pb-10">
                        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <div className="p-3 bg-white rounded-xl shadow-sm">
                                <FileText className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Evaluation for</p>
                                <p className="text-gray-900 font-bold">{session.resume?.fileName}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 p-4 rounded-2xl bg-blue-50/50">
                                <Clock className="w-5 h-5 text-blue-600" />
                                <div>
                                    <p className="text-[10px] text-blue-400 font-bold uppercase">Time Limit</p>
                                    <p className="text-sm font-bold text-blue-900">60 Minutes</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 rounded-2xl bg-green-50/50">
                                <ShieldCheck className="w-5 h-5 text-green-600" />
                                <div>
                                    <p className="text-[10px] text-green-400 font-bold uppercase">Truth Level</p>
                                    <p className="text-sm font-bold text-green-900">Verified AI</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100">
                            <h4 className="flex items-center gap-2 text-sm font-bold text-amber-900 mb-2">
                                <AlertCircle className="w-4 h-4" /> Assessment Guidelines
                            </h4>
                            <ul className="space-y-2">
                                {[
                                    `Dynamic difficulty questions`,
                                    `Mixed format with MCQ challenges`,
                                    'Anti-cheat, webcam monitoring, and AI-verified scoring enabled',
                                    'Do not refresh or close this tab once session begins'
                                ].map((item, idx) => (
                                    <li key={idx} className="flex gap-2 text-xs text-amber-700/80">
                                        <div className="w-1.5 h-1.5 bg-amber-300 rounded-full mt-1 flex-shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <Button
                            size="lg"
                            onClick={handleStart}
                            disabled={startMutation.isPending}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-8 text-lg font-bold shadow-xl shadow-blue-200 hover:shadow-blue-300 transition-all active:scale-[0.98] group"
                        >
                            {startMutation.isPending ? 'Preparing Session...' : (
                                <>
                                    Begin Assessment Now
                                    <Play className="ml-2 w-5 h-5 fill-current group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (activeQuestionSequence.length === 0 && session.status === 'IN_PROGRESS') {
        return (
            <div className="max-w-2xl mx-auto mt-16 text-center space-y-6 animate-in fade-in duration-500">
                <div className="mx-auto w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-10 h-10 text-amber-500" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-gray-900">Questions Still Loading</h2>
                    <p className="text-gray-500 max-w-sm mx-auto">
                        The AI is generating your personalized questions. This session's questions may still be being prepared — please wait a moment and refresh.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                        variant="outline"
                        onClick={() => window.location.reload()}
                        className="rounded-xl px-8"
                    >
                        Refresh Page
                    </Button>
                    <Button
                        onClick={() => navigate('/candidate/assessments')}
                        className="rounded-xl px-8 bg-blue-600 hover:bg-blue-700"
                    >
                        Back to Assessments
                    </Button>
                </div>
            </div>
        );
    }

    const questionsBySkill = session?.questionsBySkill || {};
    const allSkillIds = Object.keys(questionsBySkill);
    const currentSkillIndex = currentQ ? allSkillIds.indexOf(currentQ.skillId) : -1;
    
    // Check if any SUBSEQUENT skills actually have any questions inside them
    let hasMoreQuestionsAhead = false;
    for (let i = currentSkillIndex + 1; i < allSkillIds.length; i++) {
        const checkData = questionsBySkill[allSkillIds[i]];
        if ((checkData?.mcqs?.length || 0) + (checkData?.subjective?.length || 0) > 0) {
            hasMoreQuestionsAhead = true;
            break;
        }
    }

    const currentSkillState = currentQ ? skillStates[currentQ.skillId] : null;
    const currentSkillData = currentQ ? questionsBySkill[currentQ.skillId] : null;
    const maxAvailable = currentSkillData ? (currentSkillData.mcqs?.length || 0) + (currentSkillData.subjective?.length || 0) : 0;

    const isLastQuestion = currentQuestionIndex === activeQuestionSequence.length - 1 &&
        !hasMoreQuestionsAhead &&
        (currentSkillState ? (currentSkillState.questionsSeen + 1 >= currentSkillState.targetCount || currentSkillState.questionsSeen + 1 >= maxAvailable) : true);

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-end mb-6">
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900">Skill Assessment</h1>
                    <p className="text-gray-600">Skill: {currentQ.skillName}</p>
                </div>

                <div className="flex gap-4">
                    {timeLeft !== null && (
                        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-2xl border shadow-sm font-bold ${timeLeft < 300 ? 'bg-red-50 text-red-600 border-red-100 animate-pulse' : 'bg-white text-gray-700 border-gray-100'
                            }`}>
                            <Clock className="w-4 h-4" />
                            <span className="tabular-nums">{formatTime(timeLeft)}</span>
                        </div>
                    )}
                    <div className="text-sm font-medium text-gray-500 bg-white px-3 py-1 rounded-full border shadow-sm self-end">
                        Current Difficulty: <span className="font-bold text-gray-900">{skillStates[currentQ.skillId]?.currentDifficulty || 'MEDIUM'}</span>
                    </div>
                </div>
            </div>

            {/* Hidden Video element for Snapshots */}
            <video ref={videoRef} className="hidden" autoPlay muted playsInline />
            <canvas ref={canvasRef} className="hidden" />

            <Card className="min-h-[400px] flex flex-col">
                <CardContent className="flex-1 pt-6">
                    <div className="mb-6 flex justify-between items-center">
                        <span className="inline-block px-2 py-1 text-xs font-semibold uppercase tracking-wider text-blue-800 bg-blue-100 rounded">
                            {currentQ.type === 'MCQ' ? 'Multiple Choice' : 'Subjective'}
                        </span>
                        {webcamEnabled && (
                            <div className="flex items-center gap-2 text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">
                                <Camera className="w-4 h-4" /> Recording
                            </div>
                        )}
                    </div>
                    <h3 className="text-xl font-medium text-gray-900 leading-relaxed whitespace-pre-wrap">
                        {currentQ.question.promptText}
                    </h3>


                    <div className="mt-8">
                        {currentQ.type === 'MCQ' && currentQ.question.options ? (
                            <div className="space-y-4">
                                {currentQ.question.options.map((opt: any, idx: number) => (
                                    <div
                                        key={idx}
                                        onClick={() =>
                                            setAnswers(prev => ({
                                                ...prev,
                                                [currentQ.question.id]: { selectedOption: idx },
                                            }))
                                        }
                                        className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${answers[currentQ.question.id]?.selectedOption === idx
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:bg-gray-50'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name={`question-${currentQ.question.id}`}
                                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                            checked={answers[currentQ.question.id]?.selectedOption === idx}
                                            onChange={() => setAnswers(prev => ({
                                                ...prev,
                                                [currentQ.question.id]: { selectedOption: idx }
                                            }))}
                                        />
                                        <span className="ml-3 text-gray-700">{opt.text}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full">
                                <textarea
                                    className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                    placeholder="Type your answer here in detail..."
                                    value={answers[currentQ.question.id]?.answer || ''}
                                    onChange={(e) => setAnswers(prev => ({
                                        ...prev,
                                        [currentQ.question.id]: { answer: e.target.value }
                                    }))}
                                />
                            </div>
                        )}
                    </div>
                </CardContent>

                <CardFooter className="border-t bg-gray-50 flex justify-between p-4 rounded-b-lg">
                    <Button
                        variant="outline"
                        onClick={handlePrevious}
                        disabled={currentQuestionIndex === 0}
                    >
                        Previous
                    </Button>
                    <Button
                        onClick={isLastQuestion ? handleSubmit : handleNext}
                        disabled={completeMutation.isPending}
                        className="flex-1 max-w-xs"
                    >
                        {isLastQuestion ? (completeMutation.isPending ? 'Submitting...' : 'Submit Assessment') : 'Next Question'}
                    </Button>
                </CardFooter>
            </Card>

            {/* Progress bar */}
            <div className="mt-6 bg-gray-200 rounded-full h-2 w-full overflow-hidden">
                <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out"
                    style={{ width: `${activeQuestionSequence.length > 0 ? ((currentQuestionIndex + 1) / Math.max(activeQuestionSequence.length, 10)) * 100 : 0}%` }}
                ></div>
            </div>

            {/* Violation Warning Modal */}
            {showViolationModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full text-center space-y-6 transform animate-in zoom-in-95 duration-200">
                        <div className="mx-auto w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-2">
                            <AlertTriangle className="w-8 h-8 text-red-600" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold text-gray-900">Security Alert</h3>
                            <p className="text-gray-600">
                                {violationType === 'TAB_SWITCH'
                                    ? "We detected that you switched away from the assessment tab. This has been logged as a violation."
                                    : "Unauthorized action detected. This activity has been recorded."}
                            </p>
                            <p className="text-sm text-red-500 font-semibold p-3 bg-red-50 rounded-xl mt-4">
                                Continued violations will lead to automatic disqualification and session termination.
                            </p>
                        </div>
                        <Button
                            onClick={() => setShowViolationModal(false)}
                            className="w-full bg-red-600 hover:bg-red-700 text-white rounded-2xl py-6 font-bold"
                        >
                            I Understand, Return to Test
                        </Button>
                    </div>
                </div>
            )}

            {/* Submission Overlay */}
            {completeMutation.isPending && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-500">
                    <div className="bg-white p-10 rounded-3xl shadow-2xl max-w-sm w-full text-center space-y-6 transform animate-in zoom-in-95 duration-300">
                        <div className="relative mx-auto w-24 h-24">
                            <div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
                            <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-3xl animate-bounce">🚀</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold text-gray-900">Finalizing...</h3>
                            <p className="text-gray-500 animate-pulse">
                                AI is analyzing your answers and calculating your truth score.
                            </p>
                        </div>

                        <div className="flex justify-center gap-1">
                            {[0, 1, 2].map((i) => (
                                <div
                                    key={i}
                                    className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                                    style={{ animationDelay: `${i * 0.15}s` }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
