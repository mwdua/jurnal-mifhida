/**
 * Google Auth & Role Management
 */

import { api } from './api';

export interface User {
  email: string;
  name: string;
  picture: string;
  role: 'admin' | 'guru' | 'kepsek';
  jenjang_kelas?: string;
}

export class AuthService {
  private currentUser: User | null = null;
  private onLoginSuccess: (user: User) => void;

  constructor(onLoginSuccess: (user: User) => void) {
    this.onLoginSuccess = onLoginSuccess;
  }

  init() {
    console.log('Auth service initializing...');
    
    const checkGSI = () => {
        if ((window as any).google && (window as any).google.accounts) {
            (window as any).google.accounts.id.initialize({
                client_id: "704874636605-v8m80261r67r98r7e3v8e2p8.apps.googleusercontent.com",
                callback: this.handleCredentialResponse.bind(this)
            });
            const btnContainer = document.getElementById("google-login-btn");
            if (btnContainer) {
                (window as any).google.accounts.id.renderButton(
                    btnContainer,
                    { theme: "outline", size: "large", width: "250" }
                );
            }
        } else {
            setTimeout(checkGSI, 100);
        }
    };

    checkGSI();
  }

  private async handleCredentialResponse(response: any) {
    try {
        // Decode JWT (simplified for this context)
        const base64Url = response.credential.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const payload = JSON.parse(jsonPayload);
        const email = payload.email;

        // Try to fetch real role from API
        try {
            const apiResponse = await api.getUserByEmail(email);
            if (apiResponse.success && apiResponse.data) {
                const userData = apiResponse.data;
                this.currentUser = {
                    email: email,
                    name: payload.name,
                    picture: payload.picture,
                    role: userData.role as any,
                    jenjang_kelas: userData.jenjang_kelas
                };
            } else {
                // If API fail or user not in sheet, fallback to mock for preview dev
                this.mockLogin('admin', payload);
                return;
            }
        } catch (e) {
            console.warn('API Error, using fallback mock login');
            this.mockLogin('admin', payload);
            return;
        }

        if (this.currentUser) {
            this.onLoginSuccess(this.currentUser);
        }
    } catch (error) {
        console.error('Login error:', error);
    }
  }

  mockLogin(role: 'admin' | 'guru' | 'kepsek', payload?: any) {
    const mockUser: User = {
      email: payload?.email || 'mwdualima@gmail.com',
      name: payload?.name || 'User Miftahul Hidayah',
      picture: payload?.picture || 'https://ui-avatars.com/api/?name=Admin&background=1B4332&color=fff',
      role: role,
      jenjang_kelas: role === 'guru' ? 'SD Kelas 1' : undefined
    };
    
    this.currentUser = mockUser;
    this.onLoginSuccess(mockUser);
  }

  getCurrentUser() {
    return this.currentUser;
  }

  logout() {
    this.currentUser = null;
    document.getElementById('main-layout')!.classList.add('hidden');
    document.getElementById('auth-container')!.classList.remove('hidden');
    window.location.hash = '';
  }
}
