# Reproduction

This is the initial app created by `create-expo-app` plus `expo-sqlite` and a
`./assets/database.db` file. The index screen reads that database which is
pre-populated with a single tab and a couple of records just to be sure the
database loads. The goal is to produce an OTA bundle that does not include
`./assets/database.db` due to it's (potential) size.

The app is configured **to exclude the database file when building an OTA update** using the following configuration in `app.json`:

```json
"extra": {
  "updates": {
    "assetPatternsToBeBundled": [
      "**/*.png",
      "**/*.ttf"
    ]
  }
}
```

## Issue being reproduced

All of this can load fine both in local development against local
emulators/simulators. It loads fine when native builds are created and installed
on physical devices.

The `database.db` file is excluded from OTA updates

However, when building an OTA update and excluding the database file, Android
will fail to install the update.

## Steps to reproduce with existing builds

1. A working build (1.0.0) can be installed to android from [this EAS build](https://expo.dev/accounts/jcarpenter1/projects/expo-ota-exclusion-repro/builds/640daeaf-f688-45f0-9e45-8bc11fd8c614). This build will not have an OTA available.

    Note that this version loads and the Welcome screen displays the 1.0.0 version (using version-1.0.0 runtime) and that the two "foos" in the database load correctly (IDs 1 and 2).

2. A second build (1.1.0) can be installed from [this EAS build](https://expo.dev/accounts/jcarpenter1/projects/expo-ota-exclusion-repro/builds/dcb6c53c-e2fa-405f-bff7-1e72a0fd4d0c). This build has an OTA (1.1.1) available that will download on launch.

    This build will initially install and open successfully. Close it and re-open to attempt to install the OTA update. The update will hang and be stuck on the splash screen. You can use `adb logcat` while the device/emulator is connected for debugging to view logs from the device.

Logs produced from my device area available in `logs.log` with the interesting failures starting at 07-30 13:57:51.188 (line 1233):

```
07-30 13:57:51.188 32724 32765 E ReactNativeJS: Error: Call to function 'ExpoAsset.downloadAsync' has been rejected.
07-30 13:57:51.188 32724 32765 E ReactNativeJS: → Caused by: Unable to download asset from url:
07-30 13:57:51.188 32724 32765 E ReactNativeJS:
07-30 13:57:51.188 32724 32765 E ReactNativeJS: This error is located at:
07-30 13:57:51.188 32724 32765 E ReactNativeJS:     in SQLiteProviderNonSuspense
07-30 13:57:51.188 32724 32765 E ReactNativeJS:     in SQLiteProvider
07-30 13:57:51.188 32724 32765 E ReactNativeJS:     in ThemeProvider
07-30 13:57:51.188 32724 32765 E ReactNativeJS:     in RootLayout
07-30 13:57:51.188 32724 32765 E ReactNativeJS:     in Unknown
07-30 13:57:51.188 32724 32765 E ReactNativeJS:     in Suspense
07-30 13:57:51.188 32724 32765 E ReactNativeJS:     in Route
07-30 13:57:51.188 32724 32765 E ReactNativeJS:     in Unknown
07-30 13:57:51.188 32724 32765 E ReactNativeJS:     in RNCSafeAreaProvider
07-30 13:57:51.188 32724 32765 E ReactNativeJS:     in SafeAreaProvider
07-30 13:57:51.188 32724 32765 E ReactNativeJS:     in wrapper
07-30 13:57:51.188 32724 32765 E ReactNativeJS:     in EnsureSingleNavigator
07-30 13:57:51.188 32724 32765 E ReactNativeJS:     in BaseNavigationContainer
07-30 13:57:51.188 32724 32765 E ReactNativeJS:     in ThemeProvider
07-30 13:57:51.188 32724 32765 E ReactNativeJS:     in NavigationContainerInner
07-30 13:57:51.188 32724 32765 E ReactNativeJS:     in ContextNavigator
07-30 13:57:51.188 32724 32765 E ReactNativeJS:     in ExpoRoot
07-30 13:57:51.188 32724 32765 E ReactNativeJS:     in App
07-30 13:57:51.188 32724 32765 E ReactNativeJS:     in RCTView
07-30 13:57:51.188 32724 32765 E ReactNativeJS:     in Unknown
07-30 13:57:51.188 32724 32765 E ReactNativeJS:     in AppContainer, js engine: hermes
```

## Steps to reproduce with your own builds

### Create a clean 1.0.0 build

1. Update `app.json` to reset config

    ```json
    "version": "1.0.0",
    "updates": {
      "url": "https://u.expo.dev/<clear for now>",
      "enabled": true,
      "checkAutomatically": "ON_LOAD"
    },
    "runtimeVersion": "version-1.0.0",
    "ios": {
      "bundleIdentifier": "<delete this line>"
    },
    "android": {
      "package": "<delete this line>"
    },
    "eas": {}
    ```

2. Configure EAS for builds

    ```bash
    npx eas-cli@latest build:configure
    ```

3. Update `app.json` using your EAS project ID

    ```json
    "updates": {
      "url": "https://u.expo.dev/<your project id>",
      "enabled": true,
      "checkAutomatically": "ON_LOAD"
    },
    "eas": {
      "projectId": "<your project id>"
    }
    ```

4. Ensure `eas.json` is using `main` as the branch

    ```json
    {
      "cli": {
        "version": ">= 10.2.1"
      },
      "build": {
        "development": {
          "developmentClient": true,
          "distribution": "internal"
        },
        "preview": {
          "distribution": "internal",
          "channel": "main"
        },
        "production": {}
      },
      "submit": {
        "production": {}
      }
    }
    ```

5. Build the 1.0.0 app

    ```bash
    npx eas-cli@latest build -e preview -p android
    ```

### Create a clean 1.1.0 build

1. Update `app.json` to increment the versions

    ```json
    "version": "1.1.0",
    "runtimeVersion": "version-1.1.0"
    ```

2. Build the 1.1.0 app

    ```bash
    npx eas-cli@latest build -e preview -p android
    ```

### Create an OTA excluding `database.db` for 1.1.1

1. Delete the `database.db` file from the `assets` directory and create an empty file to prevent the bundler failing

    ```bash
    rm assets/database.db
    touch assets/database.db
    ```

2. Update `app.json` to increment the versions

    ```json
    "version": "1.1.1",
    ```

3. Generate the OTA update

    ```bash
    npx eas-cli@latest update -m "Update that should cause Android to crash" -p all -b main
    ```

## Additional info

### The OTA bundle should produce the following output, showing that `database.db` is not included:

```
> npx eas-cli@latest update -m "Update that should cause Android to crash" -p all --branch main


[expo-cli] Starting Metro Bundler
[expo-cli]
[expo-cli] iOS Bundled 7245ms node_modules/expo-router/entry.js (984 modules)
[expo-cli]
[expo-cli] Android Bundled 8872ms node_modules/expo-router/entry.js (1017 modules)
[expo-cli] Processing asset bundle patterns:
[expo-cli] - /.../expo-ota-exclusion-repro/**/*.png
[expo-cli] - /.../expo-ota-exclusion-repro/**/*.ttf
[expo-cli] Creating asset map
[expo-cli] Preparing additional debugging files
[expo-cli]
[expo-cli] Exporting 21 assets:
[expo-cli] assets/fonts/SpaceMono-Regular.ttf (93.3 kB)
[expo-cli] assets/images/partial-react-logo.png (5.08 kB)
[expo-cli] assets/images/react-logo.png (3 variations | 13.9 kB)
[expo-cli] node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf (443 kB)
[expo-cli] node_modules/@react-navigation/elements/src/assets/back-icon-mask.png (913 B)
[expo-cli] node_modules/@react-navigation/elements/src/assets/back-icon.png (10 variations | 338 B)
[expo-cli] node_modules/expo-router/assets/error.png (516 B)
[expo-cli] node_modules/expo-router/assets/file.png (158 B)
[expo-cli] node_modules/expo-router/assets/forward.png (250 B)
[expo-cli] node_modules/expo-router/assets/pkg.png (429 B)
[expo-cli]
[expo-cli] Exporting 2 bundles for ios:
[expo-cli] _expo/static/js/ios/entry-83d77c8bae5e76a0ff6c4e2916041f38.hbc (1.84 MB)
[expo-cli] _expo/static/js/ios/entry-83d77c8bae5e76a0ff6c4e2916041f38.hbc.map (6.15 MB)
[expo-cli]
[expo-cli] Exporting 2 bundles for android:
[expo-cli] _expo/static/js/android/entry-a762c09efca8c4dd05daa43487f273db.hbc (1.84 MB)
[expo-cli] _expo/static/js/android/entry-a762c09efca8c4dd05daa43487f273db.hbc.map (6.15 MB)
[expo-cli] Exporting 3 files:
[expo-cli] assetmap.json (7.68 kB)
[expo-cli] debug.html (390 B)
[expo-cli] metadata.json (2.26 kB)
[expo-cli]
[expo-cli] App exported to: dist
✔ Exported bundle(s)
✔ Uploaded 2 app bundles
✔ Uploading assets skipped - no new assets found
ℹ 17 iOS assets, 17 Android assets (maximum: 2000 total per update). Learn more about asset limits: https://expo.fyi/eas-update-asset-limits
✔ Published!
```

### EAS Update metadata

```json
{
  "updatesByGroup": [
    {
      "manifestFragment": {
        "extra": {
          "expoClient": {
            "ios": {
              "supportsTablet": true,
              "bundleIdentifier": "com.jcarpenter1.expo-ota-exclusion-repro"
            },
            "icon": "./assets/images/icon.png",
            "name": "expo-ota-exclusion-repro",
            "slug": "expo-ota-exclusion-repro",
            "extra": {
              "eas": {
                "projectId": "335ae85f-3cd7-4599-93f1-09a71ee5c0dd"
              },
              "router": {
                "origin": false
              },
              "updates": {
                "assetPatternsToBeBundled": [
                  "**/*.png",
                  "**/*.ttf"
                ]
              }
            },
            "scheme": "myapp",
            "splash": {
              "image": "./assets/images/splash.png",
              "resizeMode": "contain",
              "backgroundColor": "#ffffff"
            },
            "android": {
              "package": "com.jcarpenter1.expootaexclusionrepro",
              "adaptiveIcon": {
                "backgroundColor": "#ffffff",
                "foregroundImage": "./assets/images/adaptive-icon.png"
              }
            },
            "plugins": [
              "expo-router"
            ],
            "updates": {
              "url": "https://u.expo.dev/335ae85f-3cd7-4599-93f1-09a71ee5c0dd",
              "enabled": true,
              "checkAutomatically": "ON_LOAD"
            },
            "version": "1.1.1",
            "platforms": [
              "ios",
              "android"
            ],
            "sdkVersion": "51.0.0",
            "experiments": {
              "typedRoutes": true
            },
            "orientation": "portrait",
            "runtimeVersion": "version-1.1.0",
            "userInterfaceStyle": "automatic"
          }
        },
        "assets": [
          {
            "bundleKey": "7d40544b395c5949f4646f5e150fe020",
            "fileSHA256": "LN_rjlzN55dvcBL7jM5zryIpAp7iHU8VCf7RFIccbNg",
            "storageKey": "Pi65ns2w9xLI5G_m9aGrJ5wK5FpWcGcInSSFwnA_0aA",
            "contentType": "image/png",
            "fileExtension": ".png"
          },
          {
            "bundleKey": "cdd04e13d4ec83ff0cd13ec8dabdc341",
            "fileSHA256": "irHji01LPI9giDYxtJo9bTPHaEHzuUcCMTlb4xn90Ks",
            "storageKey": "oJZ9JX1m8IKNDgnIqcKOo5KUFOoa_NCaxruigZu65E0",
            "contentType": "image/png",
            "fileExtension": ".png"
          },
          {
            "bundleKey": "a132ecc4ba5c1517ff83c0fb321bc7fc",
            "fileSHA256": "K3RDqaWOksoRpXW9wRWYYVpX3eMFzYznDWAmBrMCzZg",
            "storageKey": "X3OAkUu5P_LqyKFx1bNkA_qDQFLlSjCYNAlVEaOamHE",
            "contentType": "image/png",
            "fileExtension": ".png"
          },
          {
            "bundleKey": "0ea69b5077e7c4696db85dbcba75b0e1",
            "fileSHA256": "Pd0Hc-0n4j0leJ8wFzGzrEVa2L5aonoKG4OPicbSciU",
            "storageKey": "FwJkAbrRNahBGX1KXnTAgiiwyzENu3D7DeEzCwmInyo",
            "contentType": "image/png",
            "fileExtension": ".png"
          },
          {
            "bundleKey": "f5b790e2ac193b3d41015edb3551f9b8",
            "fileSHA256": "vCfIss7SLYKt1AAi0hxjsgOMEDceLJB6ZWjQf6gTU4k",
            "storageKey": "GQtYm7r0G9N3WJyrymjZ26p8eNMIb7rzqwSVgGco5EU",
            "contentType": "image/png",
            "fileExtension": ".png"
          },
          {
            "bundleKey": "5223c8d9b0d08b82a5670fb5f71faf78",
            "fileSHA256": "LJXowmdeeZM1_QBGuwfb2gbLfs_1HtN5IsYwnWGcxNM",
            "storageKey": "jeqOrdQBNY4hgl04B3wtGs8QNWMDmjvbjIMUXPtOBpw",
            "contentType": "image/png",
            "fileExtension": ".png"
          },
          {
            "bundleKey": "563d5e3294b67811d0a1aede6f601e30",
            "fileSHA256": "M3Rw55duRh-sGFMCjFkHlEfvd8GivSJoVoQJXvBNFBQ",
            "storageKey": "7_7d3jBClpPmoXQEielu8jAePppiy1F2OHBHTkGWMmk",
            "contentType": "image/png",
            "fileExtension": ".png"
          },
          {
            "bundleKey": "b6c297a501e289394b0bc5dc69c265e6",
            "fileSHA256": "nUUUlHIjdOeMNjvKmhYS7NKv-SWftJkSFV5rriaFsqU",
            "storageKey": "o4sRqX3k15H3xahLLAqorE4Xx7kzQZLneGpbe9YJUKk",
            "contentType": "image/png",
            "fileExtension": ".png"
          },
          {
            "bundleKey": "5974eb3e1c5314e8d5a822702d7d0740",
            "fileSHA256": "rCcPeBVDZeEAZAH3Fdb9k8RII3FIu_PvDqfrDAsjUUQ",
            "storageKey": "ST8599yGpQrl1ZnhZ2myk9XZK0nOlFvsUejYDUtyhiQ",
            "contentType": "image/png",
            "fileExtension": ".png"
          },
          {
            "bundleKey": "9d9c5644f55c2f6e4b7f247c378b2fe9",
            "fileSHA256": "vahwd_zNPKVOz_ZK9r9JovUCDO-kqrkSHLpNktCjAEs",
            "storageKey": "KE0skvJrj-PmTAtmE4eYKhAWzAkyqaxhUXmX7HajKQw",
            "contentType": "image/png",
            "fileExtension": ".png"
          },
          {
            "bundleKey": "6148e7019854f3bde85b633cb88f3c25",
            "fileSHA256": "nH-5BxpsKFgsa4RGjL_yx6ceArF-OjtFSKFZk40ikWs",
            "storageKey": "jdXbRpGkxdrW9JgEjxoV_Wlnli8-gb6Kswc7xqjoAOw",
            "contentType": "font/ttf",
            "fileExtension": ".ttf"
          },
          {
            "bundleKey": "695d5a1c6f29a689130f3aaa573aec6e",
            "fileSHA256": "Ikt2NrFeZygBV5tbQYB3y8LKQvAUY4kGI2Q1aw7LXFw",
            "storageKey": "jwpHAtzlMrZFphvGjcURl5jFwLPa9m2_xL1RMMQMeu4",
            "contentType": "image/png",
            "fileExtension": ".png"
          },
          {
            "bundleKey": "b507e7f2c91ebc8fe24dee79ccb3b600",
            "fileSHA256": "-mAL6a0vhpx6jbr_x4uxWvdBEj4TGclI8L5RdToVPN4",
            "storageKey": "CZ50LIZA3hayPdmkI2HW9rHwTEtUaFN3ozTIJh0BAxg",
            "contentType": "image/png",
            "fileExtension": ".png"
          },
          {
            "bundleKey": "8a4d0e5b845044e56e3b2df627d01cfd",
            "fileSHA256": "zYTgKl1UKj5xt_oQpoXBuftR20r_kqymwNpkYc4XvhY",
            "storageKey": "qihswqWRRwrrgwoqhQRsNYEuq425-5FDf-CTRHzeGWE",
            "contentType": "image/png",
            "fileExtension": ".png"
          },
          {
            "bundleKey": "8f14e478886737f3323a2ac79c833749",
            "fileSHA256": "AVpyrrJMEWYkPrwYU1XJSIzIkvvzqoL5rmaBmhDzRRw",
            "storageKey": "i5QFarZN0OsTXibS2HptCvjnbHqHI2UeieiFFLtYZEc",
            "contentType": "image/png",
            "fileExtension": ".png"
          },
          {
            "bundleKey": "49a79d66bdea2debf1832bf4d7aca127",
            "fileSHA256": "TDIlFNJlBiqj9_vYH1t5ORzLdCaOaiBgAGHgzjMjT0E",
            "storageKey": "dmOaC6Uf95Cn4adL7UKjKsEcVkQ_ma4sXIuHYa9gadQ",
            "contentType": "font/ttf",
            "fileExtension": ".ttf"
          }
        ],
        "launchAsset": {
          "bundleKey": "5ad219f990925897e9f1cd9115d79d3d",
          "fileSHA256": "HowDsoAKBvoqkh0bDXHvt4ZwMrjrmWlQOyCmbWrNB30",
          "storageKey": "ep_AO1zb3jWSP3GMPS6hNEniGM_olJ4KWSbd8pLXPdE",
          "contentType": "application/javascript",
          "fileExtension": ".bundle"
        }
      },
      "branch": {
        "id": "8fa272c4-0e94-4e56-b65f-22cc095d483e",
        "name": "main"
      },
      "id": "74ac5479-554f-453b-ab95-5bc116d4a30e",
      "actor": {
        "id": "0ade3b3b-9725-4630-b27e-36b313f216f8",
        "displayName": "jcarpenter1",
        "profilePhoto": "https://s.gravatar.com/avatar/7503083f20bf0a6d494781c55086f2ed?s=480&r=pg&d=https%3A%2F%2Fstorage.googleapis.com%2Fexpo-website-default-avatars%2Fj-2x.png",
        "fullName": "Jake  Carpenter ",
        "username": "jcarpenter1",
        "bestContactEmail": "jake@jakecarpenter.dev"
      },
      "group": "8fd44101-40c3-483d-b027-31b946db5b9f",
      "message": "Update that should cause Android to crash",
      "createdAt": "2024-07-30T19:56:54.147Z",
      "updatedAt": "2024-07-30T19:56:54.147Z",
      "activityTimestamp": "2024-07-30T19:56:54.147Z",
      "isRollBackToEmbedded": false,
      "codeSigningInfo": null,
      "branchId": "8fa272c4-0e94-4e56-b65f-22cc095d483e",
      "updateRuntimeVersion": "version-1.1.0",
      "updatePlatform": "ios",
      "updateGitCommitHash": "34f01b396726c9309619828829d03320d4834582",
      "updateIsGitWorkingTreeDirty": false
    },
    {
      "manifestFragment": {
        "extra": {
          "expoClient": {
            "ios": {
              "supportsTablet": true,
              "bundleIdentifier": "com.jcarpenter1.expo-ota-exclusion-repro"
            },
            "icon": "./assets/images/icon.png",
            "name": "expo-ota-exclusion-repro",
            "slug": "expo-ota-exclusion-repro",
            "extra": {
              "eas": {
                "projectId": "335ae85f-3cd7-4599-93f1-09a71ee5c0dd"
              },
              "router": {
                "origin": false
              },
              "updates": {
                "assetPatternsToBeBundled": [
                  "**/*.png",
                  "**/*.ttf"
                ]
              }
            },
            "scheme": "myapp",
            "splash": {
              "image": "./assets/images/splash.png",
              "resizeMode": "contain",
              "backgroundColor": "#ffffff"
            },
            "android": {
              "package": "com.jcarpenter1.expootaexclusionrepro",
              "adaptiveIcon": {
                "backgroundColor": "#ffffff",
                "foregroundImage": "./assets/images/adaptive-icon.png"
              }
            },
            "plugins": [
              "expo-router"
            ],
            "updates": {
              "url": "https://u.expo.dev/335ae85f-3cd7-4599-93f1-09a71ee5c0dd",
              "enabled": true,
              "checkAutomatically": "ON_LOAD"
            },
            "version": "1.1.1",
            "platforms": [
              "ios",
              "android"
            ],
            "sdkVersion": "51.0.0",
            "experiments": {
              "typedRoutes": true
            },
            "orientation": "portrait",
            "runtimeVersion": "version-1.1.0",
            "userInterfaceStyle": "automatic"
          }
        },
        "assets": [
          {
            "bundleKey": "778ffc9fe8773a878e9c30a6304784de",
            "fileSHA256": "i2Gkx-9w3JJ1PwSUl2SC9m_UFQ7CPfx3KrZeEDc6-lU",
            "storageKey": "idnX8z03q4vGLzhYMPaQGBADjhqvWe67_afPqJ1vGzM",
            "contentType": "image/png",
            "fileExtension": ".png"
          },
          {
            "bundleKey": "376d6a4c7f622917c39feb23671ef71d",
            "fileSHA256": "QJsG0VpGM-5viirUgoKq0M4zQ_TYyPfLhAhN5mrM54I",
            "storageKey": "46DQ95-UdSKiRkQgt5FyXkE1FrKOT9tBZP3nS7auKlg",
            "contentType": "image/png",
            "fileExtension": ".png"
          },
          {
            "bundleKey": "c79c3606a1cf168006ad3979763c7e0c",
            "fileSHA256": "kGZm3WiTRq2iMs42ia3vkHtCV_obWT8DY40rlJf2SIQ",
            "storageKey": "k-3xHp3vP8mR36WdccUZVPTRJKpP-zlyboWdkXCIQpQ",
            "contentType": "image/png",
            "fileExtension": ".png"
          },
          {
            "bundleKey": "02bc1fa7c0313217bde2d65ccbff40c9",
            "fileSHA256": "_6fuRbdkBbpzkhSVAI99aMneY5X0tpQdsGNGX244IyA",
            "storageKey": "lfqeUjiWFXwowhxVDBEzxsbTOEzYxMLebljy5Bh1mpU",
            "contentType": "image/png",
            "fileExtension": ".png"
          },
          {
            "bundleKey": "35ba0eaec5a4f5ed12ca16fabeae451d",
            "fileSHA256": "hM9es7ICUPaeDkczvrTaX0F_BoKJKlrRteYlcHU8IbE",
            "storageKey": "fMoMrsUeB5xWw_Ugn8FqGJf-M2pld2hkXKR704z0MM8",
            "contentType": "image/png",
            "fileExtension": ".png"
          },
          {
            "bundleKey": "5223c8d9b0d08b82a5670fb5f71faf78",
            "fileSHA256": "LJXowmdeeZM1_QBGuwfb2gbLfs_1HtN5IsYwnWGcxNM",
            "storageKey": "jeqOrdQBNY4hgl04B3wtGs8QNWMDmjvbjIMUXPtOBpw",
            "contentType": "image/png",
            "fileExtension": ".png"
          },
          {
            "bundleKey": "563d5e3294b67811d0a1aede6f601e30",
            "fileSHA256": "M3Rw55duRh-sGFMCjFkHlEfvd8GivSJoVoQJXvBNFBQ",
            "storageKey": "7_7d3jBClpPmoXQEielu8jAePppiy1F2OHBHTkGWMmk",
            "contentType": "image/png",
            "fileExtension": ".png"
          },
          {
            "bundleKey": "b6c297a501e289394b0bc5dc69c265e6",
            "fileSHA256": "nUUUlHIjdOeMNjvKmhYS7NKv-SWftJkSFV5rriaFsqU",
            "storageKey": "o4sRqX3k15H3xahLLAqorE4Xx7kzQZLneGpbe9YJUKk",
            "contentType": "image/png",
            "fileExtension": ".png"
          },
          {
            "bundleKey": "5974eb3e1c5314e8d5a822702d7d0740",
            "fileSHA256": "rCcPeBVDZeEAZAH3Fdb9k8RII3FIu_PvDqfrDAsjUUQ",
            "storageKey": "ST8599yGpQrl1ZnhZ2myk9XZK0nOlFvsUejYDUtyhiQ",
            "contentType": "image/png",
            "fileExtension": ".png"
          },
          {
            "bundleKey": "9d9c5644f55c2f6e4b7f247c378b2fe9",
            "fileSHA256": "vahwd_zNPKVOz_ZK9r9JovUCDO-kqrkSHLpNktCjAEs",
            "storageKey": "KE0skvJrj-PmTAtmE4eYKhAWzAkyqaxhUXmX7HajKQw",
            "contentType": "image/png",
            "fileExtension": ".png"
          },
          {
            "bundleKey": "6148e7019854f3bde85b633cb88f3c25",
            "fileSHA256": "nH-5BxpsKFgsa4RGjL_yx6ceArF-OjtFSKFZk40ikWs",
            "storageKey": "jdXbRpGkxdrW9JgEjxoV_Wlnli8-gb6Kswc7xqjoAOw",
            "contentType": "font/ttf",
            "fileExtension": ".ttf"
          },
          {
            "bundleKey": "695d5a1c6f29a689130f3aaa573aec6e",
            "fileSHA256": "Ikt2NrFeZygBV5tbQYB3y8LKQvAUY4kGI2Q1aw7LXFw",
            "storageKey": "jwpHAtzlMrZFphvGjcURl5jFwLPa9m2_xL1RMMQMeu4",
            "contentType": "image/png",
            "fileExtension": ".png"
          },
          {
            "bundleKey": "b507e7f2c91ebc8fe24dee79ccb3b600",
            "fileSHA256": "-mAL6a0vhpx6jbr_x4uxWvdBEj4TGclI8L5RdToVPN4",
            "storageKey": "CZ50LIZA3hayPdmkI2HW9rHwTEtUaFN3ozTIJh0BAxg",
            "contentType": "image/png",
            "fileExtension": ".png"
          },
          {
            "bundleKey": "8a4d0e5b845044e56e3b2df627d01cfd",
            "fileSHA256": "zYTgKl1UKj5xt_oQpoXBuftR20r_kqymwNpkYc4XvhY",
            "storageKey": "qihswqWRRwrrgwoqhQRsNYEuq425-5FDf-CTRHzeGWE",
            "contentType": "image/png",
            "fileExtension": ".png"
          },
          {
            "bundleKey": "8f14e478886737f3323a2ac79c833749",
            "fileSHA256": "AVpyrrJMEWYkPrwYU1XJSIzIkvvzqoL5rmaBmhDzRRw",
            "storageKey": "i5QFarZN0OsTXibS2HptCvjnbHqHI2UeieiFFLtYZEc",
            "contentType": "image/png",
            "fileExtension": ".png"
          },
          {
            "bundleKey": "49a79d66bdea2debf1832bf4d7aca127",
            "fileSHA256": "TDIlFNJlBiqj9_vYH1t5ORzLdCaOaiBgAGHgzjMjT0E",
            "storageKey": "dmOaC6Uf95Cn4adL7UKjKsEcVkQ_ma4sXIuHYa9gadQ",
            "contentType": "font/ttf",
            "fileExtension": ".ttf"
          }
        ],
        "launchAsset": {
          "bundleKey": "58bdefcc104dc8ae8facebdd5bd52de5",
          "fileSHA256": "tw4YD0jlmPQhVVOah7ag9-Q894b9PDUxKr5RW5DuN7k",
          "storageKey": "pDXJkVOycExNaHV5yNowh0L1QJ_xCDKvkKB2hsKL_NE",
          "contentType": "application/javascript",
          "fileExtension": ".bundle"
        }
      },
      "branch": {
        "id": "8fa272c4-0e94-4e56-b65f-22cc095d483e",
        "name": "main"
      },
      "id": "0b99f3d5-ce77-4b1a-9331-0ed6135e4cf9",
      "actor": {
        "id": "0ade3b3b-9725-4630-b27e-36b313f216f8",
        "displayName": "jcarpenter1",
        "profilePhoto": "https://s.gravatar.com/avatar/7503083f20bf0a6d494781c55086f2ed?s=480&r=pg&d=https%3A%2F%2Fstorage.googleapis.com%2Fexpo-website-default-avatars%2Fj-2x.png",
        "fullName": "Jake  Carpenter ",
        "username": "jcarpenter1",
        "bestContactEmail": "jake@jakecarpenter.dev"
      },
      "group": "8fd44101-40c3-483d-b027-31b946db5b9f",
      "message": "Update that should cause Android to crash",
      "createdAt": "2024-07-30T19:56:54.147Z",
      "updatedAt": "2024-07-30T19:56:54.147Z",
      "activityTimestamp": "2024-07-30T19:56:54.147Z",
      "isRollBackToEmbedded": false,
      "codeSigningInfo": null,
      "branchId": "8fa272c4-0e94-4e56-b65f-22cc095d483e",
      "updateRuntimeVersion": "version-1.1.0",
      "updatePlatform": "android",
      "updateGitCommitHash": "34f01b396726c9309619828829d03320d4834582",
      "updateIsGitWorkingTreeDirty": false
    }
  ]
}
```