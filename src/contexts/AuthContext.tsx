import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Customer } from '../types';

interface AuthContextType {
  user: User | null;
  customer: Customer | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_USERS = [
  { id: '1', email: 'demo@example.com', password: 'demo123' },
];

const MOCK_CUSTOMERS: Customer[] = [
  {
    id: 'c1',
    userId: '1',
    email: 'demo@example.com',
    fullName: 'Demo User',
    phone: '+1234567890',
    address: '123 Main St, City, Country',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedCustomer = localStorage.getItem('customer');

    if (storedUser && storedCustomer) {
      setUser(JSON.parse(storedUser));
      setCustomer(JSON.parse(storedCustomer));
    }

    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      const mockUser = MOCK_USERS.find(
        u => u.email === email && u.password === password
      );

      if (!mockUser) {
        throw new Error('Invalid credentials');
      }

      const userData = { id: mockUser.id, email: mockUser.email };
      const customerData = MOCK_CUSTOMERS.find(c => c.userId === mockUser.id);

      if (!customerData) {
        throw new Error('Customer profile not found');
      }

      setUser(userData);
      setCustomer(customerData);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('customer', JSON.stringify(customerData));
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, fullName: string) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      const newUserId = String(Date.now());
      const newUser = { id: newUserId, email };
      const newCustomer: Customer = {
        id: `c${newUserId}`,
        userId: newUserId,
        email,
        fullName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      MOCK_USERS.push({ ...newUser, password });
      MOCK_CUSTOMERS.push(newCustomer);

      setUser(newUser);
      setCustomer(newCustomer);
      localStorage.setItem('user', JSON.stringify(newUser));
      localStorage.setItem('customer', JSON.stringify(newCustomer));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setCustomer(null);
    localStorage.removeItem('user');
    localStorage.removeItem('customer');
  };

  return (
    <AuthContext.Provider value={{ user, customer, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
