"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAdminAuth } from "@/contexts/admin-auth-context"

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAdminAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/admin")
    }
  }, [isLoggedIn, router])

  if (!isLoggedIn) {
    return <div className="flex items-center justify-center min-h-screen">Yükleniyor...</div>
  }

  return <>{children}</>
}
