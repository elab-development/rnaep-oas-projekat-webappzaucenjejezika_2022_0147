import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import { useEffect, useState } from 'react';

export default function AuthRoute() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const fetchMe = useAuthStore((s) => s.fetchMe);

  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function check() {
      try {
        if (token && !user) {
          await fetchMe();
        }
      } catch {}
      setChecking(false);
    }
    check();
  }, [token, user, fetchMe]);

  if (checking) return null;

  if (!token) {
    return <Navigate to='/login' replace />;
  }

  return <Outlet />;
}
