import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/api/auth.api';
import { Button } from '@/components/ui/Button';
import { LogOut, User } from 'lucide-react';
import { useState, useEffect } from 'react';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try { await authApi.logout(); } catch { /* continue */ }
    logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'CANDIDATE': return '/candidate/dashboard';
      case 'RECRUITER': return '/recruiter/dashboard';
      case 'ADMIN':     return '/admin/dashboard';
      default:          return '/';
    }
  };

  return (
    <nav className="fixed top-5 left-0 right-0 z-50 px-4 flex justify-center pointer-events-none">
      <div className={`
        w-full max-w-5xl pointer-events-auto rounded-2xl px-5 h-[60px]
        flex items-center justify-between
        transition-all duration-400
        ${scrolled
          ? 'bg-white/80 backdrop-blur-2xl border border-[hsl(var(--border))] shadow-[0_8px_40px_hsl(222,47%,11%/0.12),0_0_0_1px_hsl(0,0%,100%/0.6)_inset]'
          : 'bg-white/55 backdrop-blur-xl border border-[hsl(var(--border)/0.5)] shadow-[0_2px_16px_hsl(222,47%,11%/0.07)]'}
      `}>
        {/* Logo */}
        <Link to={getDashboardLink()} className="flex items-center gap-2.5 group shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[hsl(252,83%,60%)] to-[hsl(220,90%,66%)] flex items-center justify-center shadow-[0_2px_10px_hsl(252,83%,60%/0.4),0_0_0_2px_white,0_0_0_3px_hsl(252,83%,60%/0.15)] group-hover:shadow-[0_4px_18px_hsl(252,83%,60%/0.55),0_0_0_2px_white,0_0_0_3px_hsl(252,83%,60%/0.25)] transition-shadow duration-300">
            <span className="text-white font-black text-[10px] tracking-tighter">TF</span>
          </div>
          <span className="text-sm font-black text-[hsl(var(--foreground))] tracking-tight">TRUTH</span>
        </Link>

        {isAuthenticated && user && (
          <div className="hidden md:flex items-center gap-0.5 border-l border-[hsl(var(--border))] pl-5 ml-5">
            {user.role === 'CANDIDATE' && (<>
              <NavLink to="/candidate/dashboard">Dashboard</NavLink>
              <NavLink to="/candidate/upload">Upload Resume</NavLink>
              <NavLink to="/candidate/assessments">Assessments</NavLink>
            </>)}
            {user.role === 'RECRUITER' && (<>
              <NavLink to="/recruiter/dashboard">Dashboard</NavLink>
              <NavLink to="/recruiter/candidates">Candidates</NavLink>
              <NavLink to="/recruiter/shortlist">Shortlist</NavLink>
            </>)}
            {user.role === 'ADMIN' && (<>
              <NavLink to="/admin/dashboard">Dashboard</NavLink>
              <NavLink to="/admin/users">Users</NavLink>
              <NavLink to="/admin/questions">Questions</NavLink>
            </>)}
          </div>
        )}

        <div className="flex items-center gap-2 ml-auto">
          {isAuthenticated && user ? (
            <>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] shadow-[inset_0_1px_2px_hsl(0,0%,100%/0.8)]">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[hsl(252,83%,60%)] to-[hsl(220,90%,66%)] flex items-center justify-center shadow-sm">
                  <User className="w-3 h-3 text-white" />
                </div>
                <span className="text-xs font-semibold text-[hsl(var(--foreground))] max-w-[120px] truncate">{user.name}</span>
                <span className="text-[10px] font-bold text-[hsl(var(--primary))] uppercase tracking-wide bg-[hsl(var(--primary)/0.08)] px-1.5 py-0.5 rounded-md">{user.role}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-xl">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Link to="/login"><Button variant="ghost" size="sm" className="rounded-xl font-semibold">Login</Button></Link>
              <Link to="/register">
                <Button size="sm" className="rounded-xl font-semibold shadow-[0_2px_12px_hsl(252,83%,60%/0.35)]">Start Now</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] px-3 py-1.5 rounded-lg hover:bg-[hsl(var(--secondary))] transition-all duration-150">
      {children}
    </Link>
  );
}
