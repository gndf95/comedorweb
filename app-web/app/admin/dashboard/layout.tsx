import { getPageMetadata } from '@/lib/seo'

export const metadata = getPageMetadata('dashboard')

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}