"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAdminAuth } from "@/contexts/admin-auth-context"

export default function Sidebar() {
  const pathname = usePathname()
  const { logout } = useAdminAuth()

  const isActive = (path: string) => {
    return pathname === path ? "bg-blue-700" : ""
  }

  return (
    <div className="w-64 h-screen bg-blue-800 text-white">
      <div className="p-4">
        <h2 className="text-2xl font-bold">Admin Panel</h2>
      </div>
      <nav className="mt-8">
        <ul>
          <li>
            <Link
              href="/admin/dashboard"
              className={`block px-4 py-2 hover:bg-blue-700 ${isActive("/admin/dashboard")}`}
            >
              Dashboard
            </Link>
          </li>
          <li>
            <Link
              href="/admin/conversions"
              className={`block px-4 py-2 hover:bg-blue-700 ${isActive("/admin/conversions")}`}
            >
              Dönüşümler
            </Link>
          </li>
          <li>
            <Link href="/admin/users" className={`block px-4 py-2 hover:bg-blue-700 ${isActive("/admin/users")}`}>
              Kullanıcılar
            </Link>
          </li>
          <li>
            <button onClick={logout} className="block w-full px-4 py-2 text-left hover:bg-blue-700">
              Çıkış Yap
            </button>
          </li>
        </ul>
      </nav>
    </div>
  )
}
