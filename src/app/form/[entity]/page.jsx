'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Form from '@rjsf/core'
import validator from '@rjsf/validator-ajv8'

import { CustomWidgets } from './customWidgets'
import { ButtonRs } from 'rootsy-feparts'

export default function Page () {
  const params = useParams()
  const [schema, setSchema] = useState(null)
  const [uiSchema, setUiSchema] = useState(null)

  useEffect(() => {
    if (!params.entity) return

    // Importar dinámicamente el schema según el parámetro de la URL
    import(`../../../../domain/global/${params.entity}.schema`)
      .then(mod => {
        console.log('sí entró!!!')
        setSchema(mod.schema)
        setUiSchema(mod.uiSchema)
      })
      .catch(err => {
        console.error('🚨 Error cargando el schema:', err)
        setSchema(null)
        setUiSchema(null)
      })
  }, [params.entity])

  const handleSubmit = async ({ formData }) => {
    console.log('entrando....')
    try {
      console.log('al try....')
      const response = await fetch('/api/pop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      alert('no llego')

      const result = await response.json()
      console.log('📩 Respuesta del servidor:', result)

      if (response.ok) {
        alert('✅ Entidad creada correctamente')
      } else {
        alert('❌ Error al crear la entidad: ' + result.error)
      }
    } catch (error) {
      console.error('🚨 Error en la solicitud:', error)
      alert('❌ Error inesperado')
    }
  }

  if (!schema) {
    return <h1>⏳ Cargando esquema de {params.entity}...</h1>
  }

  return (
    <div
      style={{
        display: 'grid',
        placeContent: 'center',
        padding: '3rem 7rem',
        gap: '1rem'
      }}
    >
      <h1>
        Formulario para{' '}
        <span style={{ textTransform: 'uppercase' }}>{params.entity}</span>
      </h1>
      <Form
        schema={schema}
        validator={validator}
        onSubmit={handleSubmit}
        widgets={CustomWidgets}
        uiSchema={uiSchema}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '1rem'
          }}
        >
          <ButtonRs type='submit'>Enviar</ButtonRs>
          <ButtonRs type='reset'>Cancelar</ButtonRs>
        </div>
      </Form>
    </div>
  )
}
