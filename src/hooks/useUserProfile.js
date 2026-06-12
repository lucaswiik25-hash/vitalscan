import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { getProfile, upsertProfile } from '@/lib/db';

export function useUserProfile() {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: getProfile,
    enabled: !!user?.id,
  });

  const updateProfile = async (updates) => {
    const updated = await upsertProfile(updates);
    queryClient.setQueryData(['userProfile', user?.id], updated);
    queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    return updated;
  };

  return {
    profile: profile || {},
    loading: authLoading || isLoading,
    updateProfile,
  };
}
