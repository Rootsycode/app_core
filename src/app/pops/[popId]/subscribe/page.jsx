'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Body, ButtonRs, Link, Title } from 'rootsy-feparts'
import {
  getSubscribePageData,
  simulateActivatePopSubscription
} from './actions'
import styles from './page.module.css'

export default function PopSubscribePage () {
  const params = useParams()
  const router = useRouter()
  const popId = params.popId

  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [popName, setPopName] = useState('')
  const [subscription, setSubscription] = useState(null)
  const [actionError, setActionError] = useState('')
  const [pending, setPending] = useState(false)
  const [done, setDone] = useState(false)

  const load = useCallback(async () => {
    if (!popId || typeof popId !== 'string') {
      setPageError('Ruta inválida.')
      setLoading(false)
      return
    }
    setLoading(true)
    setPageError('')
    const res = await getSubscribePageData(popId)
    if (!res.ok) {
      setPageError(res.error)
      setLoading(false)
      return
    }
    setPopName(res.popName)
    setSubscription(res.subscription)
    setLoading(false)
  }, [popId])

  useEffect(() => {
    load()
  }, [load])

  const handleSimulatePay = async () => {
    if (!popId || typeof popId !== 'string') return
    setActionError('')
    setPending(true)
    const result = await simulateActivatePopSubscription(popId)
    setPending(false)
    if (!result.success) {
      setActionError(result.error)
      return
    }
    setDone(true)
    setTimeout(() => {
      router.push('/home')
    }, 1600)
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.inner}>
          <Body size='sm'>Cargando…</Body>
        </div>
      </div>
    )
  }

  if (pageError) {
    return (
      <div className={styles.page}>
        <div className={styles.inner}>
          <Link className={styles.back} onPress={() => router.push('/home')}>
            ← Volver al perfil
          </Link>
          <div className={styles.panel}>
            <Title size='xs'>No disponible</Title>
            <Body size='sm' className={styles.lead}>
              {pageError}
            </Body>
          </div>
        </div>
      </div>
    )
  }

  const subActive =
    subscription?.is_active === true || subscription?.isActive === true
  const daysRem = Number(
    subscription?.days_remaining ?? subscription?.daysRemaining ?? 0
  )

  const inTrialWithDays = subscription?.status === 'trial' && daysRem > 0

  const fullyActive =
    subActive && (subscription?.status === 'active' || inTrialWithDays)

  const needsSimulatedPay = !fullyActive

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <Link className={styles.back} onPress={() => router.push('/home')}>
          ← Volver al perfil
        </Link>

        <div className={styles.panel}>
          <Title size='xs'>Renovar suscripción</Title>
          <Body size='sm' className={styles.lead}>
            <strong>{popName}</strong>
            <br />
            Activá el punto de venta con un pago <strong>simulado</strong> (sin
            pasarela). En producción acá iría Stripe u otro proveedor.
          </Body>

          {subscription && (
            <Body size='sm' color='grayscale-500'>
              Estado actual:{' '}
              <strong>{String(subscription.status ?? '—')}</strong>
              {subActive === false ? ' · POP inactivo' : null}
            </Body>
          )}

          {fullyActive && !done && (
            <div className={styles.mockBox}>
              {inTrialWithDays
                ? 'Seguís en período de prueba; no hace falta pagar todavía.'
                : 'Este punto de venta ya figura como activo. Si aún no podés entrar, probá refrescar el perfil o contactá soporte.'}
            </div>
          )}

          {needsSimulatedPay && !done && (
            <>
              <div className={styles.mockBox}>
                Resumen simulado: pasás al plan de pago (nombre{' '}
                <code>started</code> o <code>starter</code> en{' '}
                <code>subscription_plans</code>), período de 30 días. Al
                confirmar se actualiza Supabase (
                <code>pop_subscriptions</code> → <code>active</code> +{' '}
                <code>plan_id</code> y precios, <code>pops.is_active</code> →{' '}
                <code>true</code>).
              </div>
              {actionError && (
                <div className={styles.error} role='alert'>
                  {actionError}
                </div>
              )}
              <ButtonRs
                className={styles.submit}
                isPending={pending}
                onPress={handleSimulatePay}
              >
                Confirmar pago simulado y activar
              </ButtonRs>
            </>
          )}

          {done && (
            <Body size='sm' color='success'>
              Listo. Redirigiendo al perfil…
            </Body>
          )}
        </div>
      </div>
    </div>
  )
}
