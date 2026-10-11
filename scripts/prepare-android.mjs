import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
const {ANDROID_KEY_BASE64,ANDROID_KEY_PASSWORD,RUNNER_TEMP}=process.env;
if(!ANDROID_KEY_BASE64||!ANDROID_KEY_PASSWORD||!RUNNER_TEMP)throw new Error('Assinatura Android não configurada.');
const keyPath=join(RUNNER_TEMP,'catarse-release.jks');
await writeFile(keyPath,Buffer.from(ANDROID_KEY_BASE64,'base64'),{mode:0o600});
const path='src-tauri/gen/android/app/build.gradle.kts';
const source=await readFile(path,'utf8');
if(source.includes('CATARSE_RELEASE_SIGNING'))throw new Error('Assinatura já configurada.');
await writeFile(path,source+`
// CATARSE_RELEASE_SIGNING: secrets stay in the runner environment.
android {
    signingConfigs {
        create("catarseRelease") {
            storeFile = file(System.getenv("RUNNER_TEMP") + "/catarse-release.jks")
            storePassword = System.getenv("ANDROID_KEY_PASSWORD")
            keyAlias = "catarse"
            keyPassword = System.getenv("ANDROID_KEY_PASSWORD")
        }
    }
    buildTypes.getByName("release") { signingConfig = signingConfigs.getByName("catarseRelease") }
}
`);
// A private financial app should never enter Android's cloud backup system.
const manifest='src-tauri/gen/android/app/src/main/AndroidManifest.xml';
let xml=await readFile(manifest,'utf8');
xml=xml.replace(/android:allowBackup="[^"]*"/,'android:allowBackup="false"');
await writeFile(manifest,xml);
