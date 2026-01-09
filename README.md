# Pomodo

A cross-platform Pomodoro timer for Desktop, Android, and iOS.

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![License](https://img.shields.io/badge/license-FSL--1.1--MIT-blue)
![Build](https://github.com/Samu-K/pomodo/actions/workflows/ci.yml/badge.svg)

## Features

- **Pomodoro Timer** - Configurable focus and break sessions with long break intervals
- **Task & Project Management** - Organize focus sessions by tasks and projects
- **Statistics** - Weekly overview with focus heatmaps, streaks, and total focus hours
- **Mini Mode** - Compact always-on-top window for unobtrusive focus tracking
- **Theme Support** - Light and dark mode with system preference detection

## Screenshots

![Timer Screen](.github/pics/timer_screen.png)

## Download

### Mobile

| Platform | Link |
|----------|------|
| iOS | [App Store](#) *(coming soon)* |
| Android | [Google Play](#) *(coming soon)* |

### Desktop

| Platform | Format | Link |
|----------|--------|------|
| Windows | `.exe` / `.msi` | [Latest Release](https://github.com/Samu-K/pomodo/releases/latest) |
| macOS | `.dmg` / `.app` | [Latest Release](https://github.com/Samu-K/pomodo/releases/latest) |
| Linux (Ubuntu/Debian) | `.deb` | [Latest Release](https://github.com/Samu-K/pomodo/releases/latest) |
| Linux (Generic) | `.AppImage` | [Latest Release](https://github.com/Samu-K/pomodo/releases/latest) |
| Linux (Arch) | `PKGBUILD` | [See Building from Source](#building-from-source) |

---

## Building from Source (Arch Linux)

1. Clone the repository: `git clone https://github.com/Samu-K/pomodo.git`
2. Navigate to the directory: `cd pomodo`
3. Build and install using the provided `PKGBUILD`: `makepkg -si`

For other platforms, follow the [Tauri development guide](https://tauri.app/v2/start/prerequisites/).

## Support

Having issues? Found a bug?

- [Report an issue](https://github.com/Samu-K/pomodo/issues)
- [Contact support](mailto:support@kasame.net)

## Privacy

Pomodo works entirely offline by default—all data stays on your device. If you choose to create an account, you can enable cloud sync to back up your data and access it across devices. No account is required to use the app.

## License

FSL-1.1-MIT. See [LICENSE.md](LICENSE.md) for details.
