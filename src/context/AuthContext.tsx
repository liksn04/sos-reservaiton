/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('Critical Profile Fetch Error:', profileError);
        return;
      }

      // 프로필이 없는 경우 (주로 DB에서 profiles 행만 삭제된 테스트 데이터 꼬임 상황)
      if (!data) {
        if (import.meta.env.DEV) {
          setProfile({
            id: userId,
            kakao_id: null,
            display_name: `Guest_${userId.slice(0, 8)}`,
            avatar_url: null,
            part: [],
            bio: 'Anonymous developer account',
            status: 'approved',
            is_admin: false,
            member_role: 'member',
            banned_at: null,
            banned_reason: null,
            banned_by: null,
            created_at: new Date().toISOString(),
          });
        } else {
          console.warn('Profile not found for user:', userId);
          setProfile(null);
        }
        return;
      }

      if (data) {
        setProfile(data as Profile);
      }
    } catch (err) {
      console.error('Critical Profile Fetch Error:', err);
    } finally {
      setLoading(false);
    }
  };

  async function refreshProfile() {
    if (session?.user) await fetchProfile(session.user.id);
  }

  useEffect(() => {
    // 초기 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // 세션 변화 감지 (로그인/로그아웃/토큰 갱신)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ session, profile, loading, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
