import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Trophy, Target, ArrowLeft, Upload, Loader2, CheckCircle2, Download } from 'lucide-react';
import api from '@/api/axios.instance';
import { useRef, useState } from 'react';

export function RoomDashboardPage() {
    const { id } = useParams();
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success'>('idle');

    const { data: leaderboard, isLoading } = useQuery({
        queryKey: ['room-leaderboard', id],
        queryFn: async () => {
            const res = await api.get(`/room/${id}/leaderboard`);
            return res.data;
        },
        refetchInterval: 5000 // Refresh ogni 5 secondi
    });

    const uploadMutation = useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append('file', file);
            const res = await api.post(`/recruiter/rooms/${id}/questions/csv`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return res.data;
        },
        onSuccess: (data) => {
            setUploadStatus('success');
            setTimeout(() => setUploadStatus('idle'), 3000);
            queryClient.invalidateQueries({ queryKey: ['room-leaderboard', id] });
            
            let alertMsg = data.message || 'Questions uploaded securely';
            if (data.failedRows && data.failedRows.length > 0) {
                alertMsg += `\n\nErrors:\n${data.failedRows.slice(0, 10).join('\n')}`;
                if (data.failedRows.length > 10) alertMsg += `\n...and ${data.failedRows.length - 10} more.`;
            }
            alert(alertMsg);
        },
        onError: (err: any) => {
            setUploadStatus('idle');
            alert(err.response?.data?.message || 'Failed to upload CSV. Please check the file format.');
        }
    });

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadStatus('uploading');
        uploadMutation.mutate(file);
        if (fileInputRef.current) fileInputRef.current.value = ''; // reset input
    };

    const triggerFileSelect = () => {
        if (uploadStatus !== 'uploading') fileInputRef.current?.click();
    };

    if (isLoading) return <div className="p-8 text-center">Loading live results...</div>;

    return (
        <div className="max-w-6xl mx-auto space-y-8 p-4">
            <Link to="/recruiter/dashboard" className="flex items-center gap-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors font-bold uppercase tracking-widest text-xs">
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
            </Link>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <Badge className="bg-[hsl(252,83%,55%)] text-white mb-2 py-1 px-4 rounded-full text-xs font-black uppercase tracking-widest shadow-sm">Live Room Dashboard</Badge>
                    <h1 className="text-4xl md:text-5xl font-black text-[hsl(var(--foreground))] tracking-tight">Candidate Rankings</h1>
                </div>
                <div className="flex items-center gap-4">
                    {/* CSV Template Download */}
                    <a 
                        href="/api/recruiter/questions/csv/template"
                        download
                        className="flex items-center gap-2 px-6 py-4 rounded-2xl font-bold transition-all shadow-sm bg-white text-[hsl(var(--foreground))] border-2 border-[hsl(var(--border))] hover:border-[hsl(252,83%,60%/0.4)] md:text-base text-sm hover:shadow-md"
                    >
                        <Download className="w-5 h-5 text-gray-500" /> Template
                    </a>

                    {/* CSV Upload Button */}
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        accept=".csv" 
                        className="hidden" 
                    />
                    <button 
                        onClick={triggerFileSelect}
                        disabled={uploadStatus === 'uploading'}
                        className={`flex items-center gap-2 px-6 py-4 rounded-2xl font-bold transition-all shadow-sm
                            ${uploadStatus === 'success' 
                                ? 'bg-green-100 text-green-700 border-2 border-green-200' 
                                : 'bg-white text-[hsl(var(--foreground))] border-2 border-[hsl(var(--border))] hover:border-[hsl(252,83%,60%/0.4)] hover:shadow-md'
                            }`}
                    >
                        {uploadStatus === 'uploading' ? (
                            <><Loader2 className="w-5 h-5 animate-spin text-[hsl(252,83%,55%)]" /> Uploading...</>
                        ) : uploadStatus === 'success' ? (
                            <><CheckCircle2 className="w-5 h-5" /> Added to QB</>
                        ) : (
                            <><Upload className="w-5 h-5 text-[hsl(252,83%,55%)]" /> Import CSV</>
                        )}
                    </button>

                    <div className="bg-white p-4 px-6 rounded-2xl border-2 border-[hsl(var(--border))] text-center shadow-sm">
                        <p className="text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1">Total Invited</p>
                        <p className="text-3xl font-black text-[hsl(252,83%,55%)] leading-none">{leaderboard?.length || 0}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {leaderboard?.map((entry: any, index: number) => (
                    <Card key={entry.userId} className={`rounded-[40px] border-none shadow-xl transition-all hover:scale-[1.01] ${index === 0 ? 'ring-4 ring-[#F28C5F]/20' : ''}`}>
                        <CardContent className="p-8 flex flex-col md:flex-row items-center gap-8">
                            <div className="flex items-center gap-6 flex-1">
                                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center font-black text-2xl ${index === 0 ? 'bg-yellow-400 text-white' :
                                    index === 1 ? 'bg-gray-300 text-white' :
                                        index === 2 ? 'bg-orange-400 text-white' :
                                            'bg-gray-100 text-gray-400'
                                    }`}>
                                    {index + 1}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-[#333333]">{entry.name}</h3>
                                    <div className="flex items-center gap-3 mt-1">
                                        <Badge variant="outline" className={`rounded-full px-4 py-0.5 text-[10px] font-black uppercase ${entry.status === 'COMPLETED' ? 'border-green-500 text-green-500' :
                                            entry.status === 'IN_PROGRESS' ? 'border-blue-500 text-blue-500 animate-pulse' :
                                                'border-gray-300 text-gray-400'
                                            }`}>
                                            {entry.status.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-12">
                                <div className="text-center">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center justify-center gap-1">
                                        <Target className="w-3 h-3" /> Progress
                                    </p>
                                    <div className="w-32 h-3 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[#F28C5F] transition-all duration-1000"
                                            style={{ width: `${entry.progress}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="bg-[#DEDDD6]/50 p-6 rounded-[30px] min-w-[140px] text-center">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
                                        <Trophy className="w-3 h-3" /> Truth Score
                                    </p>
                                    <p className="text-4xl font-black text-[#333333]">
                                        {entry.truthScore !== null ? entry.truthScore.toFixed(0) : '—'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
