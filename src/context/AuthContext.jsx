import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [loggedUser, setLoggedUser] = useState(null);
  const [loggedProfile, setLoggedProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      try {
        setAuthLoading(true);
        const { data, error } = await supabase.auth.getSession();
        if (error) console.error("Error loading session:", error);
        const user = data?.session?.user || null;
        if (mounted) setLoggedUser(user);

        if (user) {
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();
          if (profileError) console.error("Error loading profile:", profileError);
          if (mounted) setLoggedProfile(profile);
        } else {
          if (mounted) setLoggedProfile(null);
        }
      } catch (err) {
        console.error("Auth init error:", err);
        if (mounted) {
          setLoggedUser(null);
          setLoggedProfile(null);
        }
      } finally {
        if (mounted) setAuthLoading(false);
      }
    };

    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const user = session?.user || null;
        setLoggedUser(user);
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();
          setLoggedProfile(profile);
        } else {
          setLoggedProfile(null);
        }
        setAuthLoading(false);
      }
    );

    const handleFocus = async () => {
      const { data } = await supabase.auth.getSession();
      const user = data?.session?.user || null;
      setLoggedUser(user);
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setLoggedProfile(profile);
      } else {
        setLoggedProfile(null);
      }
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      mounted = false;
      window.removeEventListener("focus", handleFocus);
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ loggedUser, loggedProfile, authLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
