import test from 'node:test'
import assert from 'node:assert/strict'
import { installNavigationLoading } from '../web/src/utils/navigationLoading.js'

function harness() {
  const hooks = {}, states = []
  const router = Object.fromEntries(['beforeEach', 'afterEach', 'onError'].map(name => [name, callback => {
    hooks[name] = callback
    return () => { delete hooks[name] }
  }]))
  const dispose = installNavigationLoading(router, state => states.push(state))
  return { hooks, states, dispose }
}

test('navigation loading finishes on success and aborted navigation', () => {
  const { hooks, states } = harness()
  for (const failure of [undefined, new Error('aborted')]) {
    const to = { path: '/armor' }
    hooks.beforeEach(to)
    assert.equal(states.at(-1).pending, true)
    hooks.afterEach(to, {}, failure)
    assert.deepEqual(states.at(-1), { pending: false, error: false })
  }
})

test('an older navigation cannot dismiss or fail a newer navigation', () => {
  const { hooks, states } = harness()
  const old = { path: '/armor' }, next = { path: '/weapons' }
  hooks.beforeEach(old)
  hooks.beforeEach(next)
  hooks.afterEach(old, {}, new Error('cancelled'))
  hooks.onError(new Error('old chunk failed'), old)
  assert.deepEqual(states.at(-1), { pending: true, error: false })
  hooks.afterEach(next)
  assert.deepEqual(states.at(-1), { pending: false, error: false })
})

test('chunk failures stop loading and a new navigation clears the error', () => {
  const { hooks, states, dispose } = harness()
  const to = { path: '/weapons' }
  hooks.beforeEach(to)
  hooks.onError(new Error('chunk unavailable'), to)
  assert.deepEqual(states.at(-1), { pending: false, error: true })
  hooks.beforeEach({ path: '/' })
  assert.deepEqual(states.at(-1), { pending: true, error: false })
  dispose()
  assert.deepEqual(hooks, {})
})
