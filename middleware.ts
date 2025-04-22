import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Admin sayfalarını korumak için
  if (
    request.nextUrl.pathname.startsWith("/admin/dashboard") ||
    request.nextUrl.pathname.startsWith("/admin/users") ||
    request.nextUrl.pathname.startsWith("/admin/conversions")
  ) {
    // Client-side auth kullandığımız için burada bir şey yapmıyoruz
    // Client tarafında useAdminAuth hook'u ile kontrol ediyoruz
  }

  return NextResponse.next()
}
