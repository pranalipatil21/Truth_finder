import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/api/auth.api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowRight, Briefcase, User } from 'lucide-react';
import { motion } from 'framer-motion';

export function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'CANDIDATE' | 'RECRUITER'>('CANDIDATE');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setIsLoading(true);
    try {
      const response = await authApi.register({ name, email, password, role });
      login(response.user, response.accessToken);
      navigate(role === 'CANDIDATE' ? '/candidate/dashboard' : '/recruiter/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-10 px-4 bg-[hsl(var(--background))]">
      {/* Ambient orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[hsl(252,83%,60%)] opacity-[0.07] blur-[120px]" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[450px] h-[450px] rounded-full bg-[hsl(173,72%,42%)] opacity-[0.06] blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'radial-gradient(hsl(222,47%,11%) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-10 justify-center">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[hsl(252,83%,60%)] to-[hsl(220,90%,66%)] flex items-center justify-center shadow-[0_2px_10px_hsl(252,83%,60%/0.3)]">
            <span className="text-white font-black text-xs">TF</span>
          </div>
          <span className="text-lg font-black text-[hsl(var(--foreground))] tracking-tight">TruthFinder</span>
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black tracking-tight text-[hsl(var(--foreground))] mb-2">Create your account</h1>
          <p className="text-[hsl(var(--muted-foreground))]">Join thousands of verified professionals</p>
        </div>

        {/* Role Selector */}
        <div className="flex gap-3 mb-7 p-1.5 rounded-2xl bg-[hsl(var(--secondary))] border border-[hsl(var(--border))]">
          {(['CANDIDATE', 'RECRUITER'] as const).map(r => (
            <button
              key={r} type="button" onClick={() => setRole(r)}
              className={`
                flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold
                transition-all duration-200
                ${role === r
                  ? 'bg-gradient-to-r from-[hsl(252,83%,60%)] to-[hsl(220,90%,66%)] text-white shadow-[0_2px_12px_hsl(252,83%,60%/0.3)]'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'}
              `}
            >
              {r === 'CANDIDATE' ? <User className="w-4 h-4" /> : <Briefcase className="w-4 h-4" />}
              {r === 'CANDIDATE' ? 'Candidate' : 'Recruiter'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-3.5 rounded-xl text-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />{error}
            </div>
          )}
          <Input label="Full Name" type="text" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} required />
          <Input label="Email address" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Password" type="password" placeholder="Min. 8 chars" value={password} onChange={e => setPassword(e.target.value)} required />
            <Input label="Confirm" type="password" placeholder="Repeat password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
          </div>

          <Button type="submit" size="lg" className="w-full rounded-xl mt-1" disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating account...
              </span>
            ) : <>Create account <ArrowRight className="ml-2 w-4 h-4" /></>}
          </Button>
        </form>

        <p className="text-sm text-[hsl(var(--muted-foreground))] text-center mt-8">
          Already have an account?{' '}
          <Link to="/login" className="text-[hsl(var(--primary))] font-semibold hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
