---
description: how to run ci checks locally to ensure code quality and prevent breakages
---

// turbo-all
to ensure that your changes do not break the software, you should run the local ci checks:

1. run the verification script:
```bash
chmod +x scripts/ci-check.sh
./scripts/ci-check.sh
```

this script runs:
- **linting**: `pnpm run lint` (using biome)
- **formatting**: `pnpm run fmt` (using biome)
- **type checking**: `pnpm run build` (using vue-tsc)
- **unit tests**: `pnpm run test run` (using vitest)
- **ios rust build**: checking rust compilation for ios target

### optional slow checks

if you want to run the full suite including e2e tests and full tauri builds:

- **e2e tests**: `pnpm run test:e2e` (requires playwright browsers installed)
- **full tauri build**: `pnpm tauri build`
