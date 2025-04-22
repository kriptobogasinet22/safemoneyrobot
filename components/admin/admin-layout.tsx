"use client"

import type React from "react"

import Sidebar from "./sidebar"
import Header from "./header"
import AuthGuard from "./auth-guard"

export default function AdminLayout({
  children,
  title,
}: {
  children: React.ReactNode
  title: string
}) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1">
          <Header title={title} />
          <main className="p-6">{children}</main>
        </div>
      </div>
    </AuthGuard>
  )
}
