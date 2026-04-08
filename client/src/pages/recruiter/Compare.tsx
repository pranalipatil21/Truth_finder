import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { recruiterApi } from '@/api/recruiter.api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ShieldCheck, Users, X, Plus, AlertCircle, ChevronRight, ArrowLeftRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CompareCandidatesPage() {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [search, setSearch] = useState('');

    const { data: candidates, isLoading, error } = useQuery({
        queryKey: ['recruiter-candidates', search],
        queryFn: () => recruiterApi.getCandidates(search || undefined),
    });

    // Fetch details for selected candidates
    const { data: detailA } = useQuery({
        queryKey: ['candidate', selectedIds[0]],
        queryFn: () => recruiterApi.getCandidateDetails(selectedIds[0]),
        enabled: !!selectedIds[0],
    });

    const { data: detailB } = useQuery({
        queryKey: ['candidate', selectedIds[1]],
        queryFn: () => recruiterApi.getCandidateDetails(selectedIds[1]),
        enabled: !!selectedIds[1],
    });

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id)
                ? prev.filter(x => x !== id)
                : prev.length < 2
                    ? [...prev, id]
                    : [prev[1], id] // Replace the first one when 2 already selected
        );
    };

    const getTierColor = (score: number | undefined) => {
        if (!score) return 'gray';
        if (score >= 85) return 'green';
        if (score >= 65) return 'blue';
        if (score >= 40) return 'yellow';
        return 'red';
    };

    const getTierLabel = (score: number | undefined) => {
        if (!score) return 'Not Verified';
        if (score >= 85) return 'Highly Authentic';
        if (score >= 65) return 'Mostly Accurate';
        if (score >= 40) return 'Partially Verified';
        return 'Significant Discrepancies';
    };

    const getScoreBg = (score: number | undefined) => {
        const color = getTierColor(score);
        const map: Record<string, string> = {
            green: 'bg-green-50 text-green-700 border-green-200',
            blue: 'bg-blue-50 text-blue-700 border-blue-200',
            yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
            red: 'bg-red-50 text-red-700 border-red-200',
            gray: 'bg-gray-50 text-gray-600 border-gray-200',
        };
        return map[color];
    };

    const allSkillNames = Array.from(new Set([
        ...(detailA?.resume?.skills?.map((s: any) => s.name) || []),
        ...(detailB?.resume?.skills?.map((s: any) => s.name) || []),
    ]));

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <ArrowLeftRight className="w-8 h-8 text-blue-600" />
                    Compare Candidates
                </h1>
                <p className="text-gray-500 mt-1">Select two candidates to compare their Truth Scores, skills, and verification data side by side.</p>
            </div>

            {/* Candidate Selector */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Users className="w-4 h-4 text-blue-600" />
                        Select up to 2 Candidates
                        {selectedIds.length > 0 && (
                            <span className="ml-auto text-sm font-normal text-gray-400">
                                {selectedIds.length}/2 selected
                            </span>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />

                    {isLoading && <div className="py-6 text-center text-gray-400 text-sm">Loading candidates...</div>}
                    {error && (
                        <div className="py-6 text-center">
                            <AlertCircle className="mx-auto h-8 w-8 text-red-400 mb-2" />
                            <p className="text-red-500 text-sm">Error loading candidates</p>
                        </div>
                    )}

                    <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                        {candidates?.map((c: any) => {
                            const isSelected = selectedIds.includes(c.id);
                            return (
                                <div
                                    key={c.id}
                                    onClick={() => toggleSelect(c.id)}
                                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${isSelected
                                        ? 'border-blue-400 bg-blue-50'
                                        : 'border-gray-100 hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                            {c.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm text-gray-900">{c.name}</p>
                                            <p className="text-xs text-gray-400">{c.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {c.truthScore !== undefined && (
                                            <span className={`text-xs font-bold px-2 py-1 rounded-full border ${getScoreBg(c.truthScore)}`}>
                                                {c.truthScore}%
                                            </span>
                                        )}
                                        {isSelected
                                            ? <X className="w-4 h-4 text-blue-500" />
                                            : <Plus className="w-4 h-4 text-gray-400" />
                                        }
                                    </div>
                                </div>
                            );
                        })}
                        {candidates?.length === 0 && (
                            <div className="py-8 text-center text-sm text-gray-400">No candidates found.</div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Comparison Area */}
            {selectedIds.length < 2 ? (
                <div className="py-16 text-center border-2 border-dashed border-gray-200 rounded-2xl">
                    <ArrowLeftRight className="mx-auto w-12 h-12 text-gray-300 mb-3" />
                    <h3 className="text-lg font-semibold text-gray-500">Select 2 candidates above to compare</h3>
                    <p className="text-gray-400 text-sm mt-1">Click candidates from the list to add them to the comparison.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Score Cards */}
                    <div className="grid grid-cols-2 gap-4">
                        {[detailA, detailB].map((detail: any, i) => (
                            <Card key={i} className={`border-2 ${i === 0 ? 'border-blue-200' : 'border-purple-200'}`}>
                                <CardContent className="pt-5">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-black ${i === 0 ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                            {detail?.name?.charAt(0) || '?'}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-gray-900">{detail?.name || 'Loading...'}</p>
                                            <p className="text-xs text-gray-400">{detail?.email}</p>
                                        </div>
                                        {detail?.resume?.truthScore && (
                                            <div className={`text-center px-4 py-2 rounded-xl border ${getScoreBg(detail.resume.truthScore.authenticityScore)}`}>
                                                <p className="text-2xl font-black">{detail.resume.truthScore.authenticityScore}%</p>
                                                <p className="text-[10px] font-bold uppercase tracking-wide">Truth Score</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className={`mt-3 text-xs font-semibold px-3 py-1 rounded-full inline-block border ${getScoreBg(detail?.resume?.truthScore?.authenticityScore)}`}>
                                        {getTierLabel(detail?.resume?.truthScore?.authenticityScore)}
                                    </div>
                                    <Link to={`/recruiter/candidates/${selectedIds[i]}`}>
                                        <Button variant="outline" size="sm" className="mt-3 w-full rounded-lg text-xs flex items-center gap-1">
                                            Full Profile <ChevronRight className="w-3 h-3" />
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Skill Comparison Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-blue-600" />
                                Skill-by-Skill Truth Score Comparison
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-100">
                                            <th className="text-left py-2 px-3 text-gray-500 font-semibold">Skill</th>
                                            <th className="text-center py-2 px-3 text-blue-600 font-semibold">{detailA?.name?.split(' ')[0] || 'A'}</th>
                                            <th className="text-center py-2 px-3 text-purple-600 font-semibold">{detailB?.name?.split(' ')[0] || 'B'}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {allSkillNames.map(skillName => {
                                            const aSkill = detailA?.resume?.skills?.find((s: any) => s.name === skillName);
                                            const bSkill = detailB?.resume?.skills?.find((s: any) => s.name === skillName);
                                            const aScore = detailA?.resume?.lastAssessment?.skillScores?.find((ss: any) => ss.skill?.name === skillName);
                                            const bScore = detailB?.resume?.lastAssessment?.skillScores?.find((ss: any) => ss.skill?.name === skillName);

                                            return (
                                                <tr key={skillName} className="hover:bg-gray-50 transition-colors">
                                                    <td className="py-2.5 px-3 font-medium text-gray-800">{skillName}</td>
                                                    <td className="py-2.5 px-3 text-center">
                                                        {aSkill ? (
                                                            <div>
                                                                <div className="text-xs text-gray-400">{aSkill.claimedLevel}</div>
                                                                {aScore
                                                                    ? <span className="font-bold text-blue-700">{aScore.truthScore}%</span>
                                                                    : <span className="text-gray-300">–</span>
                                                                }
                                                            </div>
                                                        ) : <span className="text-gray-300">–</span>}
                                                    </td>
                                                    <td className="py-2.5 px-3 text-center">
                                                        {bSkill ? (
                                                            <div>
                                                                <div className="text-xs text-gray-400">{bSkill.claimedLevel}</div>
                                                                {bScore
                                                                    ? <span className="font-bold text-purple-700">{bScore.truthScore}%</span>
                                                                    : <span className="text-gray-300">–</span>
                                                                }
                                                            </div>
                                                        ) : <span className="text-gray-300">–</span>}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {allSkillNames.length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="py-8 text-center text-gray-400 text-sm">
                                                    No assessed skills to compare yet.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
