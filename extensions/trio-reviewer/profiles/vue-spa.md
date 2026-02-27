You are reviewing a Vue 3 single-page application (no SSR). The project uses Vite as the build tool.

## Vue 3 Composition API

- [ ] `<script setup lang="ts">` used everywhere — not Options API
- [ ] `ref()` preferred over `reactive()` for state
- [ ] `.value` used correctly in scripts, never in templates
- [ ] `reactive()` objects never destructured without `toRefs()`
- [ ] Computed getters are pure — no side effects, no API calls, no state mutations
- [ ] Composables prefixed with `use`, return plain objects with refs (not reactive objects)
- [ ] `shallowRef` used for large objects where deep reactivity is unnecessary

## Props & Events

- [ ] `defineProps` with TypeScript type syntax, not runtime validation
- [ ] `defineEmits` with typed event signatures
- [ ] `defineModel` used for v-model bindings (Vue 3.4+)
- [ ] No prop drilling — `provide`/`inject` or Pinia for deeply nested data

## Vue Router

- [ ] Routes defined with proper TypeScript typing
- [ ] Navigation guards use `async`/`await` correctly, not deprecated `next()` callback
- [ ] Route param changes handled — components watching `route.params` or using `:key="route.fullPath"`
- [ ] Event listeners and subscriptions cleaned up on `onUnmounted` / route leave
- [ ] No infinite redirect loops in navigation guards
- [ ] `beforeRouteEnter` not used with `this` (no component instance in that guard)

## Pinia State Management

- [ ] Stores use composition syntax (`setup` function style)
- [ ] `storeToRefs()` used when destructuring store state/getters
- [ ] Actions for state mutations — no direct store state modification from components
- [ ] Stores don't import each other circularly

## VueUse (when used)

- [ ] VueUse composables preferred over custom implementations for common patterns
- [ ] Composable cleanup handled automatically (VueUse auto-disposes on unmount)

## Vite Configuration

- [ ] `vite.config.ts` used (TypeScript, not JS)
- [ ] Aliases configured (`@/` → `src/`)
- [ ] Environment variables accessed via `import.meta.env`, prefixed with `VITE_`
- [ ] No secrets in `VITE_` env vars — they're exposed to the client
- [ ] Proxy configured for API calls in dev (`server.proxy`)

## Component Patterns

- [ ] Single responsibility — one component, one concern
- [ ] PascalCase for component file names and usage
- [ ] `<template>` → `<script setup>` → `<style scoped>` order in SFCs
- [ ] Scoped styles used — no unintended global CSS leaks
- [ ] `<Transition>` and `<TransitionGroup>` used for animations, not manual class toggling
- [ ] `<Suspense>` wraps async components when needed

## Performance

- [ ] Lazy-loaded routes with `() => import('./views/...')`
- [ ] Heavy components use `defineAsyncComponent`
- [ ] `v-once` for static content that never changes
- [ ] `v-memo` for expensive list renderings
- [ ] No unnecessary watchers — computed preferred for derived state
- [ ] Large lists use virtual scrolling
