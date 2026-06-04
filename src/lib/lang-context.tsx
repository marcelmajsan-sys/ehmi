'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { translations, type Lang, type T } from '@/translations'

const COOKIE = 'ehmi_lang'

type LangCtx = { lang: Lang; setLang: (l: Lang) => void; t: T }

const LangContext = createContext<LangCtx>({
  lang: 'en',
  setLang: () => {},
  t: translations.en,
})

export function LangProvider({
  children,
  initial = 'hr',
}: {
  children: React.ReactNode
  initial?: Lang
}) {
  const [lang, setLangState] = useState<Lang>(initial)

  useEffect(() => {
    const stored = document.cookie
      .split('; ')
      .find(r => r.startsWith(`${COOKIE}=`))
      ?.split('=')[1] as Lang | undefined
    if (stored && (stored === 'en' || stored === 'hr')) setLangState(stored)
  }, [])

  function setLang(l: Lang) {
    setLangState(l)
    document.cookie = `${COOKIE}=${l};path=/;max-age=${60 * 60 * 24 * 365}`
  }

  return (
    <LangContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}
