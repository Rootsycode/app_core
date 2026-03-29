import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { schemas } from '../../../../../../domain/global/schemas'

async function tableExists (schema: string, table: string) {
  const { data, error } = await supabase
    .from('pg_tables')
    .select('*')
    .eq('schemaname', schema)
    .eq('tablename', table)

  return data && data.length > 0
}

async function createTable (
  schema: string,
  table: string,
  schemaDefinition: any
) {
  let sql = `CREATE TABLE IF NOT EXISTS ${schema}.${table} (`
  const columns = Object.entries(schemaDefinition.properties).map(
    ([key, value]: [string, any]) => {
      let type = 'TEXT'

      if (value.type === 'integer') type = 'INTEGER'
      if (value.type === 'number') type = 'FLOAT'
      if (value.type === 'boolean') type = 'BOOLEAN'
      if (value.type === 'string' && value.format === 'uuid')
        type = 'UUID PRIMARY KEY'
      if (value.type === 'string' && value.format === 'date-time')
        type = 'TIMESTAMP'

      return `${key} ${type} ${
        schemaDefinition.required?.includes(key) ? 'NOT NULL' : ''
      }`
    }
  )

  sql += columns.join(', ') + ');'

  await supabase.rpc('execute_sql', { query: sql })
}

export async function POST (
  req: NextRequest,
  { params }: { params: { schema: string; table: string } }
) {
  const { schema, table } = params
  const schemaDefinition = schemas[table]

  if (!schemaDefinition) {
    return NextResponse.json({ error: 'Schema no encontrado' }, { status: 400 })
  }

  const exists = await tableExists(schema, table)
  if (!exists) await createTable(schema, table, schemaDefinition)

  const data = await req.json()
  const { error } = await supabase.from(`${schema}.${table}`).insert([data])

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ message: 'Dato insertado correctamente' })
}

export async function GET (
  req: NextRequest,
  { params }: { params: { schema: string; table: string } }
) {
  const { schema, table } = params
  const { data, error } = await supabase
    .schema(schema)
    .from(table)
    .select('last_name')

  const { data: user, error: userError } = await supabase.auth.getUser()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({
    myResponse: 'yo te cuento que todo bien',
    user: user,
    data: data
  })
}

export async function PUT (
  req: NextRequest,
  { params }: { params: { schema: string; table: string } }
) {
  const { schema, table } = params
  const { id, ...updates } = await req.json()

  const { error } = await supabase
    .from(`${schema}.${table}`)
    .update(updates)
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ message: 'Dato actualizado correctamente' })
}

export async function DELETE (
  req: NextRequest,
  { params }: { params: { schema: string; table: string } }
) {
  const { schema, table } = params
  const { id } = await req.json()

  const { error } = await supabase
    .from(`${schema}.${table}`)
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ message: 'Dato eliminado correctamente' })
}
