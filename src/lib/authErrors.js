/**
 * Maps Supabase auth errors to user-friendly messages.
 */
export function getAuthErrorMessage(error) {
  if (!error?.message) return 'Something went wrong. Please try again.';

  const msg = error.message.toLowerCase();

  if (msg.includes('invalid login credentials')) {
    return 'Incorrect email or password. Please try again.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Please confirm your email before signing in.';
  }
  if (msg.includes('user already registered')) {
    return 'An account with this email already exists. Try signing in instead.';
  }
  if (msg.includes('password should be at least')) {
    return 'Password must be at least 6 characters.';
  }
  if (msg.includes('unable to validate email') || msg.includes('email_address_invalid')) {
    return 'Please enter a valid email address (test addresses like @example.com are not allowed).';
  }
  if (msg.includes('email rate limit')) {
    return 'Too many sign-up attempts. Please wait a few minutes and try again.';
  }
  if (msg.includes('signup is disabled')) {
    return 'New sign ups are currently disabled.';
  }
  if (msg.includes('rate limit') || msg.includes('too many requests')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }

  return error.message;
}
