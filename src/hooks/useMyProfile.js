import { useEffect, useState } from "react"
import { supabase } from "@/supabaseClient"

export function useMyProfile() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true

    async function init() {
      try {
        const { data } = await supabase.auth.getSession()
        if (!mounted) return
        setSession(data?.session || null)

        const userId = data?.session?.user?.id
        if (!userId) {
          setProfile(null)
          return
        }

        const { data: rows, error: qerr } = await supabase
          .from("profiles")
          .select("id, display_name, username, photo_url, bio")
          .eq("id", userId)
          .limit(1)
        if (qerr) throw qerr
        setProfile(rows?.[0] || null)
      } catch (e) {
        setError(e)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    init()

    // keep in sync with auth changes
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      setSession(s)
      // re-run query when auth flips
      if (s?.user?.id) {
        supabase
          .from("profiles")
          .select("id, display_name, username, photo_url, bio")
          .eq("id", s.user.id)
          .limit(1)
          .then(({ data }) => setProfile(data?.[0] || null))
      } else {
        setProfile(null)
      }
    })

    return () => {
      mounted = false
      sub?.subscription?.unsubscribe?.()
    }
  }, [])

  return { session, profile, loading, error }
}
