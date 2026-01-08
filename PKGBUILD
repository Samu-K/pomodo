# Maintainer: Samu-K <https://github.com/Samu-K>
pkgname=pomodo
pkgver=0.1.0
pkgrel=1
pkgdesc="A cross-platform Pomodoro timer for Desktop"
arch=('x86_64' 'aarch64')
url="https://github.com/Samu-K/pomodo"
license=('custom:FSL-1.1-MIT')
depends=('webkit2gtk-4.1' 'libappindicator3-dev' 'librsvg')
makedepends=('nodejs' 'pnpm' 'rust' 'cargo')
source=("$pkgname-$pkgver.tar.gz::https://github.com/Samu-K/pomodo/archive/refs/tags/v$pkgver.tar.gz")
sha256sums=('SKIP') # To be updated during release or by the user

build() {
  cd "$pkgname-$pkgver"
  pnpm install
  pnpm tauri build --bundle deb # We use the deb bundle as a base if needed, or just build the binary
}

package() {
  cd "$pkgname-$pkgver"
  # Install the binary
  install -Dm755 "src-tauri/target/release/pomodo" "$pkgdir/usr/bin/pomodo"
  
  # Install icons
  install -Dm644 "src-tauri/icons/128x128.png" "$pkgdir/usr/share/icons/hicolor/128x128/apps/pomodo.png"
  
  # Install desktop file (assuming one exists or we create a simple one)
  # For now, we rely on the user or a future enhancement to add a .desktop file
}
