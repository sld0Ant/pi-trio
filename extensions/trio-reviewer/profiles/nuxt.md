You are reviewing a Nuxt 3 fullstack application. Apply Vue 3 Composition API rules alongside Nuxt-specific patterns.

## Nuxt Directory Structure

- [ ] Pages in `pages/`, components in `components/`, composables in `composables/`, server in `server/`
- [ ] No manual imports of auto-imported composables (`useState`, `useFetch`, `useRoute`, etc.)
- [ ] Server routes follow `server/api/` and `server/routes/` conventions
- [ ] Middleware in `middleware/`, plugins in `plugins/`, layouts in `layouts/`

## Data Fetching

- [ ] Components use `useFetch` or `useAsyncData` for initial data — never raw `$fetch` in setup
- [ ] `$fetch` used only for user-triggered actions (clicks, form submissions)
- [ ] Unique keys provided to `useAsyncData` when the same endpoint is called with different params
- [ ] `await` vs non-await usage is intentional: `await useFetch` blocks navigation, `useLazyFetch` does not
- [ ] `status` checked when using lazy fetching (`v-if="status === 'pending'"`)
- [ ] No duplicate requests — `useFetch` on server serializes data to payload, client reuses it

## SSR Safety

- [ ] No module-level state that leaks between requests (use `useState` instead of top-level `ref`)
- [ ] Composables called only inside valid contexts: `<script setup>`, `setup()`, `defineNuxtPlugin`, `defineNuxtRouteMiddleware`
- [ ] No `window`, `document`, `localStorage` access without `import.meta.client` / `<ClientOnly>` guard
- [ ] No `onMounted`-dependent logic for initial render — use `onNuxtReady` or conditional rendering

## Vue 3 Composition API

- [ ] `<script setup lang="ts">` used — not Options API
- [ ] `ref()` preferred over `reactive()` for state
- [ ] `.value` used correctly in scripts, not in templates
- [ ] `reactive()` objects never destructured without `toRefs()`
- [ ] Computed getters are pure — no side effects, no API calls, no state mutations
- [ ] Composables prefixed with `use`, return plain objects with refs

## Pinia (when used)

- [ ] Stores defined with `defineStore` using composition syntax (`setup` function)
- [ ] No direct state mutation from components — use actions
- [ ] `storeToRefs()` used when destructuring store state/getters
- [ ] Store state not leaked between SSR requests (use Pinia's SSR-safe patterns)

## UnoCSS / Styling (when used)

- [ ] Utility classes consistent with project's UnoCSS config
- [ ] No conflicting utility + custom CSS for the same property
- [ ] Responsive breakpoints used correctly (mobile-first)
- [ ] Dark mode implemented via CSS variables or UnoCSS dark: variant

## VueUse (when used)

- [ ] VueUse composables preferred over custom implementations for common patterns
- [ ] SSR-safe composables used — no browser-only VueUse functions in SSR context without guards

## Routing

- [ ] Dynamic routes use `[param]` syntax in file names
- [ ] Navigation guards use `defineNuxtRouteMiddleware`, not raw Vue Router guards
- [ ] Route params watched for changes (same-route navigation doesn't re-trigger lifecycle)
- [ ] `navigateTo()` used instead of `router.push()` for Nuxt-aware navigation

## Performance

- [ ] Heavy components wrapped in `<LazyComponentName>` (auto-prefixed by Nuxt)
- [ ] Images use `<NuxtImg>` or `<NuxtPicture>` when Nuxt Image is available
- [ ] No unnecessary watchers — computed properties preferred for derived state
- [ ] `shallowRef` used for large non-deep-reactive objects
