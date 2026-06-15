const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')
const fs = require('fs')

const projectRoot = __dirname

// On EAS Build, shared-vendor/ is bundled inside the project — no watchFolders needed.
// In local dev, ../shared/src is OUTSIDE the project — needs watchFolders for hot reload.
const bundledShared = path.resolve(projectRoot, 'shared-vendor')
const liveShared = path.resolve(projectRoot, '../shared/src')
const usingBundled = fs.existsSync(bundledShared)
const sharedRoot = usingBundled ? bundledShared : liveShared
const sharedEntry = path.join(sharedRoot, 'index.ts')

console.log('[metro.config] @wam/shared resolves to:', sharedRoot, '(bundled:', usingBundled, ')')

const config = getDefaultConfig(projectRoot)

// Only watch shared in dev mode (when it's outside the project)
if (!usingBundled) {
  config.watchFolders = [sharedRoot]
}

// Tell Metro to ALWAYS look in mobile's own node_modules and the workspace root's
// node_modules — regardless of where the importing file lives. Without this, files
// inside packages/shared/src/ (outside the mobile project) can't resolve their deps
// (firebase, zustand) because Metro's default node walk-up from those source paths
// doesn't pass through mobile/node_modules.
//
// Keep the default hierarchical lookup enabled — Metro will still walk up from the
// importing file as a fallback, which is what we want for any odd transitive dep.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(projectRoot, '../../node_modules'),
]

const upstreamResolveRequest = config.resolver.resolveRequest
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@wam/shared') {
    return { type: 'sourceFile', filePath: sharedEntry }
  }
  if (moduleName.startsWith('@wam/shared/')) {
    const sub = moduleName.slice('@wam/shared/'.length)
    return { type: 'sourceFile', filePath: path.join(sharedRoot, sub) }
  }
  if (upstreamResolveRequest) {
    return upstreamResolveRequest(context, moduleName, platform)
  }
  return context.resolveRequest(context, moduleName, platform)
}

module.exports = config
