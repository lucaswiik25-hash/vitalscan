import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useState, useEffect } from 'react';

// Returns { profile, isLoading } — always scoped to the currently logged-in user.
export function useUserProfile() {
  const [userEmail, setUserEmail] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => {
      if (u?.email) setUserEmail(u.email);
    }).catch(() => {});
  }, []);

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['userProfile', userEmail],
    queryFn: () => base44.entities.UserProfile.filter({ created_by: userEmail }),
    enabled: !!userEmail,
  });

  return { profile: profiles[0] || {}, profiles, isLoading: isLoading || !userEmail };
}