import React from "react"

export default function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = React.useState(null)
  const [ready, setReady] = React.useState(false)

  React.useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setReady(true)
    }
    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const onInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
    setReady(false)
  }

  return (
    <button
      type="button"
      onClick={onInstall}
      disabled={!ready}
      className="px-3 py-2 rounded-lg bg-leaf text-white font-medium disabled:opacity-50"
      title={ready ? "Install app" : "Install prompt not available yet"}
    >
      Install App
    </button>
  )
}
