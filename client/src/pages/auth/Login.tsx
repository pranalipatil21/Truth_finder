import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/api/auth.api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ShieldCheck, ArrowRight, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const response = await authApi.login({ email, password });
      login(response.user, response.accessToken);
      const redirectPath = response.user.role === 'CANDIDATE'
        ? '/candidate/dashboard'
        : response.user.role === 'RECRUITER'
          ? '/recruiter/dashboard'
          : '/admin/dashboard';
      navigate(from !== '/' ? from : redirectPath, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-[hsl(var(--background))]">
      {/* Ambient orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[hsl(252,83%,60%)] opacity-[0.07] blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[450px] h-[450px] rounded-full bg-[hsl(173,72%,42%)] opacity-[0.06] blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'radial-gradient(hsl(222,47%,11%) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      </div>

      {/* Left: Feature panel */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(252,83%,55%)] to-[hsl(220,90%,60%)]" />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full bg-white opacity-[0.08] blur-[80px] animate-pulse-slow" />
        </div>

        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2.5 w-fit">
            <div className="w-9 h-9 rounded-xl bg-white/25 border border-white/30 flex items-center justify-center">
              <span className="text-white font-black text-xs">TF</span>
            </div>
            <span className="text-lg font-black text-white tracking-tight">TruthFinder</span>
          </Link>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-4xl font-black tracking-tight text-white mb-4 leading-tight">
              Your skills,<br />
              <span className="text-white/80">verified.</span>
            </h2>
            <p className="text-white/70 text-lg leading-relaxed">
              Sign in to access your verified skill profile and unlock opportunities with top employers.
            </p>
          </div>
          <div className="space-y-4">
            {[
              { icon: ShieldCheck, text: "Anti-cheat verified assessments" },
              { icon: Zap,         text: "AI-powered skill extraction"     },
              { icon: ArrowRight,  text: "Trusted by 10,000+ recruiters"   },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/15 border border-white/20 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm text-white/80 font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-xs text-white/40">© 2024 TruthFinder · Skill verification platform</p>
        </div>
      </div>

      {/* Right: Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[hsl(252,83%,60%)] to-[hsl(220,90%,66%)] flex items-center justify-center">
              <span className="text-white font-black text-xs">TF</span>
            </div>
            <span className="font-black text-[hsl(var(--foreground))]">TruthFinder</span>
          </div>

          <div className="mb-10">
            <h1 className="text-3xl font-black tracking-tight text-[hsl(var(--foreground))] mb-2">Welcome back</h1>
            <p className="text-[hsl(var(--muted-foreground))]">Sign in to your TruthFinder account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-3.5 rounded-xl text-sm flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />{error}
              </div>
            )}
            <Input label="Email address" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
            <Input label="Password" type="password" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required />

            <Button type="submit" size="lg" className="w-full rounded-xl mt-2" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : <>Sign in <ArrowRight className="ml-2 w-4 h-4" /></>}
            </Button>
          </form>

          <p className="text-sm text-[hsl(var(--muted-foreground))] text-center mt-8">
            Don't have an account?{' '}
            <Link to="/register" className="text-[hsl(var(--primary))] font-semibold hover:underline">Create one free</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
