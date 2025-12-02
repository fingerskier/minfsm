import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import FSM from './FSM'

interface SpyFunction<T extends any[] = any[], R = any> {
  (...args: T): R
  calls: T[]
}

function spy<T extends any[] = any[], R = any>(fn: (...args: T) => R = (() => {}) as any): SpyFunction<T, R> {
  function wrapper(...args: T): R {
    wrapper.calls.push(args)
    return fn(...args)
  }
  wrapper.calls = []
  return wrapper
}

interface TestContext {
  answer: number
  data: Array<{
    highlight: boolean
    active: boolean
    warning: number
    danger: number
    error: number
  }>
  log: SpyFunction
  counter: number
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
  let fsm: FSM
  let states: any
  let ctx: TestContext

  beforeEach(() => {
    ctx = { ...baseCtx, log: spy(), counter: 0 }
    states = {
      idle: {
        enter: spy((c: TestContext) => { c.counter = 0; return 'idle' }),
        update: spy(),
        exit: spy(),
        on: { start: 'running', stop: 'idle' }
      },
      running: {
        enter: spy((c: TestContext) => { c.counter++; return 'run' }),
        update: spy(),
        exit: spy(),
        on: { stop: 'idle', pause: 'paused' }
      },
      paused: {
        enter: spy((c: TestContext) => { c.counter *= 2; return 'pause' }),
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

  it('transitions idle → running on "start"', async () => {
    const ret = await fsm.act('start')
    assert.strictEqual(ret, 'run')
    assert.strictEqual(states.idle.exit.calls.length, 1)
    assert.strictEqual(states.running.enter.calls.length, 1)
    assert.strictEqual(fsm.current, states.running)
  })

  it('supports chained transitions (running → paused)', async () => {
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

  it('invokes global enter/exit hooks for all transitions', async () => {
    const events: string[] = []
    const globalEnter = spy((state: string, passedCtx: TestContext) => {
      events.push(`enter:${state}`)
      assert.deepStrictEqual(passedCtx, fsm.context)
    })
    const globalExit = spy((state: string, passedCtx: TestContext) => {
      events.push(`exit:${state}`)
      assert.deepStrictEqual(passedCtx, fsm.context)
    })

    fsm = new FSM({ initial: 'idle', states, context: ctx, onAnyEnter: globalEnter, onAnyExit: globalExit })

    assert.deepStrictEqual(events, ['enter:idle'])
    await fsm.act('start')
    assert.deepStrictEqual(events, ['enter:idle', 'exit:idle', 'enter:running'])
    assert.strictEqual(globalEnter.calls.length, 2)
    assert.strictEqual(globalExit.calls.length, 1)
  })

  it('runs global update hook even when a state lacks update()', async () => {
    const onAnyUpdate = spy()
    const simpleFsm = new FSM({ initial: 'idle', states: { idle: {} }, onAnyUpdate })

    await simpleFsm.update()

    assert.strictEqual(onAnyUpdate.calls.length, 1)
    const [stateKey, dt, passedCtx] = onAnyUpdate.calls[0]
    assert.strictEqual(stateKey, 'idle')
    assert.equal(typeof dt, 'number')
    assert.deepStrictEqual(passedCtx, simpleFsm.context)
  })
})