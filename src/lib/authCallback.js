export function getAuthRedirectUrl() {
  return `${window.location.origin}/login`;
}

export function isAuthCallback() {
  const params = new URLSearchParams(window.location.search);
  return params.has('code') || window.location.hash.includes('access_token');
}
