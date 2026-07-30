"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

type Theme = "light" | "dark" | "system"

interface ThemeContextValue {
  theme: Theme
  resolvedTheme: "light" | "dark"
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "system",
  resolvedTheme: "light",
  setTheme: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system")
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light")

  useEffect(() => {
    const saved = localStorage.getItem("bookmeup-theme") as Theme | null
    if (saved) setThemeState(saved)
  }, [])

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const resolve = () => {
      const resolved = theme === "system"
        ? (mediaQuery.matches ? "dark" : "light")
        : theme
      setResolvedTheme(resolved)
      document.documentElement.classList.toggle("dark", resolved === "dark")
    }
    resolve()
    mediaQuery.addEventListener("change", resolve)
    return () => mediaQuery.removeEventListener("change", resolve)
  }, [theme])

  const setTheme = (t: Theme) => {
    setThemeState(t)
    localStorage.setItem("bookmeup-theme", t)
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
