import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import FSM from './FSM.js'

function spy(fn = () => {}) {
  function wrapper(...args) {
    wrapper.calls.push(args)
    return fn(...args)
  }
  wrapper.calls = []
  return wrapper
}

const baseCtx = {
  answer: 42,
  data: [{
    highlight: false,
    active: true,
    warning: -7,
    danger: 0,
    error: 1,
  }]
}

describe('Minimalist FSM', () => {
  let fsm
  let states
  let ctx

  beforeEach(() => {
    ctx = { ...baseCtx, log: spy(), counter: 0 }
    states = {
      idle: {
        enter: spy(c => { c.counter = 0; return 'idle' }),
        update: spy(),
        exit: spy(),
        on: { start: 'running', stop: 'idle' }
      },
      running: {
        enter: spy(c => { c.counter++; return 'run' }),
        update: spy(),
        exit: spy(),
        on: { stop: 'idle', pause: 'paused' }
      },
      paused: {
        enter: spy(c => { c.counter *= 2; return 'pause' }),
        update: spy(),
        exit: spy(),
        on: { resume: 'running', stop: 'idle' }
      }
    }

    fsm = new FSM({ initial: 'idle', states, context: ctx })
  })

  it('starts in the initial state and calls enter(ctx)', () => {
    assert.strictEqual(fsm.current, states.idle)
    assert.strictEqual(states.idle.enter.calls.length, 1)
    const passed = states.idle.enter.calls[0][0]
    assert.notStrictEqual(passed, ctx)
    assert.deepStrictEqual(passed, ctx)
  })

  it('update() forwards (dt, ctx) to state.update', async () => {
    await fsm.update()
    assert.strictEqual(states.idle.update.calls.length, 1)
    const [dt, passedCtx] = states.idle.update.calls[0]
    assert.equal(typeof dt, 'number')
    assert.deepStrictEqual(passedCtx, fsm.context)
  })

  it('transitions idle \u2794 running on "start"', async () => {
    const ret = await fsm.act('start')
    assert.strictEqual(ret, 'run')
    assert.strictEqual(states.idle.exit.calls.length, 1)
    assert.strictEqual(states.running.enter.calls.length, 1)
    assert.strictEqual(fsm.current, states.running)
  })

  it('supports chained transitions (running \u2794 paused)', async () => {
    await fsm.act('start')
    await fsm.act('pause')
    assert.strictEqual(states.running.exit.calls.length, 1)
    assert.strictEqual(states.paused.enter.calls.length, 1)
    assert.strictEqual(fsm.current, states.paused)
  })

  it('throws on undefined actions / targets', async () => {
    await assert.rejects(() => fsm.act('bogus'), /Undefined transition/)
  })

  it('maintains context mutations across state transitions', async () => {
    assert.strictEqual(fsm.context.counter, 0)
    await fsm.act('start')
    assert.strictEqual(fsm.context.counter, 1)
    await fsm.act('pause')
    assert.strictEqual(fsm.context.counter, 2)
    await fsm.act('resume')
    assert.strictEqual(fsm.context.counter, 3)
  })
})
