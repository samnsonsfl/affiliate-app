plugins {
  id("com.android.application")
  kotlin("android")
}

android {
  namespace = "com.appsunited.app"
  compileSdk = 34

  defaultConfig {
    applicationId = "com.appsunited.app"
    minSdk = 26
    targetSdk = 34
    versionCode = 1
    versionName = "1.0"
    vectorDrawables.useSupportLibrary = true
  }

  buildTypes {
    release {
      isMinifyEnabled = true
      proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
    }
    debug {
      isMinifyEnabled = false
    }
  }

  buildFeatures {
    viewBinding = true
  }

  packaging {
    resources.excludes.add("META-INF/*")
  }
}

dependencies {
  implementation("androidx.core:core-ktx:1.13.1")
  implementation("androidx.appcompat:appcompat:1.7.0")
  implementation("com.google.android.material:material:1.12.0")
  implementation("androidx.activity:activity-ktx:1.9.2")
  implementation("androidx.fragment:fragment-ktx:1.8.3")
}
