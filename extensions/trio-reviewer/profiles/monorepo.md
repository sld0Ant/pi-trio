You are reviewing a JavaScript/TypeScript monorepo. Focus on workspace structure, dependency management, task pipelines, and package boundaries.

## pnpm Workspaces

- [ ] `pnpm-workspace.yaml` defines workspace packages correctly
- [ ] Shared dependencies use `workspace:*` protocol for inter-package references
- [ ] No phantom dependencies — every import has a corresponding entry in package.json
- [ ] `.npmrc` configured with `strict-peer-dependencies` and appropriate settings
- [ ] `--frozen-lockfile` used in CI scripts
- [ ] Catalogs used for shared dependency versions across packages (`pnpm-workspace.yaml` catalogs)

## Turborepo Task Pipelines

- [ ] Tasks defined in each package's `package.json` — NOT as root-level scripts
- [ ] Root `package.json` only delegates via `turbo run <task>`
- [ ] `turbo.json` tasks declare correct `dependsOn` (e.g., `build` depends on `^build`)
- [ ] Task `outputs` configured for caching (`dist/**`, `.next/**`, etc.)
- [ ] `turbo run` (not `turbo`) used in package.json scripts and CI
- [ ] Environment variables listed in `turbo.json` `env` / `globalEnv` for cache correctness
- [ ] No Root Tasks (`//#taskname`) unless absolutely necessary

## Package Boundaries

- [ ] Each package has a clear single responsibility
- [ ] No circular dependencies between packages
- [ ] Internal packages use `"private": true`
- [ ] Public packages have proper `exports` field in package.json
- [ ] Types exported from each package — consumers don't reach into `src/`
- [ ] Shared types/utils in a dedicated `packages/shared` or `packages/types` package

## Build & Bundle (tsdown / Vite)

- [ ] Each package builds independently (`turbo run build` works from any package)
- [ ] Build output goes to `dist/` (configured in `outputs` for caching)
- [ ] TypeScript `references` or `paths` configured for cross-package imports in dev
- [ ] `tsconfig.json` uses `extends` from a shared base config
- [ ] Source maps generated for debuggability

## Testing (Vitest)

- [ ] Each package has its own test setup or uses a shared vitest workspace
- [ ] `vitest.workspace.ts` at root if using Vitest workspaces
- [ ] Tests run per-package via `turbo run test`
- [ ] Coverage collected per-package and aggregated in CI
- [ ] Integration tests in a separate package or workspace

## CI / CD

- [ ] `--affected` or `--filter` used to run only changed packages
- [ ] Remote caching enabled (Turborepo remote cache or Vercel)
- [ ] Lockfile changes trigger full rebuild
- [ ] Package publishing uses changesets or similar versioning tool

## Dependency Management

- [ ] pnpm `overrides` used sparingly and documented
- [ ] `peerDependencies` declared for framework deps in library packages
- [ ] No duplicate versions of the same package across workspace (check with `pnpm why`)
- [ ] Patches (`pnpm patch`) documented with rationale
