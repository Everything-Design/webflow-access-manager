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
