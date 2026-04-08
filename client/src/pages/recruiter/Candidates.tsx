import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { recruiterApi } from '@/api/recruiter.api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Search, Filter, Star, User } from 'lucide-react';

export default function CandidatesPage() {
    const [query, setQuery] = useState('');

    const { data: candidates, isLoading } = useQuery({
        queryKey: ['candidates', query],
        queryFn: () => recruiterApi.getCandidates(query)
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Candidate Pool</h1>
                    <p className="mt-1 text-gray-600">Browse and filter verified talent based on Truth Scores.</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>
                <Button variant="outline" className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    More Filters
                </Button>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-lg" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {candidates?.map((candidate) => (
                        <Card key={candidate.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between">
                                    <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                        <User size={24} />
                                    </div>
                                    {candidate.truthScore && (
                                        <div className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-sm font-semibold">
                                            {candidate.truthScore}% Truth
                                        </div>
                                    )}
                                </div>
                                <CardTitle className="mt-4">{candidate.name}</CardTitle>
                                <CardDescription>{candidate.email}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2 mb-6">
                                    {candidate.skills.map((skill) => (
                                        <span
                                            key={skill}
                                            className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                                        >
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <Link to={`/recruiter/candidates/${candidate.id}`} className="flex-1">
                                        <Button variant="outline" className="w-full">View Profile</Button>
                                    </Link>
                                    <Button variant="ghost" size="icon" className="text-yellow-600">
                                        <Star size={18} />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {candidates?.length === 0 && (
                        <div className="col-span-full py-12 text-center bg-gray-50 rounded-lg">
                            <p className="text-gray-500">No candidates found matching your criteria.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
