import { createContext, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function createAuthActions(
  setSession: (s: Session | null) => void,
  setUser: (u: User | null) => void,
): Pick<AuthContextValue, "signIn" | "signUp" | "signOut"> {
  return {
    async signIn(email, password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error?.message ?? null };
    },
    async signUp(email, password, name) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });
      return { error: error?.message ?? null };
    },
    async signOut() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { recordActivity } = await import("@/lib/activity.functions");
          recordActivity({ data: { event: "logout", email: user.email ?? undefined, professionalId: user.id } }).catch(() => {});
        }
      } catch { /* noop */ }
      localStorage.removeItem("session_nonce");
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
    },
  };
}

export function useAuthState() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [wasKickedOut, setWasKickedOut] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Single-session enforcement: compare local nonce with DB every 30s
  useEffect(() => {
    if (!session?.user?.id) return;

    const checkNonce = async () => {
      const localNonce = localStorage.getItem("session_nonce");
      if (!localNonce) return;

      const { data } = await supabase
        .from("profiles")
        .select("active_session_nonce")
        .eq("id", session.user.id)
        .single();

      if (data?.active_session_nonce && data.active_session_nonce !== localNonce) {
        localStorage.removeItem("session_nonce");
        setWasKickedOut(true);
        await supabase.auth.signOut({ scope: "local" });
      }
    };

    checkNonce();
    const interval = setInterval(checkNonce, 30_000);
    return () => clearInterval(interval);
  }, [session?.user?.id]);

  return { session, setSession, user, setUser, isLoading, wasKickedOut };
}
