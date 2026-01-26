#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "Starting CI checks..."

echo "Running Linting..."
pnpm run lint

echo "Running Format Check..."
pnpm run fmt

echo "Running Type Check..."
pnpm run build

echo "Running Unit Tests..."
pnpm run test run

echo "Running iOS Rust Build Check..."
cargo build --manifest-path src-tauri/Cargo.toml --target aarch64-apple-ios

echo "All CI checks passed!"
