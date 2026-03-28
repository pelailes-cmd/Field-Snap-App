import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

import { generateId } from '../utils/id';

interface UserProfile {
  fullName: string;
  company: string;
  position: string;
  trade: string;
  head: string;
  department: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  password?: string;
  profile?: UserProfile;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName: string, company: string, position: string) => Promise<void>;
  logout: () => void;
  updateProfile: (profile: UserProfile) => Promise<void>;
  updateEmail: (newEmail: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('fieldsnap_current_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const getUsers = (): User[] => {
    const usersJson = localStorage.getItem('fieldsnap_registered_users');
    return usersJson ? JSON.parse(usersJson) : [];
  };

  const saveUsers = (users: User[]) => {
    localStorage.setItem('fieldsnap_registered_users', JSON.stringify(users));
  };

  const login = async (email: string, password: string) => {
    const users = getUsers();
    const foundUser = users.find(u => u.email === email && u.password === password);
    if (foundUser) {
      const { password: _, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword as User);
      localStorage.setItem('fieldsnap_current_user', JSON.stringify(userWithoutPassword));
    } else {
      throw new Error('Invalid email or password');
    }
  };

  const signup = async (email: string, password: string, fullName: string, company: string, position: string) => {
    const users = getUsers();
    if (users.find(u => u.email === email)) throw new Error('User already exists');

    const newUser: User = { 
      id: generateId(), 
      email, 
      name: email.split('@')[0],
      password,
      profile: { 
        fullName, 
        company, 
        position, 
        trade: '', 
        head: '', 
        department: '' 
      }
    };

    saveUsers([...users, newUser]);
    const { password: _, ...userWithoutPassword } = newUser;
    setUser(userWithoutPassword as User);
    localStorage.setItem('fieldsnap_current_user', JSON.stringify(userWithoutPassword));
  };

  const updateProfile = async (profile: UserProfile) => {
    if (!user) return;
    const users = getUsers();
    const updatedUsers = users.map(u => u.id === user.id ? { ...u, profile } : u);
    saveUsers(updatedUsers);
    
    const updatedUser = { ...user, profile };
    setUser(updatedUser);
    localStorage.setItem('fieldsnap_current_user', JSON.stringify(updatedUser));
  };

  const updateEmail = async (newEmail: string) => {
    if (!user) return;
    const users = getUsers();
    
    // Check if email already taken by someone else
    if (users.find(u => u.email === newEmail && u.id !== user.id)) {
      throw new Error('Email already in use');
    }

    const updatedUsers = users.map(u => u.id === user.id ? { ...u, email: newEmail } : u);
    saveUsers(updatedUsers);

    const updatedUser = { ...user, email: newEmail };
    setUser(updatedUser);
    localStorage.setItem('fieldsnap_current_user', JSON.stringify(updatedUser));
  };

  const updatePassword = async (newPassword: string) => {
    if (!user) return;
    const users = getUsers();
    const updatedUsers = users.map(u => u.id === user.id ? { ...u, password: newPassword } : u);
    saveUsers(updatedUsers);
  };

  const deleteAccount = async () => {
    if (!user) return;
    const users = getUsers().filter(u => u.id !== user.id);
    saveUsers(users);
    logout();
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('fieldsnap_current_user');
  };

  return (
    <AuthContext.Provider value={{ 
      user, isAuthenticated: !!user, login, signup, logout, 
      updateProfile, updateEmail, updatePassword, deleteAccount 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
