"use client"

import { useEffect, useState } from "react"
import { getConversions } from "@/lib/supabase"
import AdminLayout from "@/components/admin/admin-layout"
import type { Conversion } from "@/types/admin"

export default function Users() {
  const [conversions, setConversions] = useState<Conversion[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("")

  useEffect(() => {
    async function fetchConversions() {
      try {
        const data = await getConversions()
        setConversions(data)
      } catch (error) {
        console.error("Error fetching conversions:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchConversions()
  }, [])

  // Kullanıcıları grupla
  const users = conversions.reduce(
    (acc, conversion) => {
      const userId = conversion.user_id
      if (!acc[userId]) {
        acc[userId] = {
          id: userId,
          username: conversion.username || "Bilinmeyen",
          conversions: [],
          totalConversions: 0,
        }
      }
      acc[userId].conversions.push(conversion)
      acc[userId].totalConversions += 1
      return acc
    },
    {} as Record<number, { id: number; username: string; conversions: Conversion[]; totalConversions: number }>,
  )

  const userList = Object.values(users).filter(
    (user) =>
      filter === "" ||
      user.username.toLowerCase().includes(filter.toLowerCase()) ||
      user.id.toString().includes(filter),
  )

  return (
    <AdminLayout title="Kullanıcılar">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <input
            type="text"
            placeholder="Kullanıcı adı veya ID ara..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <span className="font-medium">Toplam: {userList.length} kullanıcı</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-xl">Yükleniyor...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {userList.map((user) => (
            <div key={user.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">{user.username}</h3>
                <p className="text-gray-500">ID: {user.id}</p>
                <div className="mt-4">
                  <p className="text-gray-700">
                    <span className="font-medium">Toplam İşlem:</span> {user.totalConversions}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">Son İşlem:</span>{" "}
                    {new Date(
                      Math.max(...user.conversions.map((c) => new Date(c.created_at).getTime())),
                    ).toLocaleString("tr-TR")}
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-4">
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Son 5 İşlem</h4>
                <ul className="divide-y divide-gray-200">
                  {user.conversions
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .slice(0, 5)
                    .map((conversion) => (
                      <li key={conversion.id} className="py-2">
                        <p className="text-sm">
                          {conversion.amount.toLocaleString("tr-TR", {
                            maximumFractionDigits: 8,
                          })}{" "}
                          {conversion.from_currency} →{" "}
                          {conversion.result.toLocaleString("tr-TR", {
                            maximumFractionDigits: 8,
                          })}{" "}
                          {conversion.to_currency}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(conversion.created_at).toLocaleString("tr-TR")}
                        </p>
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  )
}
