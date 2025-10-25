import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [loggedUser, setLoggedUser] = useState(null);
  const [loggedProfile, setLoggedProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      const currentUser = data?.user || null;
      setLoggedUser(currentUser);
      if (currentUser) {
        const { data: p } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .single();
        setLoggedProfile(p);
      }
      setLoading(false);
    }
    init();

    const { data: listener, error } = supabase.auth.onAuthStateChange(
      async (_, session) => {
        const newUser = session?.user || null;
        setLoggedUser(newUser);
        if (newUser) {
          const { data: p } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", newUser.id)
            .single();
          setLoggedProfile(p);
        } else {
          setLoggedProfile(null);
        }
      }
    );

    if (error) throw error;

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ loggedUser, loggedProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
