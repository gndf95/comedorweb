import { getPageMetadata } from '@/lib/seo'

export const metadata = getPageMetadata('empleados')

export default function EmpleadosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}