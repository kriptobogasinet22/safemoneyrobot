import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Dönüşüm işlemlerini kaydetmek için fonksiyon
export async function logConversion(
  userId: number,
  username: string,
  fromCurrency: string,
  toCurrency: string,
  amount: number,
  result: number,
) {
  return await supabase.from("conversions").insert([
    {
      user_id: userId,
      username: username || "Bilinmeyen",
      from_currency: fromCurrency,
      to_currency: toCurrency,
      amount: amount,
      result: result,
      created_at: new Date().toISOString(),
    },
  ])
}

// Admin paneli için dönüşümleri getiren fonksiyon
export async function getConversions() {
  const { data, error } = await supabase.from("conversions").select("*").order("created_at", { ascending: false })

  if (error) throw error
  return data
}

// Para birimine göre dönüşümleri getiren fonksiyon
export async function getConversionsByCurrency(currency: string) {
  const { data, error } = await supabase
    .from("conversions")
    .select("*")
    .or(`from_currency.eq.${currency},to_currency.eq.${currency}`)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

// Kullanıcıya göre dönüşümleri getiren fonksiyon
export async function getConversionsByUser(userId: number) {
  const { data, error } = await supabase
    .from("conversions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

// İstatistikleri getiren fonksiyon
export async function getStats() {
  const { data: conversions, error } = await supabase.from("conversions").select("*")

  if (error) throw error

  // Toplam işlem sayısı
  const totalConversions = conversions.length

  // Para birimlerine göre işlem sayıları
  const currencyCounts: Record<string, { from: number; to: number }> = {}

  // Kullanıcı sayısı
  const uniqueUsers = new Set()

  // Son 7 gündeki işlemler
  const last7Days = new Date()
  last7Days.setDate(last7Days.getDate() - 7)
  const recentConversions = conversions.filter((c) => new Date(c.created_at) > last7Days)

  // İstatistikleri hesapla
  conversions.forEach((c) => {
    uniqueUsers.add(c.user_id)

    if (!currencyCounts[c.from_currency]) {
      currencyCounts[c.from_currency] = { from: 0, to: 0 }
    }
    if (!currencyCounts[c.to_currency]) {
      currencyCounts[c.to_currency] = { from: 0, to: 0 }
    }

    currencyCounts[c.from_currency].from += 1
    currencyCounts[c.to_currency].to += 1
  })

  return {
    totalConversions,
    uniqueUsers: uniqueUsers.size,
    currencyCounts,
    recentConversions: recentConversions.length,
  }
}
