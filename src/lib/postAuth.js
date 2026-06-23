import { getProfile } from './db';

export async function getPostAuthPath() {
  try {
    const profile = await getProfile();
    return profile?.onboarding_complete ? '/' : '/onboarding';
  } catch {
    return '/onboarding';
  }
}