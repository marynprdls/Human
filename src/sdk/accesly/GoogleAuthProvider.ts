import { AuthMethod } from './types';
import { CryptoUtils } from './crypto';

export class GoogleAuthProvider {
  private clientId: string;
  private initialized = false;

  constructor(clientId: string) {
    if (!clientId) {
      throw new Error('Google Client ID is required');
    }
    this.clientId = clientId;
  }

  async initialize(): Promise<void> {
    if (typeof window === 'undefined') return;
    if (this.initialized) return;

    console.log('🔧 Loading Google Identity Services script...');
    await this.loadGoogleIdentityServices();
    this.initialized = true;
    console.log('[ok] Google Identity Services script loaded');
  }

  private loadGoogleIdentityServices(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;

      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Identity Services'));

      document.head.appendChild(script);
    });
  }

  async createAuthMethodFromCredential(credentialResponse: any): Promise<AuthMethod> {
    try {
      const userInfo = await this.verifyToken(credentialResponse.credential);

      const authMethod: AuthMethod = {
        type: 'google',
        identifier: userInfo.email,
        token: credentialResponse.credential,
        metadata: {
          name: userInfo.name,
          picture: userInfo.picture,
          sub: userInfo.sub,
          email: userInfo.email,
          email_verified: userInfo.email_verified,
        }
      };

      console.log('[ok] Google authentication successful:', userInfo.email);
      return authMethod;
    } catch (error: any) {
      console.error('[F] Google authentication failed:', error);
      throw error;
    }
  }

  renderButton(element: Element, config: any = {}): void {
    if (!this.initialized || !window.google?.accounts?.id) {
      throw new Error('Google Identity Services not initialized');
    }

    const defaultConfig = {
      type: 'standard',
      shape: 'rectangular',
      theme: 'outline',
      text: 'signin_with',
      size: 'large',
      logo_alignment: 'left',
      width: '100%',
    };

    window.google.accounts.id.renderButton(element, { ...defaultConfig, ...config });
  }

  async verifyToken(token: string): Promise<any> {
    try {
      const payload = this.decodeJWT(token);

      if (!payload.iss || (payload.iss !== 'https://accounts.google.com' && payload.iss !== 'accounts.google.com')) {
        throw new Error(`Invalid token issuer: ${payload.iss}`);
      }

      if (!payload.aud || payload.aud !== this.clientId) {
        throw new Error(`Invalid token audience. Expected: ${this.clientId}, Got: ${payload.aud}`);
      }

      if (!payload.exp || payload.exp < Date.now() / 1000) {
        throw new Error('Token expired');
      }

      if (!payload.sub) {
        throw new Error('Missing user ID in token');
      }

      if (!payload.email) {
        throw new Error('Missing email in token');
      }

      return payload;
    } catch (error: any) {
      throw new Error(`Token verification failed: ${error.message}`);
    }
  }

  private decodeJWT(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }

      const payload = parts[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded);
    } catch (error) {
      throw new Error('Failed to decode JWT');
    }
  }

  generateSeed(googleSub: string): string {
    return CryptoUtils.generateSeed('google', googleSub);
  }

  signOut(): void {
    if (window.google?.accounts?.id) {
      console.log('Google sign out requested');
    }
  }
}
