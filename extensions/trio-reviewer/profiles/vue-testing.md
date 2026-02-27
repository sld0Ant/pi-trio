You are reviewing Vue 3 test code. Focus on test quality, patterns, coverage, and correctness of the testing approach.

## Testing Framework (Vitest)

- [ ] `vitest.config.ts` extends Vite config correctly (shared aliases, plugins)
- [ ] Test files co-located with source or in `__tests__/` — consistent convention
- [ ] `describe` blocks group related tests logically
- [ ] Test names describe behavior, not implementation (`"shows error when email is invalid"`, not `"calls validateEmail"`)
- [ ] `beforeEach` / `afterEach` used for setup/teardown, no state leaks between tests

## Component Testing

- [ ] Black-box approach — test what the user sees, not internal state
- [ ] `@vue/test-utils` `mount` used for integration, `shallowMount` for isolation
- [ ] User interactions tested via `trigger('click')`, `setValue()`, not direct state manipulation
- [ ] DOM assertions use `find`/`findAll` with semantic selectors (roles, text, test-ids) — not implementation classes
- [ ] `await nextTick()` or `await flushPromises()` after state changes before assertions
- [ ] No `wrapper.vm` access for assertions — test the rendered output

## Async Testing

- [ ] All async operations properly awaited
- [ ] `flushPromises()` used after promise-based operations
- [ ] Timer-based code tested with `vi.useFakeTimers()` and `vi.advanceTimersByTime()`
- [ ] Network requests mocked — no real HTTP calls in unit tests

## Composable Testing

- [ ] Composables using lifecycle hooks tested via wrapper component pattern:
  ```ts
  function withSetup(composable) {
    let result
    mount(defineComponent({
      setup() { result = composable(); return () => {} }
    }))
    return result
  }
  ```
- [ ] Composables returning refs tested for reactivity (value changes propagate)
- [ ] Cleanup verified — `onScopeDispose` / `onUnmounted` handlers fire

## Pinia Store Testing

- [ ] `createTestingPinia` used — not real Pinia instance
- [ ] Store actions stubbed by default unless integration test
- [ ] Initial state overridden via `createTestingPinia({ initialState })`
- [ ] No `setActivePinia(createPinia())` in component tests — use `createTestingPinia`

## Mocking

- [ ] `vi.mock()` at module level, `vi.fn()` for individual functions
- [ ] Mock implementations minimal — only what the test needs
- [ ] `vi.spyOn()` preferred over full mocks when only observing calls
- [ ] Mocks reset between tests (`vi.restoreAllMocks()` in `afterEach`)
- [ ] API calls mocked at the HTTP layer (MSW or `vi.mock`) — not by replacing composables

## Snapshot Testing

- [ ] Snapshots not the sole assertion — always paired with behavioral checks
- [ ] Snapshot scope is small and focused (component fragment, not full page)
- [ ] Snapshots updated intentionally (`--update`), not blindly accepted

## Async Components & Suspense

- [ ] Async components wrapped in `<Suspense>` in test mount
- [ ] `defineAsyncComponent` tested for loading and error states
- [ ] `<Teleport>` content located via `document.body` or `attachTo` option

## E2E (Playwright, when applicable)

- [ ] E2E tests cover critical user flows, not unit-level checks
- [ ] Page objects or fixtures abstract selectors
- [ ] Tests are isolated — each test starts from a clean state
- [ ] `await expect(locator).toBeVisible()` preferred over `waitForSelector`

## Coverage

- [ ] Coverage configured (V8 or Istanbul)
- [ ] Critical paths have >80% branch coverage
- [ ] Coverage thresholds enforced in CI (not just reported)
