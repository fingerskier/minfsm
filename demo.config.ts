import { FsmConfig } from './FSM'

interface DemoContext {
  idling: boolean
  idleCount: number
  running: boolean
  runningCount: number
  paused: boolean
  pausedCount: number
}

const config: FsmConfig<DemoContext> = {
  context: {
    idling: true,
    idleCount: 0,
    running: false,
    runningCount: 0,
    paused: false,
    pausedCount: 0,
  } as DemoContext,
  initial: 'idle' as const,
  states: {
    idle: {
      name: 'idle',
      enter: async (ctx: DemoContext) => { ctx.idling = true },
      update: async (dt: number, ctx: DemoContext) => { ctx.idleCount++ },
      exit: async (ctx: DemoContext) => { ctx.idling = false },
      on: {
        start: 'running',
        stop: 'idle',
      },
    },
    running: {
      name: 'running',
      enter: async (ctx: DemoContext) => { ctx.running = true },
      update: async (dt: number, ctx: DemoContext) => { ctx.runningCount++ },
      exit: async (ctx: DemoContext) => { ctx.running = false },
      on: {
        stop: 'idle',
        pause: 'paused',
      },
    },
    paused: {
      name: 'paused',
      enter: async (ctx: DemoContext) => { ctx.paused = true },
      update: async (dt: number, ctx: DemoContext) => { ctx.pausedCount++ },
      exit: async (ctx: DemoContext) => { ctx.paused = false },
      on: {
        resume: 'running',
        stop: 'idle',
      },
    },
  },
}

export default config 