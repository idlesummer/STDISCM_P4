import type { PropsWithChildren } from 'react'

export default function DashboardLayout({ children }: PropsWithChildren) {
  return (
    <div className="h-screen overflow-auto">
      {children}
    </div>
  )
}
