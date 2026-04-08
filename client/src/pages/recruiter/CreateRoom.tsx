import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Users, Rocket, Clock, Calendar, ShieldAlert, Settings2, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '@/api/axios.instance';

export function CreateRoomPage() {
    const navigate = useNavigate();
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [roomName, setRoomName] = useState('');
    
    // Advanced Settings State
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [startTime, setStartTime] = useState('');
    const [deadline, setDeadline] = useState('');
    const [durationLimit, setDurationLimit] = useState<number>(60);
    const [strictProctoring, setStrictProctoring] = useState(false);

    const { data: shortlisted, isLoading } = useQuery({
        queryKey: ['shortlisted-candidates'],
        queryFn: async () => {
            const res = await api.get('/recruiter/shortlist');
            return res.data;
        }
    });

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await api.post('/room', data);
            return res.data;
        },
        onSuccess: (room: any) => {
            navigate(`/recruiter/rooms/${room.id}`);
        }
    });

    if (isLoading) return <div className="p-8 text-center text-gray-500">Loading shortlisted candidates...</div>;

    const toggleUser = (userId: string) => {
        setSelectedUsers((prev: string[]) =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-[#333333]">Create Assessment Room</h1>
                    <p className="text-gray-500 mt-2">Invite your shortlisted candidates to a live challenge.</p>
                </div>
            </div>

            <Card className="rounded-[40px] border-none shadow-xl overflow-hidden bg-white">
                <CardHeader className="bg-gradient-to-br from-[#F28C5F] to-[#d66c3e] p-8 text-white">
                    <CardTitle className="text-2xl font-bold flex items-center gap-3">
                        <Users className="w-8 h-8" />
                        Configure Room
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                    <div className="space-y-4">
                        <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Room Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Senior Frontend Spring Batch"
                            value={roomName}
                            onChange={(e) => setRoomName(e.target.value)}
                            className="w-full p-6 bg-[#DEDDD6]/30 border-none rounded-3xl text-xl font-medium focus:ring-4 focus:ring-[#F28C5F]/20 transition-all outline-none"
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Select Candidates ({selectedUsers.length})</label>
                            <Button variant="link" onClick={() => setSelectedUsers(shortlisted?.map((s: any) => s.candidate.id) || [])} className="text-[#F28C5F] font-bold">Select All</Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {shortlisted?.map((item: any) => (
                                <div
                                    key={item.id}
                                    onClick={() => toggleUser(item.candidate.id)}
                                    className={`p-6 rounded-[30px] border-2 transition-all cursor-pointer flex items-center gap-4 ${selectedUsers.includes(item.candidate.id)
                                            ? 'border-[#F28C5F] bg-[#F28C5F]/5 shadow-inner'
                                            : 'border-gray-100 bg-white hover:border-[#F28C5F]/30'
                                        }`}
                                >
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl ${selectedUsers.includes(item.candidate.id) ? 'bg-[#F28C5F] text-white' : 'bg-gray-100 text-gray-400'
                                        }`}>
                                        {item.candidate.name[0]}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-gray-900">{item.candidate.name}</p>
                                        <p className="text-xs text-gray-500">{item.candidate.email}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Advanced Settings Toggle */}
                    <div className="border-t border-gray-100 pt-6">
                        <button 
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#F28C5F] transition-colors outline-none"
                        >
                            <Settings2 className="w-5 h-5" /> 
                            {showAdvanced ? 'Hide Advanced Integrity & Scheduling' : 'Show Advanced Integrity & Scheduling'}
                            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>

                        {showAdvanced && (
                            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="space-y-3 bg-[#DEDDD6]/10 p-5 rounded-[24px]">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                      <Calendar className="w-4 h-4" /> Start Time (Optional)
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        className="w-full p-4 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#F28C5F]/20 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-3 bg-[#DEDDD6]/10 p-5 rounded-[24px]">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                      <Calendar className="w-4 h-4 text-red-400" /> Deadline Cutoff (Optional)
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={deadline}
                                        onChange={(e) => setDeadline(e.target.value)}
                                        className="w-full p-4 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-red-400/20 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-3 bg-[#DEDDD6]/10 p-5 rounded-[24px]">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                      <Clock className="w-4 h-4" /> Time Limit (Minutes)
                                    </label>
                                    <input
                                        type="number"
                                        min="5" max="180"
                                        value={durationLimit}
                                        onChange={(e) => setDurationLimit(parseInt(e.target.value))}
                                        className="w-full p-4 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#F28C5F]/20 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-3 bg-[#DEDDD6]/10 p-5 rounded-[24px] flex flex-col justify-center">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                      <ShieldAlert className="w-4 h-4 text-indigo-500" /> Strict Proctoring Mode
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer mt-2">
                                        <div className={`relative w-12 h-6 transition-colors rounded-full ${strictProctoring ? 'bg-indigo-500' : 'bg-gray-300'}`}>
                                            <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${strictProctoring ? 'translate-x-6' : 'translate-x-0'}`} />
                                        </div>
                                        <span className="text-sm font-bold text-gray-600">
                                            {strictProctoring ? 'Enabled (Aggressive monitoring)' : 'Standard Monitoring'}
                                        </span>
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>

                    <Button
                        disabled={!roomName || selectedUsers.length === 0 || createMutation.isPending}
                        onClick={() => createMutation.mutate({ 
                            name: roomName, 
                            candidateIds: selectedUsers,
                            ...(startTime ? { startTime: new Date(startTime).toISOString() } : {}),
                            ...(deadline ? { deadline: new Date(deadline).toISOString() } : {}),
                            durationLimit,
                            strictProctoring
                        })}
                        className="w-full p-10 bg-[#333333] hover:bg-black text-white rounded-[32px] text-2xl font-black shadow-2xl transition-all disabled:opacity-50 mt-6"
                    >
                        {createMutation.isPending ? 'Launching...' : 'Initialize Live Room'}
                        <Rocket className="ml-4 w-8 h-8" />
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
