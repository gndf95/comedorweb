import { generateRobotsTxt } from '@/lib/seo'

export async function GET() {
  const robotsTxt = generateRobotsTxt()
  
  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400' // Cache por 24 horas
    }
  })
}