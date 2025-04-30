// StateMachine.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import StateMachine from './FSM.js';   // ← tweak the path

describe('Minimalist FSM', () => {
  let fsm
  let states
  const ctx = { 
    log: vi.fn(), 
    answer: 42,
    data: [{
      highlight: false,
      active: true,
      warning: -7,
      danger: 0,
      error: 1,
    }],
    counter: 0
  }

  beforeEach(() => {
    // spies let us assert enter/update/exit calls
    states = {
      idle: {
        enter : vi.fn().mockImplementation(ctx => {
          ctx.counter = 0
          return 'idle'
        }),
        update: vi.fn(),
        exit  : vi.fn(),
        on    : { start: 'running', stop: 'idle' },
      },
      running: {
        enter : vi.fn().mockImplementation(ctx => {
          ctx.counter++
          return 'run'
        }),
        update: vi.fn(),
        exit  : vi.fn(),
        on    : { stop: 'idle', pause: 'paused' },
      },
      paused: {
        enter : vi.fn().mockImplementation(ctx => {
          ctx.counter *= 2
          return 'pause'
        }),
        update: vi.fn(),
        exit  : vi.fn(),
        on    : { resume: 'running', stop: 'idle' },
      },
    }

    fsm = new StateMachine({
      initial: 'idle',
      states,
      context: ctx,
    })
  })

  it('starts in the initial state and calls enter(ctx)', () => {
    expect(fsm.current).toBe(states.idle)
    expect(states.idle.enter).toHaveBeenCalledTimes(1)
    expect(states.idle.enter).toHaveBeenCalledWith(ctx)
  })

  it('update() forwards (dt, ctx) to state.update', async () => {
    await fsm.update()
    expect(states.idle.update).toHaveBeenCalledTimes(1)
    const [dt, passedCtx] = states.idle.update.mock.calls[0]
    expect(typeof dt).toBe('number')
    expect(passedCtx).toStrictEqual(fsm.context)
  })

  it('transitions idle ➜ running on "start"', async () => {
    const ret = await fsm.act('start')

    expect(ret).toBe('run')
    expect(states.idle.exit).toHaveBeenCalledTimes(1)
    expect(states.running.enter).toHaveBeenCalledTimes(1)
    expect(fsm.current).toBe(states.running)
  })

  it('supports chained transitions (running ➜ paused)', async () => {
    await fsm.act('start');      // idle ➜ running
    await fsm.act('pause');      // running ➜ paused

    expect(states.running.exit).toHaveBeenCalledTimes(1)
    expect(states.paused.enter).toHaveBeenCalledTimes(1)
    expect(fsm.current).toBe(states.paused)
  })

  it('throws on undefined actions / targets', async () => {
    await expect(fsm.act('bogus'))
      .rejects.toThrow(/Undefined target state/)
  })

  it('maintains context mutations across state transitions', async () => {
    // Start in idle which initializes counter
    expect(fsm.context.counter).toBe(0)
    
    // Transition to running which increments counter
    await fsm.act('start')
    expect(fsm.context.counter).toBe(1)
    
    // Transition to paused which doubles counter
    await fsm.act('pause')
    expect(fsm.context.counter).toBe(2)
    
    // Go back to running which increments again
    await fsm.act('resume')
    expect(fsm.context.counter).toBe(3)
  })
})
