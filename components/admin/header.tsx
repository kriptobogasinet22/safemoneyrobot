"use client"

export default function Header({ title }: { title: string }) {
  return (
    <header className="bg-white shadow-md p-4">
      <h1 className="text-2xl font-bold">{title}</h1>
    </header>
  )
}
