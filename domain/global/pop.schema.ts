import { RJSFSchema } from '@rjsf/utils'

export const schema: RJSFSchema = {
  title: 'Pop',
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string', minLength: 1 },
    imageUrl: { type: 'string', format: 'uri' },
    ownerUserId: { type: 'string', format: 'uuid' },
    isActive: { type: 'boolean' }
  },
  required: ['id', 'name', 'imageUrl', 'ownerUserId'],
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
  name: {
    'ui:options': {
      title: 'Nombre',
      label: false,
      hideError: true,
    },
  },
  imageUrl: {
    'ui:options': {
      widget: 'TextWidget', // Forzar el uso de TextWidget para URIs
      title: 'URL de la imagen',
      placeholder: 'Ingrese una URL válida...',
      label: false,
      hideError: true,
    },
  },
  ownerUserId: {
    'ui:options': {
      title: 'ID del propietario',
      label: false,
      hideError: true,
    },
  },
  isActive: {
    'ui:options': {
      title: 'Activo',
      label: false,
    },
  },
}
