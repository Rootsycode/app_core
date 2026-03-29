import { PopPermissionsProvider } from '@/context/PopPermissionsContext'
import { loadPopPermissionsSnapshotForLayout } from '@/lib/popPermissionsServer'

export default async function PopLayout ({
  children,
  params
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ pop: string }>
}>) {
  const { pop } = await params
  const snapshot = await loadPopPermissionsSnapshotForLayout(pop)

  return (
    <PopPermissionsProvider popId={pop} initialSnapshot={snapshot}>
      {children}
    </PopPermissionsProvider>
  )
}
