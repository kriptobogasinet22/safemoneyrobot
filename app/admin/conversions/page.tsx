"use client"

import { useEffect, useState } from "react"
import { getConversions } from "@/lib/supabase"
import AdminLayout from "@/components/admin/admin-layout"
import type { Conversion } from "@/types/admin"

export default function Conversions() {
  const [conversions, setConversions] = useState<Conversion[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("")
  const [currencyFilter, setCurrencyFilter] = useState("")

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

  const filteredConversions = conversions.filter(
    (conversion) =>
      (filter === "" ||
        conversion.username.toLowerCase().includes(filter.toLowerCase()) ||
        conversion.user_id.toString().includes(filter)) &&
      (currencyFilter === "" ||
        conversion.from_currency.toLowerCase() === currencyFilter.toLowerCase() ||
        conversion.to_currency.toLowerCase() === currencyFilter.toLowerCase()),
  )

  const uniqueCurrencies = Array.from(
    new Set(conversions.flatMap((conversion) => [conversion.from_currency, conversion.to_currency])),
  ).sort()

  return (
    <AdminLayout title="Dönüşümler">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-4 md:flex-row">
          <input
            type="text"
            placeholder="Kullanıcı adı veya ID ara..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md"
          />
          <select
            value={currencyFilter}
            onChange={(e) => setCurrencyFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Tüm Para Birimleri</option>
            {uniqueCurrencies.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
        </div>
        <div>
          <span className="font-medium">Toplam: {filteredConversions.length} dönüşüm</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-xl">Yükleniyor...</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg shadow-md">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kullanıcı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kaynak
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Miktar
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hedef
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sonuç
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tarih
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredConversions.map((conversion) => (
                <tr key={conversion.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{conversion.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{conversion.username || "Bilinmeyen"}</div>
                    <div className="text-sm text-gray-500">ID: {conversion.user_id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{conversion.from_currency}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {conversion.amount.toLocaleString("tr-TR", {
                      maximumFractionDigits: 8,
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{conversion.to_currency}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {conversion.result.toLocaleString("tr-TR", {
                      maximumFractionDigits: 8,
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(conversion.created_at).toLocaleString("tr-TR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  )
}
