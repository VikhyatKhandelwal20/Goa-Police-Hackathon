import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { API_BASE_URL } from '@/config/api';

export type UserRole = 'supervisor' | 'officer';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  rank?: string;
  sector?: string;
  zone?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

// Mock users for demo
const mockUsers: Record<string, User> = {
  'supervisor1': {
    id: 'sup1',
    username: 'supervisor1',
    name: 'SDPO Rajesh Kumar',
    role: 'supervisor',
    rank: 'SDPO',
  },
  'officer1': {
    id: 'off1',
    username: 'officer1',
    name: 'PI Amit Sharma',
    role: 'officer',
    rank: 'PI',
    sector: 'I',
    zone: 'Zone 1',
  },
};

const mockCredentials: Record<string, string> = {
  'supervisor1': 'admin123',
  'officer1': 'police123',
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (username: string, password: string) => {
        set({ isLoading: true });
        
        try {
          const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              officerId: username,
              password: password
            })
          });

          if (response.ok) {
            const data = await response.json();
            const officer = data.officer;
            
            // Map backend response to frontend user format
            const user: User = {
              id: officer._id,
              username: officer.officerId,
              name: officer.name,
              role: officer.role.toLowerCase() as UserRole,
              rank: officer.rank,
              sector: officer.homePoliceStation,
              zone: officer.currentStatus
            };

            set({ 
              user, 
              isAuthenticated: true, 
              isLoading: false 
            });
            return true;
          } else {
            const errorData = await response.json();
            console.error('Login failed:', errorData.error);
            set({ isLoading: false });
            return false;
          }
        } catch (error) {
          console.error('Login error:', error);
          set({ isLoading: false });
          return false;
        }
      },

      logout: () => {
        set({ 
          user: null, 
          isAuthenticated: false, 
          isLoading: false 
        });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);