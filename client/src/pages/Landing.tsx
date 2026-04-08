import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { useRef, useState } from 'react';
import { ArrowRight, ShieldCheck, UserCheck, Zap, CheckCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';

/* ─── Steps Data ─── */
const steps = [
  { num: "01", title: "Extract & Analyze",    desc: "Upload your resume — AI instantly parses and extracts your hard skills.", dotClass: "bg-violet-500" },
  { num: "02", title: "Dynamic Assessment",   desc: "Take an AI-generated test tailored precisely to your claimed skills.",    dotClass: "bg-blue-500"   },
  { num: "03", title: "Truth Scoring",        desc: "Receive verified 'Truth Scores' for each skill — trusted by recruiters.", dotClass: "bg-emerald-500"},
  { num: "04", title: "Comparison",           desc: "Recruiters compare verified profiles instantly, ensuring skills-based hiring.", dotClass: "bg-amber-500" },
  { num: "05", title: "Get Hired",            desc: "Skip the phone screen and go straight to final round interviews.",         dotClass: "bg-rose-500"   },
];

const stats = [
  { value: "50K+", label: "Verified Candidates" },
  { value: "98%",  label: "Recruiter Satisfaction" },
  { value: "2x",   label: "Faster Hiring" },
  { value: "10K+", label: "Roles Filled" },
];

/* ─── 3D Tilt Card ─── */
function TiltCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), { stiffness: 200, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top)  / rect.height - 0.5);
  };
  const handleMouseLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', perspective: 1000 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Dial Node ─── */
interface DialNodeProps {
  step: { num: string; title: string; desc: string; dotClass: string };
  angle: number;
  dialRotation: any;
}
function DialNode({ step, angle, dialRotation }: DialNodeProps) {
  const nodeRotation = useTransform(dialRotation, (r: any) => -(r + angle));
  const opacity = useTransform(dialRotation, [-angle - 18, -angle, -angle + 18], [0.18, 1, 0.18]);
  const scale   = useTransform(dialRotation, [-angle - 18, -angle, -angle + 18], [0.78, 1.1, 0.78]);
  return (
    <div className="absolute top-1/2 left-1/2 w-full h-0 flex justify-end items-center origin-center"
      style={{ transform: `translate(-50%, -50%) rotate(${angle}deg)` }}>
      <motion.div style={{ opacity, scale, rotate: nodeRotation }} className="flex items-center gap-5 translate-x-12 origin-left -mt-4">
        <div className={`w-3.5 h-3.5 rounded-full ${step.dotClass} shadow-md ring-4 ring-white`} />
        <span className="font-black text-5xl md:text-6xl tracking-tight" style={{ color: 'hsl(222,47%,11%,0.8)' }}>{step.num}</span>
      </motion.div>
    </div>
  );
}

