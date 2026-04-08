import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Key, ArrowRight } from 'lucide-react';
import api from '@/api/axios.instance';
import { toast } from 'sonner';

export function JoinRoomPage() {
    const navigate = useNavigate();
    const [code, setCode] = useState('');

    const joinMutation = useMutation({
        mutationFn: async (roomCode: string) => {
            const res = await api.post('/room/join', { roomCode });
            return res.data;
        },
        onSuccess: (data) => {
            toast.success(`Joined room: ${data.roomName}`);
            // Save room context for assessment
            sessionStorage.setItem('room_context', JSON.stringify(data));
            navigate(`/candidate/assessments?resumeId=${data.resumeId}`); // Redirect to assessment selection forcing auto-creation of session
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.error || 'Failed to join room');
        }
    });

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <div className="max-w-md w-full space-y-8 text-center animate-in fade-in zoom-in duration-500">
                <div>
                    <h1 className="text-6xl font-black text-[#333333] mb-4">Enter Room</h1>
                    <p className="text-gray-500 text-lg">Input the distinct 6-digit code provided by your recruiter to begin the verified assessment.</p>
                </div>

                <Card className="rounded-[50px] border-none shadow-2xl overflow-hidden bg-white/80 backdrop-blur-xl">
                    <CardContent className="p-10 space-y-8">
                        <div className="relative group">
                            <Key className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#F28C5F] transition-colors w-8 h-8" />
                            <input
                                type="text"
                                maxLength={6}
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                placeholder="ROOMCODE"
                                className="w-full pl-20 p-10 bg-[#DEDDD6]/30 border-none rounded-[35px] text-4xl font-black tracking-[0.2em] uppercase focus:ring-8 focus:ring-[#F28C5F]/10 outline-none transition-all placeholder:text-gray-200"
                            />
                        </div>

                        <Button
                            disabled={code.length !== 6 || joinMutation.isPending}
                            onClick={() => joinMutation.mutate(code)}
                            className="w-full p-10 bg-[#F28C5F] hover:bg-[#d66c3e] text-white rounded-[35px] text-2xl font-black shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-4"
                        >
                            {joinMutation.isPending ? 'Validating...' : 'Access Room'}
                            <ArrowRight className="w-8 h-8" />
                        </Button>
                    </CardContent>
                </Card>

                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Security Warning: Your session will be monitored and proctored.
                </p>
            </div>
        </div>
    );
}
