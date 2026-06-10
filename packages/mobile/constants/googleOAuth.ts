// Google OAuth client IDs.
//
// Source of truth: Google Cloud Console — Credentials page for the webflow-team-login project.
//   https://console.cloud.google.com/apis/credentials?project=webflow-team-login
//
// You need ONE OAuth 2.0 client per target. Create as many as you ship to:
//   - "Web application" → used by Expo Go and any web build
//   - "iOS" with bundle ID com.everythingflow.wam → used by standalone iOS builds
//   - "Android" with package com.everythingflow.wam + signing SHA-1 → used by standalone Android
//
// `expo-auth-session` picks the right one at runtime based on the platform and runtime
// (Expo Go vs standalone). Empty string disables that runtime.

export const GOOGLE_OAUTH = {
  // For Expo Go on either platform. Generate this in the Cloud Console as "Web application"
  // and add the Expo proxy redirect URI: https://auth.expo.io/@saurabh_es/webflow-access-manager
  webClientId: '',

  // From the existing GoogleService-Info.plist. Standalone iOS builds only — Expo Go
  // ignores this and uses webClientId via the proxy.
  iosClientId: '1069127337276-qr4euta2okj87hl3lg6ej2sqfhgkpj2p.apps.googleusercontent.com',

  // Standalone Android. Create in Cloud Console as "Android" type with:
  //   - Package name: com.everythingflow.wam
  //   - SHA-1: the fingerprint of the keystore EAS will sign with. After your first EAS
  //     build, run `eas credentials` to print the SHA-1 and paste it into the Cloud Console
  //     client.
  androidClientId: '',
}
