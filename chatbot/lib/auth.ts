
export interface User {
  id: string;
  email: string;
  name: string;
}

export function getAuthUser(): User | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const userCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('user='));
    
    if (userCookie) {
      const userData = JSON.parse(decodeURIComponent(userCookie.split('=')[1]));
      return userData;
    }
  } catch (error) {
    console.error('Error parsing user cookie:', error);
  }
  
  return null;
}

export function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const authCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('auth='));
    
    return authCookie?.split('=')[1] === 'true';
  } catch (error) {
    console.error('Error checking auth cookie:', error);
    return false;
  }
}

export function logout() {
  if (typeof window === 'undefined') return;
  
  document.cookie = 'auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  document.cookie = 'user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  window.location.href = '/login';
}
