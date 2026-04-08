import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router } from './router/AppRouter';
import { useEffect } from 'react';
import { useAuthStore } from './store/auth.store';
import { Toaster } from 'sonner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const { setLoading } = useAuthStore();

  useEffect(() => {
    // Check if user is already authenticated on app load
    setLoading(false);
  }, [setLoading]);

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider
        router={router}
        future={{
          v7_startTransition: true,
        } as any}
      />
      {/* @ts-ignore - Version mismatch in @types/react between packages */}
      <Toaster position="top-center" richColors />
    </QueryClientProvider>
  );
}

export default App;
