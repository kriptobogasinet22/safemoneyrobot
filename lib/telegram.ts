import { getCoinPrices, convertCryptoToTRY, convertTRYToCrypto } from "./crypto"
import { logConversion } from "./supabase"
import type { TelegramUpdate, TelegramMessage, InlineKeyboardMarkup } from "@/types"

// Kullanıcı durumlarını takip etmek için
interface UserState {
  waitingFor?: {
    action: "convert"
    fromCurrency: string
    toCurrency: string
  }
}

// Kullanıcı durumlarını saklamak için basit bir nesne
const userStates: Record<number, UserState> = {}

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const SUPPORTED_COINS = ["BTC", "USDT", "TRX", "XMR", "DOGE"]

export async function handleUpdate(update: TelegramUpdate) {
  if (update.message) {
    await handleMessage(update.message)
  } else if (update.callback_query) {
    await handleCallbackQuery(update.callback_query)
  }
}

// handleMessage fonksiyonunu güncelleyelim
async function handleMessage(message: TelegramMessage) {
  const chatId = message.chat.id
  const userId = message.from?.id
  const username = message.from?.username
  const text = message.text?.toLowerCase()
  const isGroup = message.chat.type === "group" || message.chat.type === "supergroup"

  if (!text) return

  // Kullanıcı durumunu kontrol et
  const userState = userStates[chatId]
  if (userState?.waitingFor?.action === "convert") {
    // Kullanıcı bir dönüşüm için değer giriyor
    const amount = Number.parseFloat(text)
    if (!isNaN(amount)) {
      const { fromCurrency, toCurrency } = userState.waitingFor
      await handleConversion(chatId, amount, fromCurrency, toCurrency, isGroup, userId, username)
      // Durumu temizle
      delete userStates[chatId]
    } else {
      await sendMessage(chatId, "⚠️ Geçersiz miktar. Lütfen sayısal bir değer girin.")
    }
    return
  }

  // Grup içinde sadece /convert komutunu işle
  if (isGroup) {
    if (text.startsWith("/convert")) {
      const parts = text.split(" ")
      if (parts.length === 4) {
        const amount = Number.parseFloat(parts[1])
        const fromCurrency = parts[2].toUpperCase()
        const toCurrency = parts[3].toUpperCase()

        if (!isNaN(amount)) {
          await handleConversion(chatId, amount, fromCurrency, toCurrency, isGroup, userId, username)
        } else {
          await sendMessage(chatId, "⚠️ Geçersiz miktar. Lütfen sayısal bir değer girin.")
        }
      } else {
        await sendMessage(
          chatId,
          "ℹ️ *Doğru Format:*\n`/convert [miktar] [kaynak para birimi] [hedef para birimi]`\n\n*Örnek:* `/convert 100 TRY BTC`",
        )
      }
    }
    // Grup içinde başka komutları işleme
    return
  }

  // Özel mesajlarda tüm komutları işle
  if (text === "/start" || text === "/menu") {
    await sendMainMenu(chatId)
  } else if (text.startsWith("/convert")) {
    const parts = text.split(" ")
    if (parts.length === 4) {
      const amount = Number.parseFloat(parts[1])
      const fromCurrency = parts[2].toUpperCase()
      const toCurrency = parts[3].toUpperCase()

      if (!isNaN(amount)) {
        await handleConversion(chatId, amount, fromCurrency, toCurrency, isGroup, userId, username)
      } else {
        await sendMessage(chatId, "⚠️ Geçersiz miktar. Lütfen sayısal bir değer girin.")
      }
    } else {
      await sendMessage(
        chatId,
        "ℹ️ *Doğru Format:*\n`/convert [miktar] [kaynak para birimi] [hedef para birimi]`\n\n*Örnek:* `/convert 100 TRY BTC`",
      )
    }
  }
}

