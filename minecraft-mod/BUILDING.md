# Building the Digital Twins Minecraft Mod

## Prerequisites

1. **Java Development Kit (JDK) 17 or higher**
   - Download from: https://adoptium.net/
   - Verify: `java -version`

2. **Gradle** (included via wrapper)
   - No need to install separately

## Quick Build

```bash
cd minecraft-mod
./gradlew build
```

The JAR file will be in: `build/libs/digitaltwins-1.0.0.jar`

## Development Setup

### 1. Import into IntelliJ IDEA

1. Open IntelliJ IDEA
2. File → Open → Select `minecraft-mod` directory
3. IDEA will automatically import as a Gradle project
4. Wait for Gradle sync to complete

### 2. Run Minecraft Client (for testing)

```bash
./gradlew runClient
```

This launches Minecraft with your mod loaded.

### 3. Hot Reload (during development)

```bash
./gradlew build
```

Then restart Minecraft.

## Building for Distribution

### Production Build

```bash
./gradlew clean build
```

### Optimized JAR

The build process automatically:
- Includes all dependencies (OkHttp, Gson, Kotlin coroutines)
- Creates a single JAR file
- Minifies and optimizes

## Installation

1. Build the mod (see above)
2. Locate `build/libs/digitaltwins-1.0.0.jar`
3. Copy to `.minecraft/mods/` folder
4. Ensure Fabric Loader and required mods are installed

## Required Mods (for users)

Users need these mods installed:
1. **Fabric Loader** - https://fabricmc.net/use/
2. **Fabric API** - https://modrinth.com/mod/fabric-api
3. **Fabric Language Kotlin** - https://modrinth.com/mod/fabric-language-kotlin

## Troubleshooting

### Build Fails

**Error: "Could not resolve dependencies"**
- Check internet connection
- Run: `./gradlew clean build --refresh-dependencies`

**Error: "Java version mismatch"**
- Ensure JDK 17+ is installed
- Set JAVA_HOME environment variable

### Runtime Errors

**"Mod not loading"**
- Check Fabric Loader version (need 0.15.0+)
- Install Fabric API
- Install Fabric Language Kotlin

**"ClassNotFoundException"**
- Dependencies not included - rebuild with `./gradlew build`

## Testing the Mod

### 1. Test Import Command

In Minecraft chat:
```
/twinimport https://yourapp.com/api/minecraft/export/your-user-id
```

Expected: "✓ Loaded twin: YourName"

### 2. Test Spawn Command

```
/twinspawn YourName
```

Expected: Armor stand appears at your location

### 3. Test Chat Command

```
/twin YourName Hey, what's your favorite food?
```

Expected (after 3-5 seconds): Response in chat

## Advanced Configuration

### Change Minecraft Version

Edit `build.gradle.kts`:
```kotlin
minecraft("com.mojang:minecraft:1.20.1") // Change version here
```

### Add More Dependencies

Edit `build.gradle.kts` dependencies section:
```kotlin
implementation("your-dependency:here:1.0.0")
include("your-dependency:here:1.0.0") // Important!
```

## Publishing

### To CurseForge/Modrinth

1. Build the mod
2. Test thoroughly
3. Upload `build/libs/digitaltwins-1.0.0.jar`
4. Add dependencies in mod listing:
   - Fabric API (required)
   - Fabric Language Kotlin (required)

### Version Number

Edit `build.gradle.kts`:
```kotlin
version = "1.0.0" // Update here
```

## Common Commands

```bash
# Clean build
./gradlew clean

# Build only
./gradlew build

# Run client
./gradlew runClient

# Run server
./gradlew runServer

# Generate IntelliJ files
./gradlew idea

# Refresh dependencies
./gradlew --refresh-dependencies
```

## Support

For issues:
1. Check logs in `.minecraft/logs/latest.log`
2. Enable debug mode: Add `-Ddigitaltwins.debug=true` to JVM args
3. Report bugs with log files

## License

MIT License - See main repository
