import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Upload, ClipboardList, Award, Users, ArrowRight, BarChart3, CheckCircle, Sparkles } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useRef } from 'react';

/* Reusable 3D tilt for cards */
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

const actionCards = [
  { to: '/candidate/upload',      icon: Upload,        iconBg: 'bg-[hsl(252,83%,60%/0.08)] border-[hsl(252,83%,60%/0.2)]', iconColor: 'text-[hsl(252,83%,55%)]', title: 'Upload Resume',   desc: 'Upload your resume to extract and verify your skills with AI',               cta: 'Upload Now',         variant: 'default'  as const },
  { to: '/candidate/assessments', icon: ClipboardList, iconBg: 'bg-[hsl(173,72%,42%/0.08)] border-[hsl(173,72%,42%/0.2)]', iconColor: 'text-[hsl(173,72%,38%)]', title: 'Take Assessment', desc: 'Complete AI-generated skill assessments to prove your expertise',            cta: 'View Assessments',   variant: 'outline'  as const },
  { to: '/candidate/reports',     icon: Award,         iconBg: 'bg-[hsl(38,90%,55%/0.08)]  border-[hsl(38,90%,55%/0.2)]',  iconColor: 'text-[hsl(38,90%,45%)]',  title: 'My Reports',      desc: 'View your Truth Scores and skill-by-skill verification breakdown',          cta: 'View Reports',       variant: 'outline'  as const },
  { to: '/candidate/join-room',   icon: Users,         iconBg: 'bg-[hsl(310,70%,55%/0.08)] border-[hsl(310,70%,55%/0.2)]', iconColor: 'text-[hsl(310,70%,48%)]', title: 'Join Live Room',  desc: 'Enter a 6-digit code to join a live assessment session instantly',          cta: 'Join Room',          variant: 'glow'     as const },
];

const howItWorks = [
  { step: '01', icon: Upload,        title: 'Upload Resume',  desc: 'Upload your PDF or DOCX resume'           },
  { step: '02', icon: BarChart3,     title: 'AI Extraction',  desc: 'AI parses and categorizes your skills'    },
  { step: '03', icon: ClipboardList, title: 'Assessment',     desc: 'Complete verified, adaptive skill tests'  },
  { step: '04', icon: CheckCircle,   title: 'Get Verified',   desc: 'Receive your Truth Score for each skill'  },
];

export function CandidateDashboard() {
  const { user } = useAuthStore();

  return (
    <div className="max-w-7xl mx-auto pb-16 space-y-10 px-4 md:px-8">

      {/* Hero Banner */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        className="relative rounded-3xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg, hsl(252,83%,55%) 0%, hsl(220,90%,60%) 100%)' }}>
        <div className="absolute right-[-5%] top-[-30%] w-80 h-80 rounded-full bg-white opacity-[0.07] blur-[80px]" />
        <div className="absolute left-[35%] bottom-[-20%] w-60 h-60 rounded-full bg-white opacity-[0.05] blur-[60px]" />
        <div className="absolute inset-0 dot-grid opacity-[0.08]" />
        <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 border border-white/30 text-white text-xs font-bold uppercase tracking-widest mb-4">
              <Sparkles className="w-3 h-3" /> Candidate Portal
            </span>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
              Welcome back, <span className="text-white/80">{user?.name}</span>!
            </h1>
            <p className="mt-3 text-white/70 text-lg max-w-lg">Upload your resume to get your skills verified and increase your credibility.</p>
          </div>
          <Link to="/candidate/upload" className="shrink-0">
            <Button size="lg" className="rounded-xl bg-white text-[hsl(252,83%,55%)] hover:bg-white/92 font-bold border-none shadow-lg gap-2">
              <Upload className="w-4 h-4" /> Upload Resume
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* 3D Tilt Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {actionCards.map((card, i) => (
          <motion.div key={card.title} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.08 }}>
            <TiltCard className="h-full">
              <Card className="group hover:shadow-[0_8px_40px_hsl(252,83%,60%/0.15)] hover:border-[hsl(252,83%,60%/0.25)] transition-all duration-300 h-full flex flex-col relative overflow-hidden">
                {/* Hover glow orb */}
                <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-[hsl(252,83%,60%)] opacity-0 group-hover:opacity-[0.05] blur-[40px] transition-opacity duration-500" />
                <CardHeader className="flex-1">
                  <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-5 shadow-sm ${card.iconBg}`}>
                    <card.icon className={`w-5 h-5 ${card.iconColor}`} />
                  </div>
                  <CardTitle className="text-[17px]">{card.title}</CardTitle>
                  <CardDescription className="mt-2 text-sm leading-relaxed">{card.desc}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Link to={card.to}>
                    <Button variant={card.variant} size="sm" className="w-full rounded-xl gap-1 group/btn">
                      {card.cta} <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </TiltCard>
          </motion.div>
        ))}
      </div>

      {/* How It Works */}
      <div>
        <div className="mb-8">
          <span className="tag mb-3 inline-flex">Process</span>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight">How It Works</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {howItWorks.map((item, i) => (
            <motion.div key={item.step} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.09 }}>
              <TiltCard className="h-full">
                <Card className="p-6 flex flex-col gap-4 hover:border-[hsl(252,83%,60%/0.3)] hover:shadow-[0_8px_32px_hsl(252,83%,60%/0.1)] transition-all duration-300 h-full">
                  <div className="flex items-center gap-3 w-full">
                    <span className="text-xs font-black text-[hsl(252,83%,60%/0.55)] tracking-wider">{item.step}</span>
                    <div className="flex-1 h-px bg-gradient-to-r from-[hsl(252,83%,60%/0.2)] to-transparent" />
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[hsl(252,83%,60%/0.07)] border border-[hsl(252,83%,60%/0.15)] flex items-center justify-center shadow-sm">
                    <item.icon className="w-5 h-5 text-[hsl(252,83%,55%)]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[hsl(var(--foreground))] mb-1">{item.title}</h4>
                    <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">{item.desc}</p>
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
