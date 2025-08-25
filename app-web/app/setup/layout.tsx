import { getPageMetadata } from '@/lib/seo'

export const metadata = getPageMetadata('setup')

export default function SetupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}