import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { StellarSocialSDK, StellarSocialAccount } from '../sdk/accesly';

interface UserInfo {
  name: string;
  email: string;
  picture: string;
}

interface SocialAuthContextType {
  isAuthenticated: boolean;
  account: StellarSocialAccount | null;
  userInfo: UserInfo | null;
  loading: boolean;
  loginWithGoogle: (credentialResponse: any) => Promise<void>;
  logout: () => void;
  sdk: StellarSocialSDK | null;
}

const SocialAuthContext = createContext<SocialAuthContextType | undefined>(undefined);

export const SocialAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [account, setAccount] = useState<StellarSocialAccount | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [sdk, setSdk] = useState<StellarSocialSDK | null>(null);

  useEffect(() => {
    initializeSDK();
  }, []);

  const initializeSDK = async () => {
    try {
      const googleClientId = import.meta.env.PUBLIC_GOOGLE_CLIENT_ID;
      const contractId = import.meta.env.PUBLIC_ACCESLY_CONTRACT_ID;

      if (!googleClientId) {
        console.error('❌ Google Client ID not configured');
        setLoading(false);
        return;
      }

      const stellarSDK = new StellarSocialSDK({
        contractId: contractId || '',
        network: 'testnet',
        googleClientId: googleClientId,
      });

      await stellarSDK.initialize();
      setSdk(stellarSDK);

      // Restore session if exists
      const savedSession = localStorage.getItem('social_auth_session');
      if (savedSession) {
        const session = JSON.parse(savedSession);
        setUserInfo(session.userInfo);
        setIsAuthenticated(false); // Will need to re-authenticate
      }

      setLoading(false);
    } catch (error) {
      console.error('Failed to initialize SDK:', error);
      setLoading(false);
    }
  };

  const loginWithGoogle = async (credentialResponse: any) => {
    if (!sdk) {
      console.error('SDK not initialized');
      return;
    }

    setLoading(true);
    try {
      console.log('🔐 Processing Google login...');
      const result = await sdk.authenticateWithGoogleCredential(credentialResponse);

      if (result.success && result.account) {
        setAccount(result.account);
        setIsAuthenticated(true);

        const authMethod = result.account.data.authMethods[0];
        const user: UserInfo = {
          name: authMethod.metadata?.name || 'User',
          email: authMethod.metadata?.email || '',
          picture: authMethod.metadata?.picture || '',
        };
        setUserInfo(user);

        // Save session
        localStorage.setItem('social_auth_session', JSON.stringify({
          userInfo: user,
          publicKey: result.account.publicKey,
          authType: 'google',
        }));

        console.log('✅ Login successful!');
      } else {
        console.error('❌ Login failed:', result.error);
        alert('Login failed: ' + result.error);
      }
    } catch (error: any) {
      console.error('❌ Login error:', error);
      alert('Login error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setAccount(null);
    setUserInfo(null);
    setIsAuthenticated(false);
    localStorage.removeItem('social_auth_session');
    console.log('👋 Logged out');
  };

  return (
    <SocialAuthContext.Provider
      value={{
        isAuthenticated,
        account,
        userInfo,
        loading,
        loginWithGoogle,
        logout,
        sdk,
      }}
    >
      {children}
    </SocialAuthContext.Provider>
  );
};

export const useSocialAuth = () => {
  const context = useContext(SocialAuthContext);
  if (context === undefined) {
    throw new Error('useSocialAuth must be used within a SocialAuthProvider');
  }
  return context;
};
