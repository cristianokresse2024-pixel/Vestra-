import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'Administrador' | 'Vendedor' | 'Parceiro';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  linkedPartnerId?: string; // For Partner (Parceiro) type
  createdAt: string;
}

export interface LocalUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

// Export LocalUser alias for perfect type compatibility across components
export type { LocalUser as User };

interface AuthContextProps {
  user: LocalUser | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  registerUser: (name: string, email: string, password: string, role: UserRole, linkedPartnerId?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  recoverPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  setError: (err: string | null) => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize and check persistent session
  useEffect(() => {
    try {
      const savedUserStr = localStorage.getItem('reino_current_user');
      const savedProfileStr = localStorage.getItem('reino_current_profile');

      if (savedUserStr && savedProfileStr) {
        setUser(JSON.parse(savedUserStr));
        setProfile(JSON.parse(savedProfileStr));
      }
    } catch (e) {
      console.error("Failed to parse local login session:", e);
      localStorage.removeItem('reino_current_user');
      localStorage.removeItem('reino_current_profile');
    } finally {
      setLoading(false);
    }
  }, []);

  // Helper: Get all registered users from localStorage
  const getRegisteredUsers = (): { profile: UserProfile; password?: string }[] => {
    try {
      const usersStr = localStorage.getItem('reino_users');
      return usersStr ? JSON.parse(usersStr) : [];
    } catch (e) {
      console.error("Failed to parse registered users:", e);
      return [];
    }
  };

  // Action: Login (Local Storage lookup)
  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    // Simulate minor visual network latency for modern UI feel
    await new Promise(resolve => setTimeout(resolve, 600));

    try {
      const users = getRegisteredUsers();
      const targetUser = users.find(u => u.profile.email.toLowerCase() === email.toLowerCase());

      if (!targetUser) {
        throw new Error("E-mail ou senha incorretos.");
      }

      if (targetUser.password !== password) {
        throw new Error("E-mail ou senha incorretos.");
      }

      const mockUser: LocalUser = {
        uid: targetUser.profile.id,
        email: targetUser.profile.email,
        displayName: targetUser.profile.name
      };

      localStorage.setItem('reino_current_user', JSON.stringify(mockUser));
      localStorage.setItem('reino_current_profile', JSON.stringify(targetUser.profile));

      setUser(mockUser);
      setProfile(targetUser.profile);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Action: Register User (Enters profile in local storage database)
  const registerUser = async (
    name: string,
    email: string,
    password: string,
    role: UserRole,
    linkedPartnerId?: string
  ) => {
    setLoading(true);
    setError(null);

    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const users = getRegisteredUsers();
      const alreadyExists = users.some(u => u.profile.email.toLowerCase() === email.toLowerCase());

      if (alreadyExists) {
        throw new Error("Este endereço de e-mail já está em uso.");
      }

      const newUid = crypto.randomUUID();
      const profileData: UserProfile = {
        id: newUid,
        name: name.trim(),
        email: email.trim(),
        role,
        linkedPartnerId: role === 'Parceiro' ? linkedPartnerId : undefined,
        createdAt: new Date().toISOString()
      };

      // Add to array of users
      users.push({
        profile: profileData,
        password
      });

      // Commit to localStorage
      localStorage.setItem('reino_users', JSON.stringify(users));

      // Lock admin creation now that we have an administrator
      if (role === 'Administrador') {
        localStorage.setItem('reino_admin_lock', 'true');
      }

      const mockUser: LocalUser = {
        uid: newUid,
        email: profileData.email,
        displayName: profileData.name
      };

      localStorage.setItem('reino_current_user', JSON.stringify(mockUser));
      localStorage.setItem('reino_current_profile', JSON.stringify(profileData));

      setUser(mockUser);
      setProfile(profileData);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Action: Recover Password (Saves password recover request simulation)
  const recoverPassword = async (email: string) => {
    setError(null);
    await new Promise(resolve => setTimeout(resolve, 500));

    const users = getRegisteredUsers();
    const exists = users.some(u => u.profile.email.toLowerCase() === email.toLowerCase());

    if (!exists) {
      const BrazilianErrorMsg = "Nenhum usuário foi cadastrado com este e-mail.";
      setError(BrazilianErrorMsg);
      throw new Error(BrazilianErrorMsg);
    }

    // Return successfully of a simulated reset email
    return;
  };

  // Action: Clean, zero-configurations Google Autologin
  const loginWithGoogle = async () => {
    setLoading(true);
    setError(null);

    try {
      // Elegant Google Authentic animation delay
      await new Promise(resolve => setTimeout(resolve, 800));

      const email = "cristianokresse2024@gmail.com";
      const name = "Cristiano Kresse";

      const users = getRegisteredUsers();
      let targetUser = users.find(u => u.profile.email.toLowerCase() === email.toLowerCase());

      if (!targetUser) {
        // Automatically create account for Google
        const newUid = crypto.randomUUID();
        const profileData: UserProfile = {
          id: newUid,
          name,
          email,
          role: 'Administrador',
          createdAt: new Date().toISOString()
        };

        targetUser = {
          profile: profileData,
          password: 'google_oauth_bypass'
        };

        users.push(targetUser);
        localStorage.setItem('reino_users', JSON.stringify(users));
        localStorage.setItem('reino_admin_lock', 'true');
      }

      const mockUser: LocalUser = {
        uid: targetUser.profile.id,
        email: targetUser.profile.email,
        displayName: targetUser.profile.name
      };

      localStorage.setItem('reino_current_user', JSON.stringify(mockUser));
      localStorage.setItem('reino_current_profile', JSON.stringify(targetUser.profile));

      setUser(mockUser);
      setProfile(targetUser.profile);
    } catch (err: any) {
      console.error("Google local login failed:", err);
      setError("Erro ao autenticar com o Google.");
      setLoading(false);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Action: Logout
  const logout = async () => {
    setLoading(true);
    setError(null);
    await new Promise(resolve => setTimeout(resolve, 300));

    localStorage.removeItem('reino_current_user');
    localStorage.removeItem('reino_current_profile');

    setUser(null);
    setProfile(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        login,
        registerUser,
        loginWithGoogle,
        recoverPassword,
        logout,
        error,
        setError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
};
