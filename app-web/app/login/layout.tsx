import { getPageMetadata } from '@/lib/seo'

export const metadata = getPageMetadata('login')

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}