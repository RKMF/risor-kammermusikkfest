import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(scriptDir, '..')
const studioNodeModules = path.join(repoRoot, 'studio', 'node_modules')

const scopes = ['@codemirror', '@lezer', '@sanity']

function ensureScopedLink(scope) {
  const source = path.join(repoRoot, 'node_modules', scope)
  const target = path.join(studioNodeModules, scope)

  if (!fs.existsSync(source)) {
    return
  }

  if (fs.existsSync(target)) {
    const stats = fs.lstatSync(target)

    if (stats.isSymbolicLink()) {
      const currentTarget = fs.readlinkSync(target)
      const resolvedTarget = path.resolve(path.dirname(target), currentTarget)
      if (resolvedTarget === source) {
        return
      }
      fs.unlinkSync(target)
    } else if (stats.isDirectory()) {
      const entries = fs.readdirSync(target)
      if (entries.length > 0) {
        return
      }
      fs.rmdirSync(target)
    } else {
      return
    }
  }

  fs.symlinkSync(source, target, 'dir')
}

fs.mkdirSync(studioNodeModules, {recursive: true})

for (const scope of scopes) {
  ensureScopedLink(scope)
}
