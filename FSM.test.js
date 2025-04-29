// StateMachine.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import StateMachine from './FSM.js';   // ← tweak the path

describe('StateMachine – happy path & edge cases', () => {
  let fsm;
  let states;
  const ctx = { log: vi.fn(), answer: 42 };

  beforeEach(() => {
    // spies let us assert enter/update/exit calls
    states = {
      idle: {
        enter : vi.fn().mockReturnValue('idle'),
        update: vi.fn(),
        exit  : vi.fn(),
        on    : { start: 'running', stop: 'idle' },
      },
      running: {
        enter : vi.fn().mockReturnValue('run'),
        exit  : vi.fn(),
        on    : { stop: 'idle', pause: 'paused' },
      },
      paused: {
        enter : vi.fn().mockReturnValue('pause'),
        update: vi.fn(),
        exit  : vi.fn(),
        on    : { resume: 'running', stop: 'idle' },
      },
    };

    fsm = new StateMachine({
      initial: 'idle',
      states,
      context: ctx,
    });
  });

  it('starts in the initial state and calls enter(ctx)', () => {
    expect(fsm.current).toBe(states.idle);
    expect(states.idle.enter).toHaveBeenCalledTimes(1);
    expect(states.idle.enter).toHaveBeenCalledWith(ctx);
  });

  it('update() forwards (dt, ctx) to state.update', async () => {
    await fsm.update();
    expect(states.idle.update).toHaveBeenCalledTimes(1);
    const [dt, passedCtx] = states.idle.update.mock.calls[0];
    expect(typeof dt).toBe('number');
    expect(passedCtx).toBe(ctx);
  });

  it('transitions idle ➜ running on "start"', async () => {
    const ret = await fsm.act('start');

    expect(ret).toBe('run');
    expect(states.idle.exit).toHaveBeenCalledTimes(1);
    expect(states.running.enter).toHaveBeenCalledTimes(1);
    expect(fsm.current).toBe(states.running);
  });

  it('supports chained transitions (running ➜ paused)', async () => {
    await fsm.act('start');      // idle ➜ running
    await fsm.act('pause');      // running ➜ paused

    expect(states.running.exit).toHaveBeenCalledTimes(1);
    expect(states.paused.enter).toHaveBeenCalledTimes(1);
    expect(fsm.current).toBe(states.paused);
  });

  it('throws on undefined actions / targets', async () => {
    await expect(fsm.act('bogus'))
      .rejects.toThrow(/Undefined target state/);
  });
});
