import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import FSM from './FSM'

describe('FSM construction and helpers', () => {
  it('throws when no states are provided', () => {
    assert.throws(
      () => new FSM({ initial: 'nowhere', states: {}, context: {} }),
      /StateMachine requires at least one state definition/
    )
  })

  it('rejects empty or undefined actions in act()', async () => {
    const fsm = new FSM({ initial: 'idle', states: { idle: {} }, context: {} })

    await assert.rejects(() => fsm.act(''), /Action must be a non‑empty string/)
    await assert.rejects(() => fsm.act(undefined as unknown as string), /Action must be a non‑empty string/)
  })

  it('returns current key or comparison results from state()', () => {
    const fsm = new FSM({ initial: 'ready', states: { ready: {}, go: {} }, context: {} })

    assert.strictEqual(fsm.state(), 'ready')
    assert.strictEqual(fsm.state('ready'), true)
    assert.strictEqual(fsm.state('go'), false)
  })
})
