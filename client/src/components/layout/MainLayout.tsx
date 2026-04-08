import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';

export function MainLayout() {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary selection:text-white">
      <Navbar />
      <main className={`flex-1 w-full relative ${isLanding ? '' : 'pt-32'}`}>
        <Outlet />
      </main>
    </div>
  );
}
