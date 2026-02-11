import {useEffect, useState} from 'react';
import {useAuth} from './useAuth';

export function useAdmin() {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminLoading, setAdminLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = () => {
      if (loading) {
        setAdminLoading(true);
        return;
      }

      if (!user) {
        setIsAdmin(false);
        setAdminLoading(false);
        return;
      }

      // Check if user email ends with @corruptionwatchdog.in
      const isAdminUser = user.email?.endsWith('@corruptionwatchdog.in') || false;
      setIsAdmin(isAdminUser);
      setAdminLoading(false);
    };

    checkAdminStatus();
  }, [user, loading]);

  return {
    isAdmin,
    adminLoading,
    user
  };
}
