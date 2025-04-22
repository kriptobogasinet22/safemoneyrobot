// Kripto para fiyatlarını çekmek için CoinGecko API kullanıyoruz
const COINGECKO_API_URL = "https://api.coingecko.com/api/v3"

// CoinGecko API'deki ID'ler
const COIN_IDS: Record<string, string> = {
  btc: "bitcoin",
  usdt: "tether",
  trx: "tron",
  xmr: "monero",
  doge: "dogecoin",
}

// Fiyat önbelleği
const priceCache: Record<string, { price: number; timestamp: number }> = {}
const CACHE_DURATION = 60000 // 60 saniye (milisaniye cinsinden)

export async function getCoinPrices(coins: string[]): Promise<Record<string, number>> {
  try {
    const now = Date.now()
    const pricesToFetch: string[] = []
    const result: Record<string, number> = {}

    // Önbellekte olmayan veya süresi dolmuş fiyatları belirle
    for (const coin of coins) {
      const coinLower = coin.toLowerCase()
      const cached = priceCache[coinLower]

      if (cached && now - cached.timestamp < CACHE_DURATION) {
        result[coinLower] = cached.price
      } else {
        pricesToFetch.push(coin)
      }
    }

    // Eğer çekilecek fiyat varsa API'ye istek yap
    if (pricesToFetch.length > 0) {
      const coinIds = pricesToFetch
        .map((coin) => COIN_IDS[coin.toLowerCase()])
        .filter(Boolean)
        .join(",")

      const response = await fetch(
        `${COINGECKO_API_URL}/simple/price?ids=${coinIds}&vs_currencies=try`,
        { next: { revalidate: 60 } }, // 60 saniyede bir yenile
      )

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      // API yanıtını işle ve önbelleğe al
      for (const [coinId, priceData] of Object.entries(data)) {
        const coin = Object.keys(COIN_IDS).find((key) => COIN_IDS[key] === coinId)
        if (coin && priceData.try) {
          result[coin] = priceData.try
          priceCache[coin] = {
            price: priceData.try,
            timestamp: now,
          }
        }
      }
    }

    return result
  } catch (error) {
    console.error("Error fetching coin prices:", error)
    throw error
  }
}

export async function convertCryptoToTRY(amount: number, coin: string): Promise<number> {
  const prices = await getCoinPrices([coin])
  const price = prices[coin.toLowerCase()]

  if (!price) {
    throw new Error(`Price not available for ${coin}`)
  }

  return amount * price
}

export async function convertTRYToCrypto(amount: number, coin: string): Promise<number> {
  const prices = await getCoinPrices([coin])
  const price = prices[coin.toLowerCase()]

  if (!price) {
    throw new Error(`Price not available for ${coin}`)
  }

  return amount / price
}
