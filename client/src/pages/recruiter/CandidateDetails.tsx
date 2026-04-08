import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recruiterApi } from '@/api/recruiter.api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Star, Download, ShieldCheck, Mail, MapPin, Briefcase, Printer, Camera, AlertTriangle } from 'lucide-react';

export default function CandidateDetailsPage() {
    const { id } = useParams<{ id: string }>();

    const queryClient = useQueryClient();

    const { data: candidate, isLoading } = useQuery({
        queryKey: ['candidate', id],
        queryFn: () => recruiterApi.getCandidateDetails(id!)
    });

    const [notes, setNotes] = useState('');

    const shortlistMutation = useMutation({
        mutationFn: () => recruiterApi.addToShortlist(id!, notes),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shortlisted-candidates'] });
            alert('Candidate added to shortlist!');
        },
        onError: (err: any) => {
            alert(err.response?.data?.message || 'Failed to shortlist candidate');
        }
    });

    if (isLoading) {
        return (
            <div className="animate-pulse space-y-6">
                <div className="h-8 w-48 bg-gray-200 rounded" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 h-96 bg-gray-100 rounded-lg" />
                    <div className="h-96 bg-gray-100 rounded-lg" />
                </div>
            </div>
        );
    }

    if (!candidate) return <div>Candidate not found.</div>;

    return (
        <>
            <div className="space-y-6 print:hidden">
            <div className="flex items-center justify-between">
                <Link to="/recruiter/candidates">
                    <Button variant="ghost" className="flex items-center gap-2">
                        <ArrowLeft size={18} />
                        Back to Pool
                    </Button>
                </Link>
                <div className="flex gap-2 print:hidden">
                    <Button variant="outline" className="flex items-center gap-2" onClick={() => window.print()}>
                        <Printer size={18} />
                        Print Integrity Report
                    </Button>
                    <Button 
                        variant="outline" 
                        className="flex items-center gap-2"
                        onClick={() => shortlistMutation.mutate()}
                        disabled={shortlistMutation.isPending}
                    >
                        <Star size={18} className={shortlistMutation.isPending ? "animate-spin" : ""} />
                        {shortlistMutation.isPending ? "Shortlisting..." : "Shortlist"}
                    </Button>
                    <Button className="flex items-center gap-2">
                        <Mail size={18} />
                        Contact
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-start gap-6">
                                <div className="h-24 w-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-3xl font-bold">
                                    {candidate.name.charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <h1 className="text-3xl font-bold text-gray-900">{candidate.name}</h1>
                                    <p className="text-gray-600 mt-1">{candidate.email}</p>

                                    <div className="flex flex-wrap gap-4 mt-6">
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <Briefcase size={16} />
                                            Software Engineer
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <MapPin size={16} />
                                            Remote
                                        </div>
                                    </div>
                                </div>
                                {candidate.resume?.truthScore && (
                                    <div className="text-center p-4 bg-green-50 rounded-xl border border-green-100">
                                        <div className="text-3xl font-bold text-green-700">{candidate.resume.truthScore.authenticityScore}%</div>
                                        <div className="text-xs font-semibold text-green-600 uppercase tracking-wider mt-1">Truth Score</div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShieldCheck className="text-blue-600" />
                                Verified Skills
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {candidate.resume?.skills.map((skill) => {
                                    const score = candidate.resume?.lastAssessment?.skillScores?.find(
                                        (ss: any) => ss.skill.name === skill.name
                                    );

                                    return (
                                        <div key={skill.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                                            <div>
                                                <h4 className="font-semibold text-gray-900">{skill.name}</h4>
                                                <p className="text-sm text-gray-500">{skill.category} • {skill.claimedLevel} • {skill.yearsExperience} years</p>
                                            </div>
                                            {score ? (
                                                <div className="text-right">
                                                    <div className="text-lg font-bold text-blue-700">{score.truthScore}% Verified</div>
                                                    <div className="w-24 h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
                                                        <div
                                                            className="h-full bg-blue-600 rounded-full"
                                                            style={{ width: `${score.truthScore}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-sm text-gray-400 font-medium">Not yet assessed</div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Documents</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {candidate.resume ? (
                                <div className="p-3 border border-gray-200 rounded-lg flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-red-50 text-red-600 rounded">
                                            <Download size={20} />
                                        </div>
                                        <div className="text-sm">
                                            <div className="font-medium text-gray-900 truncate max-w-[150px]">{candidate.resume.fileName}</div>
                                            <div className="text-gray-500">Resume PDF</div>
                                        </div>
                                    </div>
                                    <a href={`/api/recruiter/candidates/${id}/resume/download`} target="_blank" rel="noreferrer" download>
                                        <Button variant="ghost" size="sm">Download</Button>
                                    </a>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">No resume uploaded.</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Recruiter Notes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add private notes about this candidate..."
                                className="w-full h-32 p-3 border border-[hsl(var(--border))] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(252,83%,55%)] bg-transparent"
                            />
                            <Button className="w-full mt-4" onClick={() => shortlistMutation.mutate()} disabled={shortlistMutation.isPending}>
                                {shortlistMutation.isPending ? "Saving..." : "Save Notes"}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
            </div>

            {/* --- PDF Integrity Report (Print Only) --- */}
            {candidate?.resume?.lastAssessment && (
                <div className="hidden print:block bg-white text-black">
                    {/* Header */}
                    <div className="border-b-4 border-blue-900 pb-6 mb-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-4xl font-extrabold text-blue-900 tracking-tight">SEAL OF TRUTH</h1>
                                <p className="text-lg text-gray-600 font-semibold mt-1">Official Candidate Integrity Report</p>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-gray-500 uppercase font-bold tracking-widest">Assessment ID</div>
                                <div className="font-mono text-xs text-gray-400 mt-1">{candidate?.resume?.lastAssessment?.id}</div>
                            </div>
                        </div>
                    </div>

                    {/* Candidate Info */}
                    <div className="grid grid-cols-2 gap-8 mb-10">
                        <div>
                            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Candidate Information</h2>
                            <p className="text-2xl font-bold">{candidate?.name}</p>
                            <p className="text-gray-600">{candidate?.email}</p>
                            <p className="text-gray-600 mt-2 font-medium">{candidate?.resume?.fileName}</p>
                        </div>
                        <div className="flex justify-end pr-8">
                            <div className="text-center p-6 border-4 border-green-600 rounded-2xl bg-green-50 shadow-sm relative">
                                <div className="absolute -top-4 -right-4 bg-white rounded-full p-1">
                                    <ShieldCheck className="text-green-600 w-10 h-10" />
                                </div>
                                <p className="text-xs uppercase font-bold tracking-widest text-green-700 mb-2">Verified Truth Score</p>
                                <p className="text-6xl font-black text-green-700">{candidate?.resume?.truthScore?.authenticityScore}%</p>
                            </div>
                        </div>
                    </div>

                    {/* Security Logs */}
                    <div className="mb-10 break-inside-avoid">
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest border-b pb-2 mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" /> Integrity & Security Logs
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                                <p className="text-xs font-bold text-gray-500 uppercase">Tab Switch Violations</p>
                                <p className={`text-2xl font-black mt-1 ${candidate?.resume?.lastAssessment?.tabSwitchCount && candidate.resume.lastAssessment.tabSwitchCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {candidate?.resume?.lastAssessment?.tabSwitchCount || 0}
                                </p>
                            </div>
                            <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                                <p className="text-xs font-bold text-gray-500 uppercase">Total Warnings Issued</p>
                                <p className={`text-2xl font-black mt-1 ${candidate?.resume?.lastAssessment?.violationCount && candidate.resume.lastAssessment.violationCount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                    {candidate?.resume?.lastAssessment?.violationCount || 0}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Snapshot Gallery */}
                    <div className="break-inside-avoid">
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest border-b pb-2 mb-6 flex items-center gap-2">
                            <Camera className="w-4 h-4" /> Identity Verification Snapshots
                        </h2>
                        {candidate?.resume?.lastAssessment?.snapshots && candidate.resume.lastAssessment.snapshots.length > 0 ? (
                            <div className="grid grid-cols-4 gap-4">
                                {candidate.resume.lastAssessment.snapshots.map((snap) => (
                                    <div key={snap.id} className="border border-[hsl(var(--border))] rounded-lg p-2 bg-white break-inside-avoid shadow-sm" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                                        <img 
                                            src={snap.imageUrl} 
                                            alt="Candidate verification snippet" 
                                            className="w-full h-auto rounded object-cover" 
                                            loading="eager"
                                            style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
                                        />
                                        <p className="text-[10px] text-center text-[hsl(var(--muted-foreground))] mt-2 font-mono">
                                            {new Date(snap.capturedAt).toLocaleTimeString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                                No webcam snapshots were captured during this session.
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="absolute bottom-8 left-8 right-8 text-center text-xs text-gray-400 border-t pt-4">
                        Generated by TruthFinder AI • Document ID: {Math.random().toString(36).substring(2, 10).toUpperCase()} • Strictly Confidential
                    </div>
                </div>
            )}
        </>
    );
}
