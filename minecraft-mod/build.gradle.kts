plugins {
    kotlin("jvm") version "1.9.0"
    id("fabric-loom") version "1.5-SNAPSHOT"
    id("maven-publish")
}

version = "1.0.0"
group = "com.digitaltwins"

repositories {
    mavenCentral()
}

dependencies {
    // Minecraft & Fabric
    minecraft("com.mojang:minecraft:1.20.1")
    mappings("net.fabricmc:yarn:1.20.1+build.10:v2")
    modImplementation("net.fabricmc:fabric-loader:0.15.0")
    modImplementation("net.fabricmc.fabric-api:fabric-api:0.92.0+1.20.1")
    modImplementation("net.fabricmc:fabric-language-kotlin:1.10.0+kotlin.1.9.0")

    // HTTP Client
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    include("com.squareup.okhttp3:okhttp:4.12.0")
    include("com.squareup.okio:okio:3.6.0")
    include("com.squareup.okio:okio-jvm:3.6.0")
    include("org.jetbrains.kotlin:kotlin-stdlib:1.9.0")

    // JSON Parsing
    implementation("com.google.code.gson:gson:2.10.1")
    include("com.google.code.gson:gson:2.10.1")

    // Coroutines for async operations
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")
    include("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")

    // Audio playback support for voice
    implementation("com.googlecode.soundlibs:mp3spi:1.9.5.4")
    include("com.googlecode.soundlibs:mp3spi:1.9.5.4")
    implementation("com.googlecode.soundlibs:jlayer:1.0.1.4")
    include("com.googlecode.soundlibs:jlayer:1.0.1.4")
}

tasks {
    processResources {
        inputs.property("version", project.version)

        filesMatching("fabric.mod.json") {
            expand("version" to project.version)
        }
    }

    jar {
        from("LICENSE")
    }

    compileKotlin {
        kotlinOptions.jvmTarget = "17"
    }
}

java {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
}