/* ─── Floating Skill Chip ─── */
function SkillChip({ label, score, delay, x, y }: { label: string; score: number; delay: number; x: string; y: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
      transition={{ opacity: { delay, duration: 0.6 }, scale: { delay, duration: 0.6 }, y: { delay, duration: 3, repeat: Infinity, ease: 'easeInOut' } }}
      className="absolute bg-white rounded-2xl px-4 py-3 shadow-[0_8px_32px_hsl(222,47%,11%/0.12)] border border-[hsl(var(--border))] flex items-center gap-3 z-20"
      style={{ left: x, top: y, transformStyle: 'preserve-3d' }}
    >
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[hsl(252,83%,60%)] to-[hsl(220,90%,66%)] flex items-center justify-center shrink-0">
        <span className="text-white font-black text-xs">{score}</span>
      </div>
      <div>
        <p className="text-xs font-bold text-[hsl(var(--foreground))]">{label}</p>
        <div className="mt-1 h-1 w-16 bg-[hsl(var(--secondary))] rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-[hsl(252,83%,60%)] to-[hsl(220,90%,66%)]" style={{ width: `${score}%` }} />
        </div>
      </div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════ */
export default function LandingPage() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });
  const heroY       = useTransform(scrollYProgress, [0, 0.2], ["0%", "20%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.18], [1, 0]);

  const processRef = useRef(null);
  const { scrollYProgress: processProgress } = useScroll({ target: processRef, offset: ["start center", "end center"] });
  const dialRotation = useTransform(processProgress, [0, 1], [0, -80]);

  return (
    <div ref={containerRef} className="overflow-x-hidden">

      {/* ══════════════════════════════
          HERO
      ══════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 md:px-8 overflow-hidden">

        {/* Drifting orbs */}
        <div className="orb orb-1 top-[5%]  left-[10%]" />
        <div className="orb orb-2 bottom-[10%] right-[8%]" style={{ animationDelay: '-4s' }} />
        <div className="orb orb-3 top-[40%]  left-[60%]" style={{ animationDelay: '-8s' }} />

        {/* Dot grid */}
        <div className="absolute inset-0 dot-grid pointer-events-none opacity-60" />

        {/* Decorative spinning ring */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] pointer-events-none opacity-[0.04]">
          <div className="w-full h-full rounded-full border-2 border-dashed border-[hsl(252,83%,60%)] animate-spin-slow" />
        </div>

        <motion.div style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 w-full max-w-6xl mx-auto flex flex-col items-center text-center mt-24">

          {/* Badge */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
            <span className="hero-badge inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest text-[hsl(252,83%,55%)]">
              <Sparkles className="w-3 h-3" /> AI-Powered Skill Verification
            </span>
          </motion.div>

          {/* Giant headline */}
          <motion.div initial={{ y: 70, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}>
            <h1 className="text-[13vw] md:text-[11vw] leading-[0.85] font-black uppercase tracking-tighter">
              <span className="gradient-text-animated">Truth</span>
              <br />
              <span style={{ WebkitTextStroke: '2px hsl(222,47%,20%)', color: 'transparent' }}>Finder</span>
            </h1>
          </motion.div>

          {/* Subline */}
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-lg md:text-xl text-[hsl(var(--muted-foreground))] max-w-2xl leading-relaxed mb-10 mt-6 font-medium">
            AI-powered skill verification for modern professionals.{' '}
            <span className="text-[hsl(var(--foreground))] font-semibold">Prove your expertise</span>, land top roles faster.
          </motion.p>

          {/* CTAs */}
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.45 }} className="flex flex-col sm:flex-row gap-4 mb-24">
            <Link to="/register">
              <Button size="xl" className="group gap-2 rounded-2xl shadow-[0_8px_32px_hsl(252,83%,60%/0.4)]">
                Verify Your Skills <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="xl" variant="outline" className="rounded-2xl">Recruiter Access</Button>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-10 w-full max-w-3xl">
            {stats.map((s, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <span className="stat-number">{s.value}</span>
                <span className="text-xs text-[hsl(var(--muted-foreground))] font-semibold uppercase tracking-wide">{s.label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Floating skill chips — 3D depth effect */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <SkillChip label="React"       score={92} delay={1.0} x="8%"  y="22%" />
          <SkillChip label="TypeScript"  score={88} delay={1.3} x="78%" y="18%" />
          <SkillChip label="System Design" score={76} delay={1.6} x="82%" y="65%" />
          <SkillChip label="Node.js"     score={95} delay={1.9} x="4%"  y="68%" />
        </div>

        {/* Scroll cue */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[hsl(var(--muted-foreground)/0.5)]">
          <span className="text-[10px] tracking-widest uppercase font-bold">Scroll</span>
          <motion.div animate={{ y: [0, 7, 0] }} transition={{ duration: 1.4, repeat: Infinity }}
            className="w-0.5 h-8 bg-gradient-to-b from-[hsl(252,83%,60%)] to-transparent rounded-full" />
        </motion.div>
      </section>

      {/* ══════════════════════════════
          DIAL / PROCESS
      ══════════════════════════════ */}
      <section ref={processRef} className="py-24 max-w-7xl mx-auto flex flex-col md:flex-row relative overflow-hidden">
        <div className="hidden md:block w-1/3 sticky top-0 h-screen overflow-visible -ml-20 z-0">
          <div className="absolute top-1/2 -translate-y-1/2 left-0 w-[1400px] h-[1400px] -translate-x-[60%]">
            <motion.div style={{ rotate: dialRotation }}
              className="w-full h-full rounded-full border border-[hsl(var(--border))] relative">
              {steps.map((step, i) => (
                <DialNode key={step.num} step={step} angle={i * 20} dialRotation={dialRotation} />
              ))}
            </motion.div>
          </div>
        </div>

        <div className="w-full md:w-2/3 py-32 md:py-[20vh] space-y-48 md:space-y-[35vh] px-4 md:px-12 relative z-10">
          {steps.map((step) => (
            <motion.div key={step.num}
              initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-20%" }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col w-full max-w-2xl ml-auto">
              <div className={`w-2 h-2 rounded-full ${step.dotClass} mb-4 ring-4 ring-white shadow`} />
              <h3 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4 text-[hsl(var(--foreground))]">{step.title}</h3>
              <p className="text-base md:text-lg text-[hsl(var(--muted-foreground))] leading-relaxed max-w-lg">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════
          3D BENTO CARDS
      ══════════════════════════════ */}
      <section className="py-24 px-4 md:px-8 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16 text-center">
          <span className="tag mb-6 inline-flex">For Everyone</span>
          <h2 className="text-4xl md:text-6xl font-black tracking-tight mt-4">
            Built for <span className="gradient-text">both sides</span><br />of the table.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Candidates — 3D tilt card */}
          <TiltCard className="rounded-3xl">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="relative rounded-3xl p-10 md:p-14 overflow-hidden h-full"
              style={{ background: 'linear-gradient(135deg, hsl(252,83%,55%) 0%, hsl(220,90%,58%) 100%)' }}>
              <div className="absolute right-[-8%] bottom-[-8%] w-80 h-80 rounded-full bg-white opacity-[0.07] blur-[60px]" />
              <div className="absolute left-[-5%] top-[-5%] w-48 h-48 rounded-full bg-white opacity-[0.05] blur-[40px]" />
              {/* 3D floating inner card */}
              <div className="absolute right-8 top-8 bg-white/15 backdrop-blur-md rounded-2xl p-3 border border-white/25"
                style={{ transform: 'translateZ(20px)' }}>
                <div className="flex gap-1.5 mb-2">
                  {[92, 88, 76].map(s => (
                    <div key={s} className="text-center">
                      <div className="w-8 h-8 rounded-lg bg-white/25 text-white font-black text-xs flex items-center justify-center">{s}</div>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-white/70 font-semibold text-center">Truth Scores</p>
              </div>
              <div className="relative z-10 flex flex-col h-full">
                <div className="w-14 h-14 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center mb-8">
                  <ShieldCheck className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-3xl md:text-4xl font-black text-white mb-4">For Candidates</h3>
                <p className="text-white/75 text-lg leading-relaxed mb-10 max-w-sm">
                  Stand out with mathematically proven expertise. Stop negotiating your value—prove it.
                </p>
                <div className="space-y-3 mb-10">
                  {["AI-verified skill scores", "Anti-cheat assessment engine", "Trusted by top recruiters"].map(f => (
                    <div key={f} className="flex items-center gap-3 text-sm text-white/85">
                      <CheckCircle className="w-4 h-4 text-white/90 shrink-0" />{f}
                    </div>
                  ))}
                </div>
                <Link to="/register">
                  <Button className="rounded-xl bg-white text-[hsl(252,83%,55%)] hover:bg-white/92 font-bold border-none shadow-lg gap-2" size="lg">
                    Get Verified <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </TiltCard>

          {/* Recruiters — 3D tilt card */}
          <TiltCard className="rounded-3xl">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="relative rounded-3xl p-10 md:p-14 overflow-hidden bg-white border border-[hsl(var(--border))] shadow-[0_4px_32px_hsl(220,30%,10%/0.08)] h-full">
              <div className="absolute right-[-8%] bottom-[-8%] w-72 h-72 rounded-full bg-[hsl(173,72%,42%)] opacity-[0.07] blur-[60px]" />
              {/* 3D floating badge */}
              <div className="absolute right-8 top-8 bg-[hsl(173,72%,42%/0.08)] rounded-2xl p-3 border border-[hsl(173,72%,42%/0.2)]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-bold text-[hsl(173,72%,38%)] uppercase tracking-wide">Live Rooms</span>
                </div>
              </div>
              <div className="relative z-10 flex flex-col h-full">
                <div className="w-14 h-14 rounded-2xl bg-[hsl(173,72%,42%/0.1)] border border-[hsl(173,72%,42%/0.2)] flex items-center justify-center mb-8">
                  <UserCheck className="w-7 h-7 text-[hsl(173,72%,38%)]" />
                </div>
                <h3 className="text-3xl md:text-4xl font-black text-[hsl(var(--foreground))] mb-4">For Recruiters</h3>
                <p className="text-[hsl(var(--muted-foreground))] text-lg leading-relaxed mb-10 max-w-sm">
                  Skip the screen. Access candidates with already-verified skills and Truth Scores.
                </p>
                <div className="space-y-3 mb-10">
                  {["Instant skill comparison", "Live assessment rooms", "Zero bias hiring"].map(f => (
                    <div key={f} className="flex items-center gap-3 text-sm text-[hsl(var(--muted-foreground))]">
                      <CheckCircle className="w-4 h-4 text-[hsl(173,72%,38%)] shrink-0" />{f}
                    </div>
                  ))}
                </div>
                <Link to="/login">
                  <Button variant="outline" size="lg" className="rounded-xl gap-2">
                    Hire Trusted Talent <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </TiltCard>
        </div>
      </section>

      {/* ══════════════════════════════
          FOOTER CTA
      ══════════════════════════════ */}
      <section className="py-36 px-4 md:px-8 text-center relative overflow-hidden">
        {/* Layered gradient bg */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, hsl(252,83%,55%) 0%, hsl(220,90%,58%) 50%, hsl(173,72%,42%) 100%)' }} />
        {/* Animated light orbs inside */}
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-white opacity-[0.06] blur-[120px] animate-pulse-slow" />
        <div className="absolute inset-0 dot-grid opacity-[0.08]" />

        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 border border-white/30 text-white text-xs font-bold uppercase tracking-widest mb-10">
            <Sparkles className="w-3 h-3" /> Start Today — It's Free
          </span>
          <h2 className="text-5xl md:text-[7rem] font-black uppercase tracking-tighter leading-[0.88] mb-10 text-white">
            Start<br />Building<br />Trust.
          </h2>
          <p className="text-white/70 text-xl mb-14 max-w-lg leading-relaxed">
            Join thousands of professionals who've already proven their skills and landed better opportunities.
          </p>
          <Link to="/register">
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Button size="xl" className="rounded-2xl bg-white text-[hsl(252,83%,55%)] hover:bg-white/92 shadow-[0_8px_48px_hsl(0,0%,0%/0.3)] font-bold border-none gap-3">
                Create Free Account <ArrowRight className="w-6 h-6" />
              </Button>
            </motion.div>
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
