#!/usr/bin/env node
/**
 * Valida artefatos PWA após `vite build`.
 * Falha se manifest ou service worker não existirem em dist/.
 */
import { existsSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

const distDir = resolve(process.cwd(), 'dist')

if (!existsSync(distDir)) {
  console.error('assert-pwa-artifacts: pasta dist/ não encontrada')
  process.exit(1)
}

const manifest = resolve(distDir, 'manifest.webmanifest')
if (!existsSync(manifest)) {
  console.error('assert-pwa-artifacts: manifest.webmanifest ausente')
  process.exit(1)
}

const files = readdirSync(distDir)
const hasSw = files.some(
  (name) =>
    name === 'sw.js' ||
    name === 'service-worker.js' ||
    /^workbox-.*\.js$/.test(name) ||
    (name.endsWith('.js') && name.includes('sw')),
)

// vite-plugin-pwa generateSW emite sw.js + workbox-*.js
const hasSwJs = files.includes('sw.js')
const hasWorkbox = files.some((name) => name.startsWith('workbox-'))

if (!hasSwJs && !hasSw) {
  console.error('assert-pwa-artifacts: service worker (sw.js) ausente em dist/')
  console.error('arquivos:', files.join(', '))
  process.exit(1)
}

if (!hasWorkbox && !hasSwJs) {
  console.error('assert-pwa-artifacts: workbox runtime ausente')
  process.exit(1)
}

console.log('assert-pwa-artifacts: OK (manifest + sw.js)')
