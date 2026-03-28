#!/usr/bin/env node
/**
 * Desarrollo consumiendo rootsy-feparts desde el repo hermano (../rootsy-feparts).
 *
 * 1) Compila la librería (Rollup → dist/).
 * 2) Si la resolución de "rootsy-feparts" no apunta al repo hermano, ejecuta npm install ../rootsy-feparts
 *    (actualiza package.json y package-lock; para volver al registry: npm i rootsy-feparts@^0.7.0).
 * 3) Arranca Next con turbopack.
 *
 * Monorepo recomendado: en la raíz Rootsy, package.json con "workspaces" y npm install desde ahí;
 * entonces el paso 2 no suele hacer falta.
 *
 * Saltar el enlace: SKIP_FEPARTS_LINK=1 npm run dev:local-lib
 */

import { spawnSync } from 'node:child_process'
import { existsSync, realpathSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const coreRoot = path.resolve(__dirname, '..')
const fepartsRoot = path.resolve(coreRoot, '../rootsy-feparts')
const requireFromCore = createRequire(path.join(coreRoot, 'package.json'))

function run(cmd, args, cwd) {
  const r = spawnSync(cmd, args, { cwd, stdio: 'inherit', shell: true })
  if (r.status !== 0 && r.status !== null) process.exit(r.status)
  if (r.error) throw r.error
}

function resolvesToLocalFeparts() {
  let pkgJson
  try {
    pkgJson = requireFromCore.resolve('rootsy-feparts/package.json')
  } catch {
    return false
  }
  try {
    const resolved = realpathSync(path.dirname(pkgJson))
    const target = path.resolve(fepartsRoot)
    return resolved === target || resolved.startsWith(target + path.sep)
  } catch {
    return false
  }
}

const fepartsPkg = path.join(fepartsRoot, 'package.json')
if (!existsSync(fepartsPkg)) {
  console.error(
    '[dev:local-lib] No existe rootsy-feparts en:',
    fepartsRoot,
    '\n  Esperado: Rootsy/rootsy-feparts junto a Rootsy/rootsy-core'
  )
  process.exit(1)
}

console.log('[dev:local-lib] Compilando rootsy-feparts…')
run('npm', ['run', 'build'], fepartsRoot)

const distMain = path.join(fepartsRoot, 'dist', 'index.js')
if (!existsSync(distMain)) {
  console.error('[dev:local-lib] No se generó dist/ tras el build. Revisá el build de rootsy-feparts.')
  process.exit(1)
}

const skipLink = process.env.SKIP_FEPARTS_LINK === '1' || process.env.SKIP_FEPARTS_LINK === 'true'
if (!skipLink && !resolvesToLocalFeparts()) {
  console.log(
    '[dev:local-lib] Enlazando rootsy-feparts local (npm install ../rootsy-feparts)…\n' +
      '  Para volver a la versión publicada: npm install rootsy-feparts@^0.7.0\n' +
      '  Para omitir este paso: SKIP_FEPARTS_LINK=1 npm run dev:local-lib\n'
  )
  run('npm', ['install', '../rootsy-feparts'], coreRoot)
}

console.log('[dev:local-lib] next dev --turbopack')
run('npx', ['next', 'dev', '--turbopack'], coreRoot)
