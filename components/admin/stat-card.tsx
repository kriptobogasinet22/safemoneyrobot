import type React from "react"
export default function StatCard({
  title,
  value,
  icon,
}: {
  title: string
  value: string | number
  icon: React.ReactNode
}) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-500">{title}</h3>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <div className="text-blue-500 text-3xl">{icon}</div>
      </div>
    </div>
  )
}