// handleCallbackQuery fonksiyonunu güncelleyelim
async function handleCallbackQuery(callbackQuery: any) {
  const chatId = callbackQuery.message.chat.id
  const userId = callbackQuery.from?.id
  const username = callbackQuery.from?.username
  const messageId = callbackQuery.message.message_id
  const data = callbackQuery.data
  const isPrivate = callbackQuery.message.chat.type === "private"

  if (data === "prices") {
    await sendCryptoPrices(chatId)
  } else if (data === "convert_menu") {
    await sendConversionMenu(chatId)
  } else if (data.startsWith("convert_to_try_")) {
    const coin = data.replace("convert_to_try_", "")

    if (isPrivate) {
      // Özel mesajlarda direkt değer sor
      userStates[chatId] = {
        waitingFor: {
          action: "convert",
          fromCurrency: coin,
          toCurrency: "TRY",
        },
      }
      await sendMessage(
        chatId,
        `💱 *Dönüşüm İşlemi* 💱\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `Lütfen TL'ye dönüştürmek istediğiniz *${coin}* miktarını girin:\n\n` +
          `💡 *İpucu:* Dönüşüm sonucunda farklı yüzdelik değerler de gösterilecektir.\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━`,
      )
    } else {
      // Gruplarda komut kullanımını anlat
      await sendConversionPrompt(chatId, coin, "TRY")
    }
  } else if (data.startsWith("convert_from_try_")) {
    const coin = data.replace("convert_from_try_", "")

    if (isPrivate) {
      // Özel mesajlarda direkt değer sor
      userStates[chatId] = {
        waitingFor: {
          action: "convert",
          fromCurrency: "TRY",
          toCurrency: coin,
        },
      }
      await sendMessage(
        chatId,
        `💱 *Dönüşüm İşlemi* 💱\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `Lütfen *${coin}*'a dönüştürmek istediğiniz TL miktarını girin:\n\n` +
          `💡 *İpucu:* Dönüşüm sonucunda farklı yüzdelik değerler de gösterilecektir.\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━`,
      )
    } else {
      // Gruplarda komut kullanımını anlat
      await sendConversionPrompt(chatId, "TRY", coin)
    }
  } else if (data === "main_menu") {
    await sendMainMenu(chatId)
  }

  // Answer callback query to remove loading state
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackQuery.id }),
  })
}

