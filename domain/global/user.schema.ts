import { RJSFSchema } from '@rjsf/utils'

export const schema: RJSFSchema = {
  title: 'User',
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    first_name: { type: 'string', minLength: 1 },
    last_name: { type: 'string', minLength: 1 },
    image_url: { type: 'string', format: 'uri' },
    phone: { type: 'string' },
    address: { type: 'string' },
    city: { type: 'string' },
    state: { type: 'string' },
    country: { type: 'string' },
    postal_code: { type: 'string' },
    date_of_birth: { type: 'string', format: 'date' },
    gender: { type: 'string', enum: ['male', 'female', 'other', 'prefer_not_to_say'] },
    bio: { type: 'string' },
    website: { type: 'string', format: 'uri' },
    timezone: { type: 'string' },
    language: { type: 'string' },
    is_email_verified: { type: 'boolean' },
    is_phone_verified: { type: 'boolean' },
    last_login_at: { type: 'string', format: 'date-time' },
    metadata: { type: 'object' },
    created_at : { type: 'string', format: 'date-time' },
    updated_at : { type: 'string', format: 'date-time' },
  },
  required: ['id', 'first_name', 'created_at'],
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
