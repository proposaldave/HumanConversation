import { execFileSync } from 'node:child_process'
import {
  appendFileSync,
  chmodSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { basename, dirname, join, relative, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const root = resolve(scriptDir, '..')
const dist = join(root, 'dist')
const tempBase = resolve(process.env.PUBLISH_TMP_DIR || join(tmpdir(), 'humanconversation-publish'))
const publicRepo = process.env.PUBLIC_REPO || 'proposaldave/HumanConversation'
const backupRepo = process.env.BACKUP_REPO || 'proposaldave/HumanConversation-private-backups'
const cname = process.env.PAGES_CNAME || 'humanconversation.com'
const backupOnly = process.argv.includes('--backup-only')

function commandParts(command, args) {
  if (process.platform === 'win32' && command === 'npm') {
    return {
      command: process.env.ComSpec || 'cmd.exe',
      args: ['/d', '/s', '/c', 'npm', ...args],
    }
  }

  return { command, args }
}

function run(command, args, options = {}) {
  const parts = commandParts(command, args)
  execFileSync(parts.command, parts.args, {
    cwd: options.cwd || root,
    stdio: options.stdio || 'inherit',
  })
}

function capture(command, args, options = {}) {
  const parts = commandParts(command, args)
  return execFileSync(parts.command, parts.args, {
    cwd: options.cwd || root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim()
}

function tryRun(command, args, options = {}) {
  try {
    run(command, args, { ...options, stdio: options.stdio || 'pipe' })
    return true
  } catch {
    return false
  }
}

function tryCapture(command, args, options = {}) {
  try {
    return capture(command, args, options)
  } catch {
    return ''
  }
}

function assertInside(child, parent) {
  const childPath = resolve(child)
  const parentPath = resolve(parent)
  const rel = relative(parentPath, childPath)
  if (rel.startsWith('..') || rel === '' || rel.includes(`..${process.platform === 'win32' ? '\\' : '/'}`)) {
    throw new Error(`Refusing path outside expected folder: ${childPath}`)
  }
}

function makeTempDir(prefix) {
  const base = resolve(tempBase)
  mkdirSync(base, { recursive: true })
  const dir = mkdtempSync(join(base, prefix))
  assertInside(dir, base)
  return dir
}

function allowRemoval(path) {
  try {
    chmodSync(path, 0o666)
  } catch {
    // Some Windows metadata files cannot be chmodded; rmSync force still handles most of them.
  }
}

function removeTree(path) {
  if (!existsSync(path)) return

  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const entryPath = join(path, entry.name)
    if (entry.isDirectory()) {
      removeTree(entryPath)
    } else {
      allowRemoval(entryPath)
    }
  }

  allowRemoval(path)
  rmSync(path, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 })
}

function removeDesktopIni(dir) {
  if (!existsSync(dir)) return

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      removeDesktopIni(path)
    } else if (entry.name.toLowerCase() === 'desktop.ini') {
      allowRemoval(path)
      rmSync(path, { force: true })
    }
  }
}

function copyIfExists(from, to) {
  if (!existsSync(from)) return

  const stats = statSync(from)
  if (stats.isDirectory()) {
    cpSync(from, to, {
      recursive: true,
      filter: (source) => {
        const name = basename(source).toLowerCase()
        return name !== 'node_modules' && name !== 'dist' && name !== '.git' && name !== 'desktop.ini'
      },
    })
  } else {
    mkdirSync(dirname(to), { recursive: true })
    cpSync(from, to)
  }
}

function ensureDistIsDeployable() {
  if (!existsSync(dist)) throw new Error('dist does not exist. Build failed before deploy.')

  removeDesktopIni(dist)

  const cnamePath = join(dist, 'CNAME')
  if (!existsSync(cnamePath)) throw new Error('dist/CNAME is missing. Refusing to deploy without custom domain.')

  const distCname = readFileSync(cnamePath, 'utf8').trim()
  if (distCname !== cname) {
    throw new Error(`dist/CNAME is ${distCname}, expected ${cname}`)
  }
}

function checkBackupRepoPrivacy() {
  const isPrivate = tryCapture('gh', ['repo', 'view', backupRepo, '--json', 'isPrivate', '--jq', '.isPrivate'])
  if (isPrivate !== 'true') {
    console.warn(`backup_privacy_check=skipped repo=${backupRepo}`)
    return
  }

  console.log(`backup_privacy_check=verified repo=${backupRepo}`)
}

