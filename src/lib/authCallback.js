// No-op shim — Base44 handles OAuth callbacks natively
export function getAuthRedirectUrl() { return window.location.origin; }
export function isAuthCallback() { return false; }