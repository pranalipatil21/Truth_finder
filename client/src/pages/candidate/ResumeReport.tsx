import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { scoringApi, SkillScore } from '@/api/scoring.api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
    ArrowLeft,
    Trophy,
    CheckCircle2,
    XCircle,
    HelpCircle,
    BarChart3,
    FileText,
    History
} from 'lucide-react';

export default function ResumeReportPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

    const isSessionRoute = location.pathname.includes('/assessments/');

    const { data: report, isLoading, error } = useQuery({
        queryKey: ['resume-report', id],
        queryFn: () => isSessionRoute ? scoringApi.getScoreBySession(id!) : scoringApi.getResumeScore(id!),
        enabled: !!id,
    });

    useEffect(() => {
        if (report?.sessions && report.sessions.length > 0 && !selectedSessionId) {
            // Check if the URL ID exists in the sessions list, otherwise default to the first one
            const hasSession = report.sessions.some(s => s.sessionId === id);
            setSelectedSessionId(hasSession ? id! : report.sessions[0].sessionId);
        }
    }, [report, selectedSessionId, id]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error || !report) {
        return (
            <div className="p-6 text-center">
                <h3 className="text-lg font-semibold">Report not found</h3>
                <Button className="mt-4" onClick={() => navigate('/candidate/reports')}>Back to Reports</Button>
            </div>
        );
    }

    const { overallScore, sessions } = report;
    const selectedSession = sessions?.find(s => s.sessionId === selectedSessionId) || sessions?.[0];
    const score = overallScore?.authenticityScore || 0;
    const activeScore = selectedSession?.overallScore || score;

    const getTierLabel = (score: number) => {
        if (score >= 85) return 'Highly Authentic';
        if (score >= 65) return 'Mostly Accurate';
        if (score >= 40) return 'Partially Verified';
        return 'Significant Discrepancies';
    };

    const getTierColor = (score: number) => {
        if (score >= 85) return 'text-green-600';
        if (score >= 65) return 'text-blue-600';
        if (score >= 40) return 'text-yellow-600';
        return 'text-red-600';
    };

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate('/candidate/reports')} className="md:px-4 px-2">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <div className="text-sm font-medium text-muted-foreground flex items-center bg-gray-100 py-1.5 px-3 rounded-full">
                        <FileText className="h-4 w-4 mr-1.5 text-blue-600" /> {report.fileName}
                    </div>
                </div>

                {sessions && sessions.length > 1 && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                        <span className="text-sm font-medium text-gray-500 flex items-center">
                            <History className="h-4 w-4 mr-1.5" /> View Attempt History:
                        </span>
                        <select
                            className="text-sm border-gray-300 rounded-md shadow-sm bg-white p-2 w-full sm:w-56 focus:ring-blue-500 focus:border-blue-500"
                            value={selectedSessionId || ''}
                            onChange={(e) => setSelectedSessionId(e.target.value)}
                        >
                            {sessions.map((s, idx) => (
                                <option key={s.sessionId} value={s.sessionId}>
                                    Attempt {sessions.length - idx} ({new Date(s.completedAt).toLocaleDateString()}) - {Math.round(s.overallScore || 0)}%
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Main Score Profile */}
            <Card className="overflow-hidden border-2">
                <div className="h-2 bg-primary" />
                <CardContent className="p-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="text-center md:text-left space-y-2">
                            <h1 className="text-4xl font-extrabold tracking-tight">Truth Score Profile</h1>
                            <p className="text-xl text-muted-foreground max-w-md">
                                This profile represents the verified authenticity of skills claimed in your resume.
                                {sessions && sessions.length > 1 && (
                                    <span className="block mt-1 text-sm text-blue-600 font-medium">
                                        Viewing results for attempt on {selectedSession ? new Date(selectedSession.completedAt).toLocaleDateString() : ''}
                                    </span>
                                )}
                            </p>
                            <div className={`text-lg font-bold mt-4 ${getTierColor(activeScore)}`}>
                                Tier: {getTierLabel(activeScore)}
                            </div>
                        </div>

                        <div className="relative h-48 w-48 flex items-center justify-center">
                            <svg className="h-full w-full transform -rotate-90">
                                <circle
                                    cx="96"
                                    cy="96"
                                    r="88"
                                    stroke="currentColor"
                                    strokeWidth="12"
                                    fill="transparent"
                                    className="text-secondary"
                                />
                                <circle
                                    cx="96"
                                    cy="96"
                                    r="88"
                                    stroke="currentColor"
                                    strokeWidth="12"
                                    fill="transparent"
                                    strokeDasharray={552.92}
                                    strokeDashoffset={552.92 - (552.92 * activeScore) / 100}
                                    strokeLinecap="round"
                                    className={getTierColor(activeScore)}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-5xl font-black">{Math.round(activeScore)}</span>
                                <span className="text-sm font-medium text-muted-foreground">OUT OF 100</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Skill Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <BarChart3 className="h-5 w-5 mr-2 text-primary" />
                            Skill Breakdown
                        </CardTitle>
                        <CardDescription>Performance across individual technical competencies.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {selectedSession?.skillScores.map((skill: SkillScore, index: number) => (
                            <div key={index} className="space-y-2">
                                <div className="flex justify-between text-sm font-medium">
                                    <span>{skill.skillName}</span>
                                    <span>{Math.round(skill.truthScore)}%</span>
                                </div>
                                <div className="w-full bg-secondary rounded-full h-2">
                                    <div
                                        className="bg-primary h-2 rounded-full"
                                        style={{ width: `${skill.truthScore}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-[10px] text-muted-foreground px-1">
                                    <span>MCQ: {Math.round(skill.mcqScore)}%</span>
                                    <span>Concept: {Math.round(skill.subjectiveScore)}%</span>
                                </div>
                            </div>
                        ))}
                        {!selectedSession && (
                            <div className="text-center py-8 text-muted-foreground">
                                No assessment data available for this resume yet.
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
                            Verification Insights
                        </CardTitle>
                        <CardDescription>Key takeaways from this assessment session.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-start space-x-3 p-3 rounded-lg bg-green-50 border border-green-100">
                            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-bold text-green-900">Strengths Detected</h4>
                                <p className="text-xs text-green-800">
                                    Your theoretical understanding in core areas matches your experience claims.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
                            <HelpCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-bold text-blue-900">Consistency Note</h4>
                                <p className="text-xs text-blue-800">
                                    Multiple choice performance aligns with subjective responses.
                                </p>
                            </div>
                        </div>

                        {activeScore < 40 && (
                            <div className="flex items-start space-x-3 p-3 rounded-lg bg-red-50 border border-red-100">
                                <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-bold text-red-900">Action Required</h4>
                                    <p className="text-xs text-red-800">
                                        Consider reviewing foundational concepts to improve your Truth Score.
                                    </p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
