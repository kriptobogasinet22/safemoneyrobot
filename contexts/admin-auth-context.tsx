"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface AdminAuthContextType {
  isLoggedIn: boolean
  login: (password: string) => boolean
  logout: () => void
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    // Sayfa yüklendiğinde oturum durumunu kontrol et
    const adminSession = localStorage.getItem("adminSession")
    if (adminSession) {
      try {
        const session = JSON.parse(adminSession)
        setIsLoggedIn(session.isLoggedIn)
      } catch (error) {
        console.error("Session parsing error:", error)
        localStorage.removeItem("adminSession")
      }
    }
  }, [])

  const login = (password: string) => {
    // Basit şifre kontrolü - gerçek uygulamada daha güvenli bir yöntem kullanılmalı
    if (password === "admin123") {
      setIsLoggedIn(true)
      localStorage.setItem("adminSession", JSON.stringify({ isLoggedIn: true }))
      return true
    }
    return false
  }

  const logout = () => {
    setIsLoggedIn(false)
    localStorage.removeItem("adminSession")
  }

  return <AdminAuthContext.Provider value={{ isLoggedIn, login, logout }}>{children}</AdminAuthContext.Provider>
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (context === undefined) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider")
  }
  return context
}
