import { getPageMetadata } from '@/lib/seo'

export const metadata = getPageMetadata('dashboard/live')

export default function LiveDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}