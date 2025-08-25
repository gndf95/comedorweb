import { generateSitemap } from '@/lib/seo'

export async function GET() {
  const sitemap = generateSitemap()
  
  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=86400' // Cache por 24 horas
    }
  })
}