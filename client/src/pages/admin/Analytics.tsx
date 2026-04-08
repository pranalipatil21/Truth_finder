import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/api/admin.api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
    Users, ShieldCheck, Target, TrendingUp, AlertCircle, BarChart2, Award
} from 'lucide-react';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

const SCORE_COLORS = ['#ef4444', '#f97316', '#3b82f6', '#22c55e'];

export default function AnalyticsPage() {
    const { data: analytics, isLoading, error } = useQuery({
        queryKey: ['admin-analytics'],
        queryFn: () => adminApi.getAnalytics(),
        staleTime: 5 * 60 * 1000,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
        );
    }

    if (error || !analytics) {
        return (
            <div className="p-6 text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
                <h3 className="text-lg font-semibold">Error loading analytics</h3>
            </div>
        );
    }

    const { overview, topSkills, dailyStats, scoreDistribution } = analytics;

    const overviewCards = [
        { label: 'Total Users', value: overview.totalUsers, icon: Users, color: 'blue', sub: `${overview.totalCandidates} candidates` },
        { label: 'Recruiters', value: overview.totalRecruiters, icon: Target, color: 'purple', sub: 'Active recruiters' },
        { label: 'Assessments Done', value: overview.completedSessions, icon: ShieldCheck, color: 'green', sub: 'Fully completed' },
        { label: 'Avg. Truth Score', value: `${overview.averageScore}%`, icon: Award, color: 'amber', sub: 'Platform average' },
    ];

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Platform Analytics</h1>
                <p className="text-gray-500 mt-1">Real-time insights into platform usage, candidate performance, and skill trends.</p>
            </div>

            {/* Overview KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {overviewCards.map(({ label, value, icon: Icon, color, sub }) => (
                    <Card key={label}>
                        <CardContent className="pt-5">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">{label}</p>
                                    <p className="text-3xl font-black text-gray-900 mt-1">{value}</p>
                                    <p className="text-xs text-gray-400 mt-1">{sub}</p>
                                </div>
                                <div className={`p-3 bg-${color}-50 rounded-xl`}>
                                    <Icon className={`w-6 h-6 text-${color}-600`} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Assessment Activity Chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                        Assessment Activity (Last 30 Days)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {dailyStats.length === 0 ? (
                        <div className="h-64 flex items-center justify-center text-gray-400">
                            No assessment data for the last 30 days.
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={280}>
                            <AreaChart data={dailyStats}>
                                <defs>
                                    <linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: 12 }}
                                    formatter={(val, name) => [val, name === 'assessments' ? 'Assessments' : 'Avg Score']}
                                />
                                <Area type="monotone" dataKey="assessments" stroke="#3b82f6" fill="url(#aGrad)" strokeWidth={2} dot={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>

            {/* Bottom row: top skills + score distribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top Skills Bar Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart2 className="w-5 h-5 text-purple-600" />
                            Top 10 Most Common Skills
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {topSkills.length === 0 ? (
                            <div className="h-64 flex items-center justify-center text-gray-400">No skill data yet.</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={topSkills} layout="vertical" margin={{ left: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                                    <XAxis type="number" tick={{ fontSize: 11 }} />
                                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', fontSize: 12 }} />
                                    <Bar dataKey="count" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Score Distribution Pie */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Award className="w-5 h-5 text-green-600" />
                            Truth Score Distribution
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {scoreDistribution.every((d: any) => d.count === 0) ? (
                            <div className="h-64 flex items-center justify-center text-gray-400">No score data yet.</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                    <Pie
                                        data={scoreDistribution}
                                        dataKey="count"
                                        nameKey="range"
                                        cx="50%"
                                        cy="45%"
                                        outerRadius={100}
                                        label={({ range, percent }) => `${range}: ${(percent * 100).toFixed(0)}%`}
                                        labelLine={false}
                                    >
                                        {scoreDistribution.map((_: any, index: number) => (
                                            <Cell key={index} fill={SCORE_COLORS[index % SCORE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Legend formatter={(val) => `Score ${val}`} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', fontSize: 12 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
