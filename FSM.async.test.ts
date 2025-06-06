import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import FSM from './dist/FSM.js'

const wait = (ms: number): Promise<void> => new Promise(r => setTimeout(r, ms))

describe('FSM async behaviour', () => {
  it('awaits async handlers and returns value from enter', async () => {
    const calls: string[] = []
    const fsm = new FSM({
      initial: 'one',
      states: {
        one: {
          async enter() { calls.push('enter1'); return 'one' },
          async exit() { await wait(5); calls.push('exit1') },
          async update() { calls.push('update1') },
          on: { go: 'two' }
        },
        two: {
          async enter() { calls.push('enter2'); return 'two' }
        }
      }
    })

    await fsm.update()
    const ret = await fsm.act('go')
    assert.strictEqual(ret, 'two')
    assert.deepStrictEqual(calls, ['enter1', 'update1', 'exit1', 'enter2'])
  })

  it('falls back to action name as state key', async () => {
    const states = {
      a: {},
      b: {}
    }
    const fsm = new FSM({
      initial: 'a',
      states
    })
    await fsm.act('b')
    assert.strictEqual(fsm.current, states.b)
  })
}) 