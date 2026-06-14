import { getProfile } from './db';

export async function getPostAuthPath() {
  try {
    const profile = await getProfile();
    if (!profile?.onboarding_complete) {
      return '/onboarding';
    }
    return '/';
  } catch {
    return '/onboarding';
  }
}
