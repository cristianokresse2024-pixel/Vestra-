import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

export type UserRole = 'Administrador' | 'Vendedor' | 'Parceiro';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  linkedPartnerId?: string; // For Partner (Parceiro) type
  createdAt: string;
}

interface AuthContextProps {
  user: User | null;
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
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hook into Firebase Auth state updates
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setError(null);
      
      if (currentUser) {
        try {
          // Fetch additional profile data (e.g. roles & rules) from Firestore
          const userDocRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(userDocRef);
          
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            // Check if this is a brand new user that just signed up via registerUser.
            // When registerUser is called, currentUser.metadata.creationTime == currentUser.metadata.lastSignInTime (roughly)
            // But to avoid race condition where registerUser hasn't written the doc yet, we wait a bit or let registerUser handle it.
            // Actually, we can just let registerUser do it. The onAuthStateChanged should only create a fallback if the user is logging in (e.g. from a previous session) and *still* has no doc.
            // Let's delay the fallback creation check.
            setTimeout(async () => {
              const retrySnap = await getDoc(userDocRef);
              if (!retrySnap.exists()) {
                const defaultProfile: UserProfile = {
                  id: currentUser.uid,
                  name: currentUser.displayName || 'Usuário',
                  email: currentUser.email || '',
                  role: 'Administrador', // First fallback
                  createdAt: new Date().toISOString()
                };
                await setDoc(userDocRef, defaultProfile);
                setProfile(defaultProfile);
              } else {
                setProfile(retrySnap.data() as UserProfile);
              }
            }, 3000);
          }
        } catch (err: any) {
          console.error("Error fetching user profile:", err);
          setError("Erro ao obter perfil de acesso. Verifique sua conexão.");
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Action: Login
  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error("Login failure:", err);
      let BrazilianErrorMsg = `Falha ao realizar login: ${err.code || err.message}`;
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        BrazilianErrorMsg = "E-mail ou senha incorretos.";
      } else if (err.code === 'auth/invalid-email') {
        BrazilianErrorMsg = "Formato de e-mail inválido.";
      }
      setError(BrazilianErrorMsg);
      setLoading(false);
      throw new Error(BrazilianErrorMsg);
    }
  };

  // Action: Register User (Cadastro)
  const registerUser = async (
    name: string, 
    email: string, 
    password: string, 
    role: UserRole, 
    linkedPartnerId?: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;
      
      // Store user metadata (such as role permissions) in Firestore
      const profileData: UserProfile = {
        id: newUser.uid,
        name: name.trim(),
        email: email.trim(),
        role,
        linkedPartnerId: role === 'Parceiro' ? linkedPartnerId : undefined,
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', newUser.uid), profileData);
      setProfile(profileData);
    } catch (err: any) {
      console.error("Registration failure:", err);
      let BrazilianErrorMsg = `Erro ao registrar: ${err.code || err.message}`;
      if (err.code === 'auth/email-already-in-use') {
        BrazilianErrorMsg = "Este endereço de e-mail já está em uso.";
      } else if (err.code === 'auth/weak-password') {
        BrazilianErrorMsg = "A senha deve conter pelo menos 6 caracteres.";
      } else if (err.code === 'auth/invalid-email') {
        BrazilianErrorMsg = "Formato de e-mail inválido.";
      }
      setError(BrazilianErrorMsg);
      setLoading(false);
      throw new Error(BrazilianErrorMsg);
    }
  };

  // Action: Recover Password
  const recoverPassword = async (email: string) => {
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      console.error("Password reset failure:", err);
      let BrazilianErrorMsg = "Erro ao enviar e-mail de recuperação.";
      if (err.code === 'auth/user-not-found') {
        BrazilianErrorMsg = "Nenhum usuário foi cadastrado com este e-mail.";
      } else if (err.code === 'auth/invalid-email') {
        BrazilianErrorMsg = "Formato de e-mail inválido.";
      }
      setError(BrazilianErrorMsg);
      throw new Error(BrazilianErrorMsg);
    }
  };

  // Action: Login/Register with Google
  const loginWithGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user has a profile, if not, create one (like register)
      const userDocRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userDocRef);
      if (!docSnap.exists()) {
        const profileData: UserProfile = {
          id: user.uid,
          name: user.displayName || 'Usuário Google',
          email: user.email || '',
          role: 'Administrador', // Defaul role for new google signups could be Admin or Vendedor
          createdAt: new Date().toISOString()
        };
        await setDoc(userDocRef, profileData);
        setProfile(profileData);
      } else {
        setProfile(docSnap.data() as UserProfile);
      }
    } catch (err: any) {
      console.error("Google login failure:", err);
      let BrazilianErrorMsg = `Falha ao realizar login com o Google: ${err.code || err.message}`;
      if (err.code === 'auth/popup-closed-by-user') {
         BrazilianErrorMsg = "O login foi cancelado pelo usuário.";
      } else if (err.code === 'auth/operation-not-allowed') {
         BrazilianErrorMsg = "O login com Google não está ativado no Firebase. Por favor, ative a opção Google no Firebase Authentication.";
      }
      setError(BrazilianErrorMsg);
      setLoading(false);
      throw new Error(BrazilianErrorMsg);
    }
  };

  // Action: Logout
  const logout = async () => {
    setLoading(true);
    setError(null);
    try {
      await signOut(auth);
    } catch (err: any) {
      console.error("Logout failure:", err);
      setError("Erro ao encerrar sessão.");
    } finally {
      setLoading(false);
    }
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
