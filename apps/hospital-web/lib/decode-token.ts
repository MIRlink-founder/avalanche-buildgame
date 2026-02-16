export function getPayloadFromToken(token: string): { role?: string } | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as {
      role?: string;
    };
  } catch {
    return null;
  }
}
