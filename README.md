# @felipemadson/envdoctor

Deterministic Local Development Environment Validator & Health Probe CLI.

## Overview
`@felipemadson/envdoctor` is an autonomous developer tool designed to provide deterministic, pre-flight diagnostics of local development workstations and CI runner environments. It eliminates "works on my machine" discrepancies by validating required toolchains, TCP port availability, and `.env` configuration variables before local services start.

## Features & Diagnostics
- **Runtime Version Verification**: Inspects installed CLI runtimes (Node.js, Docker, Python) against semantic version constraints with explicit remediation suggestions.
- **TCP Port Conflict Inspector**: Scans configured ports and identifies collisions before bind operations fail.
- **Zero-Leak Secret Validation**: Enforces `.env` presence and structural schema constraints via Zod while strictly masking secret values in outputs and telemetry.
- **High-Fidelity Terminal Renderer**: Features an ANSI double-buffering canvas, VT100 sequence parser, and emoji width calculation for clean CLI output.
- **Resilience & Fuzzing**: Validated with a 1,000-iteration invariant fuzzing test suite ensuring zero unhandled exceptions under memory pressure.

## Verified CLI Usage
```bash
# Execute unit and invariant test suite (16 tests)
npm test

# Verify strict TypeScript compilation
npm run typecheck

# Initialize a new manifest in current directory
node --experimental-strip-types src/cli.ts init

# Run deterministic environment validation against env.manifest.json
node --experimental-strip-types src/cli.ts check
```

## Architecture & Layering
- `src/core/engine.ts`: Diagnostic engine orchestrating concurrent inspector execution in under 2 seconds.
- `src/inspectors/`: Modular inspectors for runtimes, TCP ports, environment variables, and external services.
- `src/renderers/cli-renderer.ts`: Low-overhead terminal rendering canvas with cursor interpolation and diffing.
- `src/types.ts`: Type-safe Zod schemas for runtime, port, and environment variable contracts.

## Technical Limitations
- Requires Node.js >= 22 with `--experimental-strip-types` enabled for direct TypeScript CLI execution.
- Port inspection is localized to the host operating system network namespace.