function createPrivateBackup() {
  const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\.\d{3}Z$/, 'Z')
  const sourceCommit = capture('git', ['rev-parse', '--short', 'HEAD'])
  const sourceStatus = capture('git', ['status', '--short'])
  const backupClone = makeTempDir('humanconversation-private-backups-')
  const backupUrl = `https://github.com/${backupRepo}.git`

  run('git', ['clone', backupUrl, backupClone])
  run('git', ['config', 'user.name', 'Codex'], { cwd: backupClone })
  run('git', ['config', 'user.email', 'codex@openai.com'], { cwd: backupClone })

  const hasMain = capture('git', ['ls-remote', '--heads', 'origin', 'main'], { cwd: backupClone })
  if (hasMain) {
    run('git', ['checkout', '-B', 'main', 'origin/main'], { cwd: backupClone })
  } else {
    run('git', ['checkout', '-B', 'main'], { cwd: backupClone })
  }

  const versionId = `${timestamp}-${sourceCommit}`
  const snapshotDir = join(backupClone, 'snapshots', versionId)
  const sourceDir = join(snapshotDir, 'source')
  const buildDir = join(snapshotDir, 'dist')

  mkdirSync(sourceDir, { recursive: true })
  cpSync(dist, buildDir, { recursive: true })

  for (const entry of [
    'index.html',
    'README.md',
    'package.json',
    'package-lock.json',
    'vite.config.ts',
    'tailwind.config.js',
    'postcss.config.js',
    'tsconfig.json',
    'tsconfig.app.json',
    'tsconfig.node.json',
    '.gitignore',
    '.oxlintrc.json',
    'public',
    'scripts',
    'src',
  ]) {
    copyIfExists(join(root, entry), join(sourceDir, entry))
  }

  const manifest = {
    versionId,
    createdAt: new Date().toISOString(),
    sourceRepo: publicRepo,
    sourceCommit,
    sourceStatus: sourceStatus || 'clean',
    publicDomain: cname,
    publicBuildPath: 'dist',
    sourcePath: 'source',
    note: 'Private HumanConversation.com landing page snapshot created before GitHub Pages deploy.',
  }

  writeFileSync(join(snapshotDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
  writeFileSync(join(backupClone, 'LATEST.txt'), `${versionId}\n`)
  appendFileSync(join(backupClone, 'versions.jsonl'), `${JSON.stringify(manifest)}\n`)

  const backupReadme = join(backupClone, 'README.md')
  if (!existsSync(backupReadme)) {
    writeFileSync(
      backupReadme,
      [
        '# Human Conversation Private Backups',
        '',
        'Private snapshots of HumanConversation.com landing page versions.',
        '',
        '- `snapshots/` contains one timestamped folder per published version.',
        '- Each snapshot includes the built `dist` output and the source files used to create it.',
        '- `LATEST.txt` points to the newest snapshot.',
        '- `versions.jsonl` is an append-only version log.',
        '',
      ].join('\n'),
    )
  }

  run('git', ['add', '.'], { cwd: backupClone })
  run('git', ['commit', '-m', `Backup landing page ${versionId}`], { cwd: backupClone })
  run('git', ['push', '-u', 'origin', 'main'], { cwd: backupClone })

  removeTree(backupClone)
  return versionId
}

function copyDirectoryContents(from, to) {
  for (const entry of readdirSync(from)) {
    cpSync(join(from, entry), join(to, entry), { recursive: true })
  }
}

function deployPages() {
  const localHead = capture('git', ['rev-parse', 'HEAD'])
  const remoteMain = capture('git', ['ls-remote', 'origin', 'refs/heads/main']).split(/\s+/)[0]
  if (localHead !== remoteMain) {
    throw new Error('Refusing to deploy: push the current main commit before running publish:pages.')
  }

  const pagesSettingsUpdated = tryRun('gh', [
    'api',
    '--method',
    'PUT',
    `repos/${publicRepo}/pages`,
    '-f',
    'build_type=legacy',
    '-f',
    `cname=${cname}`,
    '-f',
    'source[branch]=gh-pages',
    '-f',
    'source[path]=/',
  ])

  console.log(`pages_settings_update=${pagesSettingsUpdated ? 'legacy-branch' : 'skipped'}`)

  const deployClone = makeTempDir('humanconversation-gh-pages-')
  const publicUrl = `https://github.com/${publicRepo}.git`
  const hasGhPages = tryCapture('git', ['ls-remote', '--heads', publicUrl, 'gh-pages'])

  if (hasGhPages) {
    run('git', ['clone', '--branch', 'gh-pages', '--single-branch', publicUrl, deployClone])
  } else {
    run('git', ['clone', publicUrl, deployClone])
    run('git', ['checkout', '--orphan', 'gh-pages'], { cwd: deployClone })
  }

  run('git', ['config', 'user.name', 'Codex'], { cwd: deployClone })
  run('git', ['config', 'user.email', 'codex@openai.com'], { cwd: deployClone })

  tryRun('git', ['rm', '-r', '-q', '.'], { cwd: deployClone })
  copyDirectoryContents(dist, deployClone)
  removeDesktopIni(deployClone)

  const deployedCname = readFileSync(join(deployClone, 'CNAME'), 'utf8').trim()
  if (deployedCname !== cname) {
    throw new Error(`Deploy CNAME is ${deployedCname}, expected ${cname}`)
  }

  run('git', ['add', '.'], { cwd: deployClone })

  const deployStatus = capture('git', ['status', '--short'], { cwd: deployClone })
  if (!deployStatus) {
    const deployedHead = capture('git', ['rev-parse', '--short', 'HEAD'], { cwd: deployClone })
    console.log('gh_pages_status=unchanged')
    removeTree(deployClone)
    return deployedHead
  }

  run('git', ['commit', '-m', 'Deploy landing page'], { cwd: deployClone })
  run('git', ['push', 'origin', 'gh-pages'], { cwd: deployClone })

  const deployedHead = capture('git', ['rev-parse', '--short', 'HEAD'], { cwd: deployClone })
  console.log('gh_pages_status=pushed')
  removeTree(deployClone)
  return deployedHead
}

run('npm', ['run', 'lint'])
run('npm', ['run', 'build:pages'])
ensureDistIsDeployable()
checkBackupRepoPrivacy()

const backupVersion = createPrivateBackup()
let deployCommit = 'backup-only'

if (!backupOnly) {
  deployCommit = deployPages()
}

console.log(`private_backup=${backupRepo}/snapshots/${backupVersion}`)
console.log(`deploy_commit=${deployCommit}`)
