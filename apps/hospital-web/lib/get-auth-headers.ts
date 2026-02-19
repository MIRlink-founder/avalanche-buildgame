// 로그인 이후 API 인증
export function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// 401 응답 시 "/" 로 리다이렉트
export function redirectIfUnauthorized(res: Response): boolean {
  if (res.status === 401) {
    localStorage.removeItem('accessToken');
    window.location.href = '/';
    return true;
  }
  return false;
}
