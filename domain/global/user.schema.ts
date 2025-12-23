import { RJSFSchema } from '@rjsf/utils'

export const schema: RJSFSchema = {
  title: 'User',
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    first_name: { type: 'string', minLength: 1 },
    last_name: { type: 'string', minLength: 1 },
    image_url: { type: 'string', format: 'uri' },
    pops: { type: 'array', items: { type: 'string', format: 'uuid' } },
    created_at : { type: 'string', format: 'date-time' },
    updated_at : { type: 'string', format: 'date-time' },
  },
  required: ['id', 'firstName', 'createdAt'],
  additionalProperties: false
}

export const uiSchema = {
  id: {
    'ui:options': {
      title: 'ID',
      description: 'Identificador único para el punto de venta',
      label: false,
      hideError: true,
    },
  },
  first_name: {
    'ui:options': {
      title: 'Nombre',
      label: false,
      hideError: true,
    },
  },
  last_name: {
    'ui:options': {
      title: 'Apellido',
      label: false,
      hideError: true,
    },
  },
  image_url: {
    'ui:options': {
      widget: 'TextWidget', // Forzar el uso de TextWidget para URIs
      title: 'URL de la imagen',
      placeholder: 'Ingrese una URL válida...',
      label: false,
      hideError: true,
    },
  },
  pops: {
    'ui:options': {
      title: 'Pops',
      label: false,
      hideError: true,
    },
  },
  created_at: {
    'ui:options': {
      title: 'Creado el',
      label: false,
      hideError: true,
    },
  },
  updated_at: {
    'ui:options': {
      title: 'Actualizado el',
      label: false,
      hideError: true,
    },
  },
}
