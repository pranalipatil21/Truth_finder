
import { useQuery } from '@tanstack/react-query';
import { scoringApi } from '@/api/scoring.api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
    Trophy,
    Target,
    ShieldCheck,
    FileText,
    ChevronRight,
    ArrowLeft,
    AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ReportsPage() {
    const navigate = useNavigate();
    const { data: overview, isLoading, error } = useQuery({
        queryKey: ['candidate-overview'],
        queryFn: () => scoringApi.getCandidateOverview(),
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
                <h3 className="text-lg font-semibold">Error loading reports</h3>
                <p className="text-muted-foreground mb-4">Please try again later.</p>
                <Button onClick={() => navigate('/candidate')}>Go Back</Button>
            </div>
        );
    }

    const getTierColor = (score: number) => {
        if (score >= 85) return 'bg-green-100 text-green-800 border-green-200';
        if (score >= 65) return 'bg-blue-100 text-blue-800 border-blue-200';
        if (score >= 40) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        return 'bg-red-100 text-red-800 border-red-200';
    };

    const getTierLabel = (score: number) => {
        if (score >= 85) return 'Highly Authentic';
        if (score >= 65) return 'Mostly Accurate';
        if (score >= 40) return 'Partially Verified';
        if (score === 0) return 'Not Yet Verified';
        return 'Significant Discrepancies';
    };

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Your Reports</h1>
                    <p className="text-muted-foreground">Detailed breakdown of your authenticity scores and assessments.</p>
                </div>
                <Button variant="outline" onClick={() => navigate('/candidate')}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                </Button>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-primary/10 rounded-full">
                                <FileText className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Resumes</p>
                                <h3 className="text-2xl font-bold">{overview?.totalResumes || 0}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-green-100 rounded-full">
                                <Target className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Assessments Taken</p>
                                <h3 className="text-2xl font-bold">{overview?.completedAssessments || 0}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-blue-100 rounded-full">
                                <ShieldCheck className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Avg. Truth Score</p>
                                <h3 className="text-2xl font-bold">{overview?.averageAuthenticityScore || 0}%</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <h2 className="text-xl font-semibold mt-8 mb-4">Resume Breakdowns</h2>
            <div className="grid grid-cols-1 gap-4">
                {overview?.resumes.map((resume: any) => (
                    <Card key={resume.id} className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => navigate(`/candidate/reports/${resume.id}`)}>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <FileText className="h-5 w-5 text-muted-foreground" />
                                    <CardTitle className="text-lg">{resume.fileName}</CardTitle>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Badge className={getTierColor(resume.score)} variant="outline">
                                        {getTierLabel(resume.score)}
                                    </Badge>
                                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between text-sm">
                                <div className="text-muted-foreground">
                                    Status: <span className="capitalize">{resume.status.toLowerCase()}</span>
                                </div>
                                <div className="flex items-center font-semibold">
                                    <Trophy className="h-4 w-4 mr-1 text-yellow-500" />
                                    Truth Score: {resume.score}%
                                </div>
                            </div>
                            <div className="mt-3 w-full bg-secondary rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full ${resume.score >= 70 ? 'bg-green-500' : resume.score >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                    style={{ width: `${resume.score}%` }}
                                />
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {overview?.resumes.length === 0 && (
                    <Card className="border-dashed">
                        <CardContent className="py-10 text-center">
                            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium">No resumes uploaded yet</h3>
                            <p className="text-muted-foreground mb-4">Upload your resume to start the verification process.</p>
                            <Button onClick={() => navigate('/candidate/upload')}>Upload Now</Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
