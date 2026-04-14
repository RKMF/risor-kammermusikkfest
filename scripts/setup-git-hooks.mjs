import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

const repoRoot = process.cwd()
const hooksDir = resolve(repoRoot, '.githooks')

if (!existsSync(hooksDir)) {
  process.exit(0)
}

try {
  execFileSync('git', ['rev-parse', '--git-dir'], {
    cwd: repoRoot,
    stdio: 'ignore',
  })

  execFileSync('git', ['config', 'core.hooksPath', '.githooks'], {
    cwd: repoRoot,
    stdio: 'ignore',
  })

  console.log('Git hooks path configured to .githooks')
} catch {
  // Skip hook setup when git is unavailable or the directory is not a git checkout.
}
