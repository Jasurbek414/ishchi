# Flutter engine and generated plugin registrant.
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.**  { *; }
-keep class io.flutter.util.**  { *; }
-keep class io.flutter.view.**  { *; }
-keep class io.flutter.**  { *; }
-keep class io.flutter.plugins.**  { *; }
-dontwarn io.flutter.embedding.**

# Flutter's deferred-components support references Play Core classes that
# aren't bundled unless the app actually uses split installs — suppress the
# resulting "missing class" warnings from R8 rather than pulling in the dep.
-dontwarn com.google.android.play.core.**

# Firebase / Play Services use reflection and annotations at runtime.
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes SourceFile,LineNumberTable

# flutter_local_notifications registers a broadcast receiver/service by name
# in AndroidManifest.xml; R8 must not rename or strip them.
-keep class com.dexterous.** { *; }

# Keep default no-arg constructors on model-like classes so JSON encode/decode
# via dart:convert reflection-free codegen (none used today) keeps working
# if introduced later; harmless no-op otherwise.
-keepclassmembers class * {
    public <init>();
}
