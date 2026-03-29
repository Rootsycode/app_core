'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import withAuth from '@/hoc/withAuth'
import { useAuth } from '@/context/AuthContextSupabase'
import { Body, ButtonRs, Title } from 'rootsy-feparts'
import { acceptPopInvitation } from '../actions'

const Page = () => {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const token = typeof params?.token === 'string' ? params.token : ''
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const onAccept = async () => {
    if (!token) {
      setErr('Enlace inválido.')
      return
    }
    setBusy(true)
    setErr(null)
    const res = await acceptPopInvitation(token)
    setBusy(false)
    if (!res.success) {
      setErr(res.error)
      return
    }
    setMsg('Listo. Ya tenés acceso al punto de venta.')
    setTimeout(() => {
      router.push(`/${res.popId}/menu`)
    }, 900)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: 32,
        background: 'var(--greyscale-700, #1e1f26)',
        color: '#fff',
        maxWidth: 480,
        margin: '0 auto'
      }}
    >
      <Title color='white'>Invitación</Title>
      <div style={{ marginTop: 12, opacity: 0.9 }}>
        <Body size='sm' color='white'>
          El enlace solo funciona si iniciás sesión con el mismo correo al que se envió la invitación: el
          servidor rechaza cualquier otra cuenta, aunque tenga el link.
        </Body>
        {user?.email ? (
          <div style={{ marginTop: 10, opacity: 0.85, fontSize: 14, lineHeight: 1.45 }}>
            <Body size='sm' color='white'>
              Sesión actual: {user.email}
            </Body>
          </div>
        ) : null}
      </div>
      {err ? (
        <div style={{ marginTop: 20, color: '#f87171', fontSize: 14 }}>{err}</div>
      ) : null}
      {msg ? (
        <div style={{ marginTop: 20, color: '#86efac', fontSize: 14 }}>{msg}</div>
      ) : null}
      <div style={{ marginTop: 24 }}>
        <ButtonRs type='button' onPress={onAccept} isDisabled={busy || !token}>
          {busy ? 'Procesando…' : 'Aceptar invitación'}
        </ButtonRs>
      </div>
    </div>
  )
}

export default withAuth(Page)
