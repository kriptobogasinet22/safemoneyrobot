"use client"

import { useEffect, useState } from "react"
import { getStats } from "@/lib/supabase"
import AdminLayout from "@/components/admin/admin-layout"
import StatCard from "@/components/admin/stat-card"
import type { Stats } from "@/types/admin"
import { BarChart, LineChart, PieChart, Activity, Users, RefreshCw } from "lucide-react"

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await getStats()
        setStats(data)
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <AdminLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <p className="text-xl">Yükleniyor...</p>
        </div>
      </AdminLayout>
    )
  }

  if (!stats) {
    return (
      <AdminLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <p className="text-xl text-red-500">İstatistikler yüklenirken bir hata oluştu.</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Dashboard">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Toplam Dönüşüm" value={stats.totalConversions} icon={<Activity />} />
        <StatCard title="Toplam Kullanıcı" value={stats.uniqueUsers} icon={<Users />} />
        <StatCard title="Son 7 Gün" value={stats.recentConversions} icon={<LineChart />} />
        <StatCard
          title="En Popüler Para Birimi"
          value={
            Object.entries(stats.currencyCounts).sort((a, b) => b[1].from + b[1].to - (a[1].from + a[1].to))[0]?.[0] ||
            "N/A"
          }
          icon={<BarChart />}
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-medium mb-4">Para Birimi Dağılımı</h3>
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <PieChart className="mx-auto h-24 w-24 text-blue-500" />
              <p className="mt-4 text-gray-500">
                {Object.entries(stats.currencyCounts).map(([currency, counts]) => (
                  <span key={currency} className="block">
                    {currency}: {counts.from + counts.to} işlem
                  </span>
                ))}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-medium mb-4">Dönüşüm Yönleri</h3>
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <RefreshCw className="mx-auto h-24 w-24 text-blue-500" />
              <p className="mt-4 text-gray-500">
                {Object.entries(stats.currencyCounts).map(([currency, counts]) => (
                  <span key={currency} className="block">
                    {currency} → Diğer: {counts.from} | Diğer → {currency}: {counts.to}
                  </span>
                ))}
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
