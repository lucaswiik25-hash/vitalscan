import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function useUserProfile() {
  const queryClient = useQueryClient();

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.list(),
  });

  const profile = profiles[0] || {};

  const updateProfile = async (updates) => {
    if (profile.id) {
      await base44.entities.UserProfile.update(profile.id, updates);
    } else {
      await base44.entities.UserProfile.create(updates);
    }
    queryClient.invalidateQueries({ queryKey: ['userProfile'] });
  };

  return {
    profile,
    loading: isLoading,
    updateProfile,
  };
}