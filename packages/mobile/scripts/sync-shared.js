// Sync packages/shared/src into packages/mobile/_shared so EAS Build can bundle it.
// EAS only uploads files inside the mobile package directory; this brings the shared code in.
const fs = require('node:fs')
const path = require('node:path')

const projectRoot = path.resolve(__dirname, '..')
const src = path.resolve(projectRoot, '../shared/src')
const dest = path.resolve(projectRoot, 'shared-vendor')

function copyRecursive(srcPath, destPath) {
  const stat = fs.statSync(srcPath)
  if (stat.isDirectory()) {
    fs.mkdirSync(destPath, { recursive: true })
    for (const child of fs.readdirSync(srcPath)) {
      copyRecursive(path.join(srcPath, child), path.join(destPath, child))
    }
  } else {
    fs.copyFileSync(srcPath, destPath)
  }
}

if (fs.existsSync(dest)) {
  fs.rmSync(dest, { recursive: true, force: true })
}

if (!fs.existsSync(src)) {
  console.error(`[sync-shared] Source not found: ${src}`)
  process.exit(1)
}

copyRecursive(src, dest)

// Add a minimal package.json so Metro can resolve `@wam/shared` as a package
fs.writeFileSync(
  path.join(dest, 'package.json'),
  JSON.stringify({ name: '@wam/shared', main: 'index.ts', types: 'index.ts' }, null, 2)
)

console.log(`[sync-shared] Copied ${src} → ${dest}`)
