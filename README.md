# Reproduction

This is the initial app created by `create-expo-app` plus `expo-sqlite` and a
`./assets/database.db` file. The index screen reads that database which is
pre-populated with a single tab and a couple of records just to be sure the
database loads.

The app is configured **to exclude the database file when building an OTA update**.

## Issue being reproduced

All of this can load fine both in local development against local
emulators/simulators. It loads fine when native builds are created and installed
on physical devices.

However, when building an OTA update and excluding the database file, Android
will fail to install the update.