// sendConversionPrompt fonksiyonunu güncelleyelim
async function sendConversionPrompt(chatId: number | string, fromCurrency: string, toCurrency: string) {
  await sendMessage(
    chatId,
    `🔄 *Dönüşüm İşlemi* 🔄\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `Lütfen dönüştürmek istediğiniz *${fromCurrency}* miktarını girin.\n\n` +
      `*Örnek:* /convert 100 ${fromCurrency} ${toCurrency}\n\n` +
      `💡 *İpucu:* Dönüşüm sonucunda farklı yüzdelik değerler de gösterilecektir.\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━`,
  )
}

async function sendMainMenu(chatId: number | string) {
  const keyboard: InlineKeyboardMarkup = {
    inline_keyboard: [
      [{ text: "💰 Güncel Fiyatlar", callback_data: "prices" }],
      [{ text: "🔄 Para Çevirici", callback_data: "convert_menu" }],
    ],
  }

  await sendMessage(
    chatId,
    "🤖 *NIKEL CHANGE OFIS* 🤖\n\n" +
      "━━━━━━━━━━━━━━━━━━━━━\n\n" +
      "Merhaba! Kripto para fiyatlarını görmek veya dönüşüm yapmak için aşağıdaki menüyü kullanabilirsiniz.\n\n" +
      "💼 *Hızlı ve güvenilir kripto işlemleri*\n" +
      "📊 *Anlık fiyat güncellemeleri*\n" +
      "🔄 *Kolay para birimi dönüşümleri*\n\n" +
      "━━━━━━━━━━━━━━━━━━━━━",
    keyboard,
  )
}

async function sendCryptoPrices(chatId: number | string) {
  try {
    const prices = await getCoinPrices(SUPPORTED_COINS)

    let message = "💰 *Güncel Kripto Para Fiyatları* 💰\n\n"
    message += "━━━━━━━━━━━━━━━━━━━━━\n\n"

    const coinEmojis: Record<string, string> = {
      BTC: "₿",
      USDT: "💵",
      TRX: "⚡",
      XMR: "🔒",
      DOGE: "🐶",
    }

    for (const coin of SUPPORTED_COINS) {
      const price = prices[coin.toLowerCase()]
      if (price) {
        const emoji = coinEmojis[coin] || "🪙"
        message += `${emoji} *${coin}*: ${price.toLocaleString("tr-TR")} ₺\n`
      }
    }

    message +=
      "\n━━━━━━━━━━━━━━━━━━━━━\n\n" +
      "_Son güncelleme: " +
      new Intl.DateTimeFormat("tr-TR", {
        timeZone: "Europe/Istanbul",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(new Date()) +
      "_"

    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [{ text: "🔄 Yenile", callback_data: "prices" }],
        [{ text: "⬅️ Ana Menü", callback_data: "main_menu" }],
      ],
    }

    await sendMessage(chatId, message, keyboard)
  } catch (error) {
    console.error("Error fetching prices:", error)
    await sendMessage(chatId, "⚠️ Fiyatlar alınırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.")
  }
}

async function sendConversionMenu(chatId: number | string) {
  const keyboard: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        { text: "💵 TRY → ₿ BTC", callback_data: "convert_from_try_BTC" },
        { text: "₿ BTC → 💵 TRY", callback_data: "convert_to_try_BTC" },
      ],
      [
        { text: "💵 TRY → 💵 USDT", callback_data: "convert_from_try_USDT" },
        { text: "💵 USDT → 💵 TRY", callback_data: "convert_to_try_USDT" },
      ],
      [
        { text: "💵 TRY → ⚡ TRX", callback_data: "convert_from_try_TRX" },
        { text: "⚡ TRX → 💵 TRY", callback_data: "convert_to_try_TRX" },
      ],
      [
        { text: "💵 TRY → 🔒 XMR", callback_data: "convert_from_try_XMR" },
        { text: "🔒 XMR → 💵 TRY", callback_data: "convert_to_try_XMR" },
      ],
      [
        { text: "💵 TRY → 🐶 DOGE", callback_data: "convert_from_try_DOGE" },
        { text: "🐶 DOGE → 💵 TRY", callback_data: "convert_to_try_DOGE" },
      ],
      [{ text: "⬅️ Ana Menü", callback_data: "main_menu" }],
    ],
  }

  await sendMessage(
    chatId,
    "🔄 *Para Çevirici* 🔄\n\n" +
      "━━━━━━━━━━━━━━━━━━━━━\n\n" +
      "Lütfen yapmak istediğiniz dönüşüm işlemini seçin:\n\n" +
      "💡 *İpucu:* Özel yüzdelik dönüşümler için bir miktar girin.\n\n" +
      "━━━━━━━━━━━━━━━━━━━━━",
    keyboard,
  )
}

// handleConversion fonksiyonunu güncelleyelim - dönüşümleri kaydet ve görsel olarak zenginleştir
async function handleConversion(
  chatId: number | string,
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  isGroup = false,
  userId?: number,
  username?: string,
) {
  try {
    let result: number
    let message: string
    const coinEmojis: Record<string, string> = {
      BTC: "₿",
      USDT: "💵",
      TRX: "⚡",
      XMR: "🔒",
      DOGE: "🐶",
      TRY: "₺",
    }

    const fromEmoji = coinEmojis[fromCurrency] || "🪙"
    const toEmoji = coinEmojis[toCurrency] || "🪙"

    if (fromCurrency === "TRY" && SUPPORTED_COINS.includes(toCurrency)) {
      result = await convertTRYToCrypto(amount, toCurrency)
      message =
        `💱 *Dönüşüm Sonucu* 💱\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `${fromEmoji} *${amount.toLocaleString("tr-TR")} ${fromCurrency}* = ${toEmoji} *${result.toLocaleString(
          "tr-TR",
          {
            maximumFractionDigits: 8,
          },
        )} ${toCurrency}*`

      // Yüzdelik dönüşümleri ekle
      if (!isGroup) {
        message += await generatePercentageConversions(amount, fromCurrency, toCurrency)
      }
    } else if (SUPPORTED_COINS.includes(fromCurrency) && toCurrency === "TRY") {
      result = await convertCryptoToTRY(amount, fromCurrency)
      message =
        `💱 *Dönüşüm Sonucu* 💱\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `${fromEmoji} *${amount.toLocaleString("tr-TR", {
          maximumFractionDigits: 8,
        })} ${fromCurrency}* = ${toEmoji} *${result.toLocaleString("tr-TR")} ${toCurrency}*`

      // Yüzdelik dönüşümleri ekle
      if (!isGroup) {
        message += await generatePercentageConversions(amount, fromCurrency, toCurrency)
      }
    } else {
      message =
        "⚠️ *Desteklenmeyen Para Birimi*\n\n" + "Lütfen TRY ve desteklenen kripto paralar arasında dönüşüm yapın."
      return await sendMessage(chatId, message)
    }

    // Dönüşümü veritabanına kaydet
    if (userId) {
      try {
        await logConversion(userId, username || "", fromCurrency, toCurrency, amount, result)
      } catch (error) {
        console.error("Error logging conversion:", error)
        // Kayıt hatası olsa bile kullanıcıya dönüşüm sonucunu göster
      }
    }

    // Sadece özel mesajlarda butonları göster
    if (!isGroup) {
      const keyboard: InlineKeyboardMarkup = {
        inline_keyboard: [
          [{ text: "🔄 Başka Bir Dönüşüm", callback_data: "convert_menu" }],
          [{ text: "⬅️ Ana Menü", callback_data: "main_menu" }],
        ],
      }
      await sendMessage(chatId, message, keyboard)
    } else {
      // Grup içinde sadece mesajı gönder, buton yok
      await sendMessage(chatId, message)
    }
  } catch (error) {
    console.error("Error converting currency:", error)
    await sendMessage(chatId, "⚠️ Dönüşüm yapılırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.")
  }
}

// Yüzdelik dönüşümleri hesaplayan ve görsel olarak zenginleştiren fonksiyon
async function generatePercentageConversions(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
): Promise<string> {
  try {
    let message = "\n\n━━━━━━━━━━━━━━━━━━━━━\n\n"

    // Yüzdelik değerler için emojiler
    const percentEmojis: Record<number, string> = {
      10: "🔟",
      15: "1️⃣5️⃣",
      20: "2️⃣0️⃣",
      25: "2️⃣5️⃣",
      30: "3️⃣0️⃣",
      35: "3️⃣5️⃣",
      40: "4️⃣0️⃣",
      45: "4️⃣5️⃣",
      50: "5️⃣0️⃣",
    }

    const coinEmojis: Record<string, string> = {
      BTC: "₿",
      USDT: "💵",
      TRX: "⚡",
      XMR: "🔒",
      DOGE: "🐶",
      TRY: "₺",
    }

    const fromEmoji = coinEmojis[fromCurrency] || "🪙"
    const toEmoji = coinEmojis[toCurrency] || "🪙"

    const percentages = [10, 15, 20, 25, 30, 35, 40, 45, 50]

    for (const percentage of percentages) {
      const reducedAmount = amount * (1 - percentage / 100)
      let convertedAmount: number

      if (fromCurrency === "TRY" && SUPPORTED_COINS.includes(toCurrency)) {
        convertedAmount = await convertTRYToCrypto(reducedAmount, toCurrency)
        message += `${percentEmojis[percentage]} *%${percentage}* ${fromEmoji} ${reducedAmount.toLocaleString("tr-TR")} ➡️ ${toEmoji} ${convertedAmount.toLocaleString("tr-TR", { maximumFractionDigits: 8 })}\n`
      } else if (SUPPORTED_COINS.includes(fromCurrency) && toCurrency === "TRY") {
        convertedAmount = await convertCryptoToTRY(reducedAmount, fromCurrency)
        message += `${percentEmojis[percentage]} *%${percentage}* ${fromEmoji} ${reducedAmount.toLocaleString("tr-TR", { maximumFractionDigits: 8 })} ➡️ ${toEmoji} ${convertedAmount.toLocaleString("tr-TR")}\n`
      }
    }

    message += "\n━━━━━━━━━━━━━━━━━━━━━"
    return message
  } catch (error) {
    console.error("Error generating percentage conversions:", error)
    return "\n\n⚠️ Yüzdelik dönüşümler hesaplanırken bir hata oluştu."
  }
}

export async function sendMessage(chatId: number | string, text: string, replyMarkup?: InlineKeyboardMarkup) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`

  const body: any = {
    chat_id: chatId,
    text,
    parse_mode: "Markdown",
  }

  if (replyMarkup) {
    body.reply_markup = replyMarkup
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorData = await response.json()
    console.error("Telegram API error:", errorData)
    throw new Error(`Telegram API error: ${response.status} ${response.statusText}`)
  }

  return await response.json()
}
