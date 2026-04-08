import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios.instance';
import { useAuthStore } from '@/store/auth.store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Search, Rocket, Star, ArrowRight, CheckCircle, Zap, Clock, Sparkles } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useRef } from 'react';

function TiltCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [5, -5]), { stiffness: 180, damping: 22 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-5, 5]), { stiffness: 180, damping: 22 });
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const handleMouseLeave = () => { x.set(0); y.set(0); };
  return (
    <motion.div ref={ref} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', perspective: 900 }} className={className}>
      {children}
    </motion.div>
  );
}

const benefits = [
  { icon: CheckCircle, title: 'Verified Skills',  desc: "All candidate skills tested via AI-powered assessments",                    iconBg: 'bg-[hsl(220,90%,62%/0.08)] border-[hsl(220,90%,62%/0.2)]', iconColor: 'text-[hsl(220,90%,55%)]' },
  { icon: Zap,         title: 'Truth Scores',     desc: "Each skill has a score showing how accurately it matches actual ability",    iconBg: 'bg-[hsl(252,83%,60%/0.08)] border-[hsl(252,83%,60%/0.2)]', iconColor: 'text-[hsl(252,83%,55%)]' },
  { icon: Clock,       title: 'Save Time',        desc: "Focus on proven candidates — reduce interview time significantly",           iconBg: 'bg-[hsl(173,72%,42%/0.08)] border-[hsl(173,72%,42%/0.2)]', iconColor: 'text-[hsl(173,72%,38%)]' },
];

export function RecruiterDashboard() {
  const { user } = useAuthStore();
  const { data: rooms } = useQuery({
    queryKey: ['recruiter-rooms'],
    queryFn: async () => { const res = await api.get('/room/recruiter'); return res.data; }
  });

  return (
    <div className="max-w-7xl mx-auto pb-16 space-y-10 px-4 md:px-8">

      {/* Hero Banner */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        className="relative rounded-3xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg, hsl(220,90%,55%) 0%, hsl(252,83%,60%) 100%)' }}>
        <div className="absolute right-[-5%] top-[-30%] w-80 h-80 rounded-full bg-white opacity-[0.07] blur-[80px]" />
        <div className="absolute left-[40%] bottom-[-20%] w-60 h-60 rounded-full bg-white opacity-[0.05] blur-[60px]" />
        <div className="absolute inset-0 dot-grid opacity-[0.08]" />
        <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 border border-white/30 text-white text-xs font-bold uppercase tracking-widest mb-4">
              <Sparkles className="w-3 h-3" /> Recruiter Portal
            </span>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
              Welcome, <span className="text-white/80">{user?.name}</span>!
            </h1>
            <p className="mt-3 text-white/70 text-lg max-w-lg">Find and verify candidates with proven skills for your open positions.</p>
          </div>
          <Link to="/recruiter/candidates" className="shrink-0">
            <Button size="lg" className="rounded-xl bg-white text-[hsl(252,83%,55%)] hover:bg-white/92 font-bold border-none shadow-lg gap-2">
              <Search className="w-4 h-4" /> Browse Candidates
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* 3D Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { to: '/recruiter/candidates', icon: Search, title: 'Browse Candidates', desc: 'Search and filter verified candidates by skills and truth scores', iconBg: 'bg-[hsl(220,90%,60%/0.08)] border-[hsl(220,90%,60%/0.2)]', iconColor: 'text-[hsl(220,90%,55%)]', cta: 'Browse Candidates', variant: 'default' as const },
          { to: '/recruiter/shortlist',  icon: Star,   title: 'Shortlisted',       desc: 'View and manage your shortlisted candidates for open roles',         iconBg: 'bg-[hsl(38,90%,55%/0.08)]  border-[hsl(38,90%,55%/0.2)]',  iconColor: 'text-[hsl(38,90%,45%)]',  cta: 'View Shortlist',   variant: 'outline' as const },
          { to: '/recruiter/rooms/create', icon: Rocket, title: 'Assessment Rooms', desc: 'Create live sessions and monitor candidate rankings in real time',  iconBg: 'bg-[hsl(252,83%,60%/0.08)] border-[hsl(252,83%,60%/0.2)]', iconColor: 'text-[hsl(252,83%,55%)]', cta: 'Create Room',     variant: 'default' as const },
        ].map((card, i) => (
          <motion.div key={card.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * (i + 1) }}>
            <TiltCard className="h-full">
              <Card className="group hover:shadow-[0_8px_40px_hsl(252,83%,60%/0.12)] hover:border-[hsl(252,83%,60%/0.25)] transition-all duration-300 h-full flex flex-col relative overflow-hidden">
                <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-[hsl(252,83%,60%)] opacity-0 group-hover:opacity-[0.05] blur-[35px] transition-opacity duration-500" />
                <CardHeader className="flex-1">
                  <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-5 shadow-sm ${card.iconBg}`}>
                    <card.icon className={`w-5 h-5 ${card.iconColor}`} />
                  </div>
                  <CardTitle className="text-[17px]">{card.title}</CardTitle>
                  <CardDescription className="mt-2 text-sm leading-relaxed">{card.desc}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link to={card.to}>
                    <Button variant={card.variant} size="sm" className="w-full rounded-xl gap-1">
                      {card.cta} <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                  {/* Rooms list only for assessment rooms card */}
                  {card.icon === Rocket && rooms && rooms.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <p className="text-[10px] text-[hsl(var(--muted-foreground))] font-bold uppercase tracking-widest">Active Rooms</p>
                      {rooms.slice(0, 3).map((r: any) => (
                        <Link key={r.id} to={`/recruiter/rooms/${r.id}`} className="block">
                          <div className="flex justify-between items-center bg-[hsl(var(--secondary))] px-3 py-2 rounded-xl hover:bg-[hsl(252,83%,60%/0.06)] border border-[hsl(var(--border))] hover:border-[hsl(252,83%,60%/0.25)] transition-all duration-200">
                            <span className="truncate text-xs font-semibold max-w-[140px]">{r.name}</span>
                            <span className="text-[10px] font-black text-[hsl(252,83%,55%)] bg-[hsl(252,83%,60%/0.08)] px-2 py-0.5 rounded-lg border border-[hsl(252,83%,60%/0.2)]">{r.roomCode}</span>
                          </div>
                        </Link>
                      ))}
                      {rooms.length > 3 && <p className="text-center text-[10px] text-[hsl(252,83%,55%)] font-bold pt-1 cursor-pointer hover:underline">View all (+{rooms.length - 3})</p>}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TiltCard>
          </motion.div>
        ))}
      </div>

      {/* Benefits */}
      <div>
        <div className="mb-8">
          <span className="tag mb-3 inline-flex">Benefits</span>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight">Why Use TruthFinder?</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {benefits.map((b, i) => (
            <motion.div key={b.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.09 }}>
              <TiltCard className="h-full">
                <Card className="p-6 h-full flex flex-col gap-4 hover:border-[hsl(252,83%,60%/0.25)] hover:shadow-[0_8px_32px_hsl(252,83%,60%/0.1)] transition-all duration-300">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shadow-sm ${b.iconBg}`}>
                    <b.icon className={`w-5 h-5 ${b.iconColor}`} />
                  </div>
                  <div>
                    <h4 className="font-bold text-[hsl(var(--foreground))] mb-2">{b.title}</h4>
                    <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">{b.desc}</p>
                  </div>
                </Card>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
