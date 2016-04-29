A guide to getting the Rocket R60V app running in your emulator.

# Getting the APK

First, install the [R60V app](https://play.google.com/store/apps/details?id=com.gicar.Rocket_R60V)
on a real Android device.  Connect that Android device to your computer and enable USB debugging.

Now let's snag that APK so we can put it into the emulator. From http://stackoverflow.com/a/11013175:

```console
$ adb shell pm list packages | grep -i rocket
package:com.gicar.Rocket_R60V

$ adb shell pm path com.gicar.Rocket_R60V
package:/data/app/com.gicar.Rocket_R60V-1/base.apk

$ adb pull /data/app/com.gicar.Rocket_R60V-1/base.apk r60v1.apk
2546 KB/s (660791 bytes in 0.253s)

$ file r60v1.apk
r60v1.apk: Zip archive data, at least v2.0 to extract
```

# Intercepting app traffic

## Decompile to Smali

Install `apktool` from https://github.com/iBotPeaches/Apktool (available on Homebrew)

```console
$ apktool decode -o src.apktool r60v1.apk
```

## Edit source

According to https://developer.android.com/tools/help/emulator.html#networkaddresses,
the network on the emulator uses `10.0.2.2` as a "Special alias to your host loopback interface
(i.e., 127.0.0.1 on your development machine)"

So let's replace the app's hardcoded references to `192.168.1.1` within the decompiled code:

```console
$ find src.apktool -type f | xargs grep 192.168.1.1
src.apktool/smali/wifi/WiFi$ConnectedThread.smali:    const-string v7, "192.168.1.1"
```

So open that file and replace `"192.168.1.1"` with `"10.0.2.2"` and save your changes.

### Other customizations

* Edit `src.apktool/res/values/strings.xml` and change `app_name` to `r60v hax`

## Recompile APK

Now let's build the APK back up:

```console
 $ apktool build -o r60v1-emulator.apk src.apktool
```

If we try to install the APK right now we will get an error:

```console
$ adb install r60v1-emulator.apk
15668 KB/s (654923 bytes in 0.040s)
	pkg: /data/local/tmp/r60v1-emulator.apk
Failure [INSTALL_PARSE_FAILED_NO_CERTIFICATES]
```

We need to sign the APK first.  From http://developer.android.com/tools/publishing/app-signing.html#signing-manually

```console
$ mkdir -p keys
$ keytool -genkey -v -keystore keys/local.keystore -alias local -keyalg RSA -keysize 2048 -validity 10000
```

(enter `aaaaaa` as the password, and use the defaults for the other questions).  Now we
can sign the JAR using this key:

```console
$ jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore keys/local.keystore r60v1-emulator.apk local
```

Fire up the emulator in another terminal window (TODO: Describe how to set up the image in the first place).
For my purposes I used an Android Lollipop (5.1) image running on an emulated Nexus 6P.  The Rocket Espresso
app seems to crash when running on Marshmallow (6.0) and higher, maybe due to Android's gradual permissions model.

```console
$ $ANDROID_HOME/tools/emulator @n6p-android5_1
```

Now install the APK onto the emulator:

```console
$ adb install r60v1-emulator.apk
```

It should now appear in the list of installed apps

## Spy on traffic

Now, our app will be trying to connect to port 1774 on the emulator's host machine (if you wish
to change that, it has to be updated in the Smali code, where it's encoded as hex 0x6ee).

We will forward that traffic from the emulator to the espresso machine.

Connect your computer to the `RocketEspresso` wifi network (password is `RocketR60V`).

To dump traffic, run `node lib/server/proxy.js 1774 192.168.1.1:1774` (you may need to run `npm run compile` first).
Fire up the app in the emulator and it should be able to connect to the machine (you may need to disconnect and then reconnect).
