import { execFileSync } from 'node:child_process'
import {
  appendFileSync,
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
import { tmpdir } from 'node:os'
import { basename, dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const root = resolve(scriptDir, '..')
const dist = join(root, 'dist')
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

function assertInside(child, parent) {
  const childPath = resolve(child)
  const parentPath = resolve(parent)
  const rel = relative(parentPath, childPath)
  if (rel.startsWith('..') || rel === '' || rel.includes(`..${process.platform === 'win32' ? '\\' : '/'}`)) {
    throw new Error(`Refusing path outside expected folder: ${childPath}`)
  }
}

function makeTempDir(prefix) {
  const base = resolve(tmpdir())
  const dir = mkdtempSync(join(base, prefix))
  assertInside(dir, base)
  return dir
}

function removeDesktopIni(dir) {
  if (!existsSync(dir)) return

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      removeDesktopIni(path)
    } else if (entry.name.toLowerCase() === 'desktop.ini') {
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

function ensureBackupRepoIsPrivate() {
  const isPrivate = capture('gh', ['repo', 'view', backupRepo, '--json', 'isPrivate', '--jq', '.isPrivate'])
  if (isPrivate !== 'true') {
    throw new Error(`Backup repo ${backupRepo} is not private. Refusing to write private snapshots.`)
  }
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

  rmSync(backupClone, { recursive: true, force: true })
  return versionId
}

function deployPages() {
  const deployDir = makeTempDir('humanconversation-gh-pages-')

  cpSync(dist, deployDir, { recursive: true })
  removeDesktopIni(deployDir)

  if (!existsSync(join(deployDir, 'CNAME'))) {
    throw new Error('Deploy bundle is missing CNAME.')
  }

  run('git', ['init', '--initial-branch=gh-pages'], { cwd: deployDir })
  run('git', ['config', 'user.name', 'Codex'], { cwd: deployDir })
  run('git', ['config', 'user.email', 'codex@openai.com'], { cwd: deployDir })
  run('git', ['add', '.'], { cwd: deployDir })
  run('git', ['commit', '-m', 'Deploy landing page'], { cwd: deployDir })
  run('git', ['remote', 'add', 'origin', `https://github.com/${publicRepo}.git`], { cwd: deployDir })
  run('git', ['push', '--force', 'origin', 'gh-pages'], { cwd: deployDir })

  const deployCommit = capture('git', ['rev-parse', '--short', 'HEAD'], { cwd: deployDir })

  run('gh', [
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

  rmSync(deployDir, { recursive: true, force: true })
  return deployCommit
}

run('npm', ['run', 'lint'])
run('npm', ['run', 'build:pages'])
ensureDistIsDeployable()
ensureBackupRepoIsPrivate()

const backupVersion = createPrivateBackup()
let deployCommit = 'backup-only'

if (!backupOnly) {
  deployCommit = deployPages()
}

console.log(`private_backup=${backupRepo}/snapshots/${backupVersion}`)
console.log(`deploy_commit=${deployCommit}`)
