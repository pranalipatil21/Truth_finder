import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { resumeApi, Resume } from '@/api/resume.api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Upload, FileText, CheckCircle, Clock, AlertCircle, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

function ParsingProgress({ createdAt }: { createdAt: string }) {
    const [progress, setProgress] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);
    const ESTIMATED_TOTAL_SECONDS = 30;

    useEffect(() => {
        const calculateProgress = () => {
            const start = new Date(createdAt).getTime();
            const now = new Date().getTime();
            const elapsed = Math.floor((now - start) / 1000);

            const newProgress = Math.min((elapsed / ESTIMATED_TOTAL_SECONDS) * 100, 95);
            const newTimeLeft = Math.max(ESTIMATED_TOTAL_SECONDS - elapsed, 1);

            setProgress(newProgress);
            setTimeLeft(newTimeLeft);
        };

        calculateProgress();
        const timer = setInterval(calculateProgress, 1000);
        return () => clearInterval(timer);
    }, [createdAt]);

    return (
        <div className="w-full mt-2">
            <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                <span>Estimated time remaining: {timeLeft}s</span>
                <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div
                    className="bg-blue-600 h-full transition-all duration-1000 ease-linear rounded-full"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}

export function UploadResumePage() {
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string>('');
    const queryClient = useQueryClient();

    const { data: resumes, isLoading } = useQuery({
        queryKey: ['resumes'],
        queryFn: resumeApi.getAll,
        refetchInterval: (query) => {
            const hasParsing = query.state.data?.some(r => r.status === 'PARSING' || r.status === 'UPLOADED');
            return hasParsing ? 3000 : false;
        }
    });

    const uploadMutation = useMutation({
        mutationFn: resumeApi.upload,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['resumes'] });
            setFile(null);
            setError('');
        },
        onError: (err: any) => {
            setError(err.response?.data?.error || 'Failed to upload resume');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: resumeApi.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['resumes'] });
        },
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (!selected) return;

        // Validate type
        const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!validTypes.includes(selected.type)) {
            setError('Only PDF and DOCX files are allowed');
            setFile(null);
            return;
        }

        // Validate size (10MB max)
        if (selected.size > 10 * 1024 * 1024) {
            setError('File size must be less than 10MB');
            setFile(null);
            return;
        }

        setFile(selected);
        setError('');
    };

    const handleUpload = () => {
        if (!file) return;
        uploadMutation.mutate(file);
    };

    const getStatusBadge = (status: Resume['status']) => {
        switch (status) {
            case 'UPLOADED':
            case 'PARSING':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <Clock className="w-3 h-3 mr-1" /> Processing...
                    </span>
                );
            case 'PARSED':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" /> Parsed
                    </span>
                );
            case 'FAILED':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <AlertCircle className="w-3 h-3 mr-1" /> Failed
                    </span>
                );
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Resume Upload & Parsing</h1>
                <p className="mt-2 text-gray-600">
                    Upload your resume to extract skills and enable skill assessments.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="col-span-1 md:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle>Upload New Resume</CardTitle>
                        <CardDescription>Supported formats: PDF, DOCX (Max 10MB)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-center">
                                <Upload className="h-10 w-10 text-gray-400 mb-3" />
                                <label className="cursor-pointer">
                                    <span className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-500">
                                        Browse files
                                    </span>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                        onChange={handleFileChange}
                                    />
                                </label>
                                <p className="text-xs text-gray-500 mt-1">or drag and drop</p>
                            </div>

                            {file && (
                                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-md">
                                    <div className="flex items-center truncate">
                                        <FileText className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0" />
                                        <span className="text-sm font-medium text-gray-900 truncate">
                                            {file.name}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => setFile(null)}
                                        className="text-gray-400 hover:text-red-500 flex-shrink-0 ml-2"
                                    >
                                        ×
                                    </button>
                                </div>
                            )}

                            {error && (
                                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                                    {error}
                                </div>
                            )}

                            <Button
                                className="w-full"
                                disabled={!file || uploadMutation.isPending}
                                onClick={handleUpload}
                            >
                                {uploadMutation.isPending ? 'Uploading...' : 'Upload & Parse'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-1 md:col-span-2">
                    <CardHeader>
                        <CardTitle>My Resumes</CardTitle>
                        <CardDescription>Manage your uploaded resumes and extracted skills</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="text-center py-8 text-gray-500">Loading resumes...</div>
                        ) : resumes && resumes.length > 0 ? (
                            <div className="space-y-4">
                                {resumes.map((resume) => (
                                    <div
                                        key={resume.id}
                                        className="flex flex-col items-stretch p-4 border rounded-lg hover:border-blue-300 transition-colors bg-white shadow-sm"
                                    >
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                            <div className="flex items-start">
                                                <FileText className="h-8 w-8 text-gray-400 mr-3 mt-1" />
                                                <div>
                                                    <h4 className="text-sm font-medium text-gray-900 truncate max-w-[200px] sm:max-w-xs">{resume.fileName}</h4>
                                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                                        {getStatusBadge(resume.status)}
                                                        <span className="text-xs text-gray-500">
                                                            Uploaded {new Date(resume.createdAt).toLocaleDateString()}
                                                        </span>
                                                        {resume._count && resume._count.resumeSkills > 0 && (
                                                            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                                                                {resume._count.resumeSkills} Skills Extracted
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                                {resume.status === 'PARSED' && (
                                                    <Link to={`/candidate/assessments?resumeId=${resume.id}`} className="flex-1 sm:flex-none">
                                                        <Button variant="outline" size="sm" className="w-full">
                                                            Take Assessment
                                                        </Button>
                                                    </Link>
                                                )}
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 ml-auto"
                                                    onClick={() => deleteMutation.mutate(resume.id)}
                                                    disabled={deleteMutation.isPending && deleteMutation.variables === resume.id}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        {(resume.status === 'UPLOADED' || resume.status === 'PARSING') && (
                                            <ParsingProgress createdAt={resume.createdAt} />
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No resumes</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Upload a resume to get started
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
