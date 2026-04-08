import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { recruiterApi } from '@/api/recruiter.api';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Trash2, User, ExternalLink } from 'lucide-react';

export default function ShortlistPage() {
    const queryClient = useQueryClient();

    const { data: shortlist, isLoading } = useQuery({
        queryKey: ['shortlist'],
        queryFn: () => recruiterApi.getShortlist()
    });

    const removeMutation = useMutation({
        mutationFn: (id: string) => recruiterApi.removeFromShortlist(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shortlist'] });
        }
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Your Shortlist</h1>
                <p className="mt-1 text-gray-600">Candidates you've saved for potential hiring.</p>
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2].map(i => (
                        <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-lg" />
                    ))}
                </div>
            ) : (
                <div className="space-y-4">
                    {shortlist?.map((item: any) => (
                        <Card key={item.id}>
                            <CardContent className="py-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                                            <User size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-gray-900">{item.candidate.name}</h3>
                                            <p className="text-gray-500 leading-none">{item.candidate.email}</p>
                                            {item.notes && (
                                                <p className="mt-2 text-sm text-blue-600 italic">"{item.notes}"</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        {item.candidate.truthScore && (
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-green-600">{item.candidate.truthScore}%</div>
                                                <div className="text-[10px] uppercase font-bold text-gray-400">Truth Score</div>
                                            </div>
                                        )}
                                        <div className="flex gap-2">
                                            <Link to={`/recruiter/candidates/${item.candidate.id}`}>
                                                <Button variant="outline" size="sm" className="flex items-center gap-2">
                                                    <ExternalLink size={16} />
                                                    Details
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => removeMutation.mutate(item.candidate.id)}
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {shortlist?.length === 0 && (
                        <div className="py-12 text-center bg-gray-50 rounded-lg">
                            <p className="text-gray-500">Your shortlist is currently empty.</p>
                            <Link to="/recruiter/candidates">
                                <Button variant="link" className="mt-2">Browse the candidate pool</Button>
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
