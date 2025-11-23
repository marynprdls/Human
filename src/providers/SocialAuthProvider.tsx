import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { StellarSocialSDK, StellarSocialAccount } from '../sdk/accesly';
import { logger } from '../utils/logger';

interface UserInfo {
  sub: string; // Google sub ID
  name: string;
  email: string;
  picture: string;
}

interface RegisteredUser {
  stellar_address: string;
  role: 'artisan' | 'client';
  name: string;
  business_name?: string;
  phone?: string;
  location_data?: {
    latitude: number;
    longitude: number;
    description?: string;
  };
}

interface SocialAuthContextType {
  isAuthenticated: boolean;
  account: StellarSocialAccount | null;
  userInfo: UserInfo | null;
  registeredUser: RegisteredUser | null;
  loading: boolean;
  loginWithGoogle: (credentialResponse: any) => Promise<void>;
  logout: () => void;
  updateRegisteredUser: (user: RegisteredUser) => void;
  sdk: StellarSocialSDK | null;
}

const SocialAuthContext = createContext<SocialAuthContextType | undefined>(undefined);

export const SocialAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [account, setAccount] = useState<StellarSocialAccount | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [registeredUser, setRegisteredUser] = useState<RegisteredUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sdk, setSdk] = useState<StellarSocialSDK | null>(null);

  useEffect(() => {
    initializeSDK();
    loadRegisteredUserFromSession();
  }, []);

  const loadRegisteredUserFromSession = async () => {
    const savedSession = localStorage.getItem('social_auth_session');
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);

        // Restore userInfo from session
        if (session.userInfo) {
          setUserInfo(session.userInfo);
          logger.log('[ok] Restored userInfo from session');
        }

        if (session.googleSub) {
          // Try to load registered user from backend
          const response = await fetch(
            `${import.meta.env.PUBLIC_API_URL}/api/users/by-google/${session.googleSub}`
          );
          if (response.ok) {
            const dbUser = await response.json();
            setRegisteredUser(dbUser);
            logger.log('[ok] Loaded registered user from session:', dbUser.role);

            // If we have a saved session with all required data, mark as authenticated
            // User will need to authenticate again with Google when they need to sign transactions
            if (session.userInfo && session.publicKey) {
              logger.log('ℹ️ Session found but Google authentication required for transactions');
              // Don't set isAuthenticated=true because we need fresh Google credentials
              // for transaction signing
            }
          }
        }
      } catch (error) {
        logger.error('Error loading registered user from session:', error);
      }
    }
  };

  const initializeSDK = async () => {
    try {
      const googleClientId = import.meta.env.PUBLIC_GOOGLE_CLIENT_ID;
      const contractId = import.meta.env.PUBLIC_ACCESLY_CONTRACT_ID;

      if (!googleClientId) {
        logger.error('[F] Google Client ID not configured');
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
      logger.error('Failed to initialize SDK:', error);
      setLoading(false);
    }
  };

  const loginWithGoogle = async (credentialResponse: any) => {
    if (!sdk) {
      logger.error('SDK not initialized');
      return;
    }

    setLoading(true);
    try {
      logger.log('🔐 Processing Google login...');
      const result = await sdk.authenticateWithGoogleCredential(credentialResponse);

      if (result.success && result.account) {
        const authMethod = result.account.data.authMethods[0];
        const user: UserInfo = {
          sub: authMethod.metadata?.sub || '',
          name: authMethod.metadata?.name || 'User',
          email: authMethod.metadata?.email || '',
          picture: authMethod.metadata?.picture || '',
        };
        setUserInfo(user);
        setAccount(result.account);

        logger.log('👤 User info:', { sub: user.sub, name: user.name, email: user.email });

        // Check if user is registered in backend BEFORE setting isAuthenticated
        const googleSub = authMethod.metadata?.sub;
        if (googleSub) {
          try {
            logger.log('🔍 Checking if user is registered...');
            const response = await fetch(
              `${import.meta.env.PUBLIC_API_URL}/api/users/by-google/${googleSub}`
            );

            if (response.ok) {
              const dbUser = await response.json();
              setRegisteredUser(dbUser);
              logger.log('[ok] User is registered:', dbUser.role);

              // Save session with role
              localStorage.setItem('social_auth_session', JSON.stringify({
                userInfo: user,
                publicKey: result.account.publicKey,
                authType: 'google',
                role: dbUser.role,
                googleSub: googleSub
              }));
            } else {
              logger.log('ℹ️ User not registered yet');
              // Save session without role
              localStorage.setItem('social_auth_session', JSON.stringify({
                userInfo: user,
                publicKey: result.account.publicKey,
                authType: 'google',
                googleSub: googleSub
              }));
            }
          } catch (error) {
            logger.error('Error checking user registration:', error);
          }
        }

        // Set authenticated AFTER checking registration (so registeredUser is already set)
        setIsAuthenticated(true);
        logger.log('[ok] Login successful!');
      } else {
        logger.error('[F] Login failed:', result.error);
        alert('Login failed: ' + result.error);
      }
    } catch (error: any) {
      logger.error('[F] Login error:', error);
      alert('Login error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setAccount(null);
    setUserInfo(null);
    setRegisteredUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('social_auth_session');
    logger.log('👋 Logged out');
  };

  const updateRegisteredUser = (user: RegisteredUser) => {
    setRegisteredUser(user);
    logger.log('[ok] Updated registered user in context:', user.role);

    // Update localStorage as well to persist the registered user
    const savedSession = localStorage.getItem('social_auth_session');
    if (savedSession) {
      const session = JSON.parse(savedSession);
      session.role = user.role;
      localStorage.setItem('social_auth_session', JSON.stringify(session));
    }
  };

  return (
    <SocialAuthContext.Provider
      value={{
        isAuthenticated,
        account,
        userInfo,
        registeredUser,
        loading,
        loginWithGoogle,
        logout,
        updateRegisteredUser,
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
