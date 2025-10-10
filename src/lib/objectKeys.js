// src/lib/objectKeys.js
export function extFromFilename(name = '') {
  const m = String(name).match(/\.(\w{1,8})$/i)
  return m ? m[1].toLowerCase() : 'jpg'
}

export function yyyymmParts(d = new Date()) {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return { yyyy, mm }
}

/**
 * Build an R2 key for OneMoreDay post media.
 * kind: 'posts' | 'profiles' | etc. (default 'posts')
 */
export function omdMediaKey({ userId = 'anon', kind = 'posts', originalName = 'upload.jpg' } = {}) {
  const { yyyy, mm } = yyyymmParts()
  const ext = extFromFilename(originalName)
  const rand = Math.random().toString(36).slice(2, 8)
  const ts = Date.now()
  return `onemoreday/${kind}/${userId}/${yyyy}/${mm}/${ts}-${rand}.${ext}`
}
