'use client'

import { useState, useEffect } from 'react'
import { Body, ButtonRs, Form, TextField, Title } from 'rootsy-feparts'
import { createPop } from '@/lib/popHelpers'
import styles from './page.module.css'

const TestPopPage = () => {
  const [popName, setPopName] = useState('')
  const [selectedBusinessType, setSelectedBusinessType] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [canCreate, setCanCreate] = useState(null)
  const [plans, setPlans] = useState([])
  const [businessTypes, setBusinessTypes] = useState([])
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setLoadingData(true)
      try {
        const [plansRes, businessTypesRes] = await Promise.all([
          fetch('/api/subscription/plans').catch(() => null),
          fetch('/api/subscription/business-types').catch(() => null)
        ])

        if (plansRes?.ok) {
          const plansData = await plansRes.json()
          setPlans(plansData || [])
        }

        if (businessTypesRes?.ok) {
          const businessTypesData = await businessTypesRes.json()
          setBusinessTypes(businessTypesData || [])
        }

        try {
          const canCreateRes = await fetch('/api/pop/can-create')
          if (canCreateRes.ok) {
            const canCreateData = await canCreateRes.json()
            setCanCreate(canCreateData)
          } else {
            setCanCreate({ canCreate: false, reason: 'Debes iniciar sesión' })
          }
        } catch {
          setCanCreate({ canCreate: false, reason: 'Error al verificar' })
        }
      } catch {
        setCanCreate({ canCreate: false, reason: 'Error al cargar datos' })
      } finally {
        setLoadingData(false)
      }
    }
    loadData()
  }, [])

  const handleCreatePop = async (e) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    try {
      const result = await createPop({
        name: popName,
        businessTypeId: selectedBusinessType || undefined
      })
      setResult(result)
    } catch (error) {
      setResult({
        success: false,
        error: 'Error inesperado',
        details: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className={styles.container}>
        <Title size='xs'>Cargando...</Title>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <Title size='xs'>Prueba de Creación de POP</Title>

      <div className={styles.section}>
        <Title size='xs' style={{ fontSize: '16px', marginBottom: '12px' }}>
          Estado Actual
        </Title>
        {canCreate?.canCreate ? (
          <Body size='sm' style={{ color: 'var(--success-500, #1EAE89)' }}>
            ✅ Puedes crear un POP
          </Body>
        ) : (
          <Body size='sm' style={{ color: 'var(--invalid-color, #ef4444)' }}>
            ❌ No puedes crear un POP: {canCreate?.reason || 'Límite alcanzado'}
          </Body>
        )}
      </div>

      {canCreate?.canCreate && (
        <Form className={styles.form} onSubmit={handleCreatePop}>
          <TextField
            label='Nombre del POP'
            name='popName'
            value={popName}
            onChange={(e) => setPopName(e.target.value)}
            placeholder='Mi Punto de Venta'
            required
            style={{ marginBottom: '16px' }}
          />

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
              Tipo de Negocio (opcional)
            </label>
            <select
              value={selectedBusinessType}
              onChange={(e) => setSelectedBusinessType(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid var(--grayscale-200)'
              }}
            >
              <option value=''>Seleccionar tipo...</option>
              {businessTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.display_name} (+${type.addon_price_monthly}/mes)
                </option>
              ))}
            </select>
          </div>

          <ButtonRs type='submit' isPending={loading}>
            Crear POP
          </ButtonRs>
        </Form>
      )}

      {result && (
        <div className={styles.result}>
          <Title size='xs' style={{ fontSize: '16px', marginBottom: '12px' }}>
            Resultado
          </Title>
          {result.success ? (
            <div>
              <Body size='sm' style={{ color: 'var(--success-500, #1EAE89)', marginBottom: '12px' }}>
                ✅ POP creado exitosamente!
              </Body>
              <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '4px' }}>
                <Body size='sm' style={{ marginBottom: '4px' }}>
                  <strong>ID:</strong> {result.pop.id}
                </Body>
                <Body size='sm' style={{ marginBottom: '4px' }}>
                  <strong>Nombre:</strong> {result.pop.name}
                </Body>
                {result.pop.subscription && (
                  <>
                    <Body size='sm' style={{ marginBottom: '4px' }}>
                      <strong>Plan:</strong> {result.pop.subscription.plan_display_name}
                    </Body>
                    <Body size='sm' style={{ marginBottom: '4px' }}>
                      <strong>Tipo de Negocio:</strong> {result.pop.subscription.business_type_display_name}
                    </Body>
                    <Body size='sm' style={{ marginBottom: '4px' }}>
                      <strong>Estado:</strong> {result.pop.subscription.status}
                    </Body>
                    <Body size='sm' style={{ marginBottom: '4px' }}>
                      <strong>Días restantes:</strong> {result.pop.subscription.days_remaining}
                    </Body>
                    <Body size='sm'>
                      <strong>Trial termina:</strong>{' '}
                      {result.pop.subscription.trial_ends_at
                        ? new Date(result.pop.subscription.trial_ends_at).toLocaleString('es-AR')
                        : 'N/A'}
                    </Body>
                  </>
                )}
              </div>
            </div>
          ) : (
            <Body size='sm' style={{ color: 'var(--invalid-color, #ef4444)' }}>
              ❌ Error: {result.error}
              {result.details && (
                <div style={{ marginTop: '8px', fontSize: '12px' }}>{result.details}</div>
              )}
            </Body>
          )}
        </div>
      )}

      <div className={styles.section}>
        <Title size='xs' style={{ fontSize: '16px', marginBottom: '12px' }}>
          Planes Disponibles
        </Title>
        {plans.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {plans.map((plan) => (
              <div
                key={plan.id}
                style={{
                  padding: '12px',
                  background: '#f5f5f5',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <strong>{plan.display_name}</strong> - ${plan.base_price_monthly}/mes o $
                {plan.base_price_yearly}/año
                {plan.trial_days > 0 && ` (${plan.trial_days} días de prueba)`}
              </div>
            ))}
          </div>
        ) : (
          <Body size='sm'>No se pudieron cargar los planes</Body>
        )}
      </div>

      <div className={styles.section}>
        <Title size='xs' style={{ fontSize: '16px', marginBottom: '12px' }}>
          Tipos de Negocio Disponibles
        </Title>
        {businessTypes.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {businessTypes.map((type) => (
              <div
                key={type.id}
                style={{
                  padding: '12px',
                  background: '#f5f5f5',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <strong>{type.display_name}</strong> - ${type.addon_price_monthly}/mes o $
                {type.addon_price_yearly}/año
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  {type.description}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Body size='sm'>No se pudieron cargar los tipos de negocio</Body>
        )}
      </div>
    </div>
  )
}

export default TestPopPage
