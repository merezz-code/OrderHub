import { createContext, useContext, useEffect, useState } from 'react';
import * as api from '../services/api';

interface AuthContextType {
  user: any;
  customer: any; 
  isAdmin: boolean;
  setCustomer: (data: any) => void; 
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
  const verifyAdmin = async () => {
    if (user) {
      const data = await api.checkAdminStatus();
      setIsAdmin(data.isAdmin);
    }
  };
  verifyAdmin();
}, [user]);
 

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await api.login(email, password);
      setUser(data);
      setCustomer(data);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => setUser(null);

  return (
    // On ajoute customer dans la value ici
    <AuthContext.Provider value={{ user, customer, login, logout, setCustomer ,isLoading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return context;
};