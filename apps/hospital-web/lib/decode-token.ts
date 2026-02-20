function base64UrlDecodeToUtf8(base64Url: string): string {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export function getPayloadFromToken(
  token: string,
): { email?: string; name?: string; role?: string } | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    return JSON.parse(base64UrlDecodeToUtf8(payload)) as {
      email?: string;
      name?: string;
      role?: string;
    };
  } catch {
    return null;
  }
}
