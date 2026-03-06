import { API_ROUTES, LoginRequest } from './apiRoutes';

export interface SignupRequest {
  email: string;
  password: string;
  full_name: string;
  username?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

class AuthService {
  private static TOKEN_KEY = 'zenith_access_token';

  static async login(data: LoginRequest & { remember_me?: boolean }) {
    const response = await fetch(API_ROUTES.AUTH.LOGIN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    const result = await response.json();
    this.setToken(result.access_token, data.remember_me);
    return result;
  }

  static async signup(data: SignupRequest) {
    const response = await fetch(API_ROUTES.AUTH.REGISTER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Signup failed');
    }

    const result = await response.json();
    this.setToken(result.access_token, true); // Signup defaults to remembered
    return result;
  }

  static async forgotPassword(data: ForgotPasswordRequest) {
    const response = await fetch(API_ROUTES.AUTH.FORGOT_PASSWORD, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Request failed');
    }

    return await response.json();
  }

  static async resetPassword(data: ResetPasswordRequest) {
    const response = await fetch(API_ROUTES.AUTH.RESET_PASSWORD, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Reset failed');
    }

    return await response.json();
  }

  static setToken(token: string, rememberMe: boolean = false) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.TOKEN_KEY, token);
      // If rememberMe is true, set cookie for 24 hours (86400s), else for the session
      const maxAge = rememberMe ? 86400 : 3600;
      document.cookie = `${this.TOKEN_KEY}=${token}; path=/; max-age=${maxAge}; SameSite=Strict`;
    }
  }

  static getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.TOKEN_KEY);
    }
    return null;
  }

  static logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.TOKEN_KEY);
      document.cookie = `${this.TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }
  }

  static isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export default AuthService;
