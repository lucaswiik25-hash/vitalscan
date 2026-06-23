// No-op shim
export function getAuthErrorMessage(err) {
  return err?.message || 'Authentication failed. Please try again.';
}