const config = {
  context: {
    idling: true,
    idleCount: 0,
    running: false,
    runningCount: 0,
    paused: false,
    pausedCount: 0,
  },
  initial: 'idle',
  states: {
    idle: {
      name: 'idle',
      enter: async(ctx) => ctx.idling = true,
      update: async(dt, ctx) => ctx.idleCount++,
      exit: async(ctx) => ctx.idling = false,
      on: {
        start: 'running',
        stop: 'idle',
      },
    },
    running: {
      name: 'running',
      enter: async(ctx) => ctx.running = true,
      update: async(dt, ctx) => ctx.runningCount++,
      exit: async(ctx) => ctx.running = false,
      on: {
        stop: 'idle',
        pause: 'paused',
      },
    },
    paused: {
      name: 'paused',
      enter: async(ctx) => ctx.paused = true,
      update: async(dt, ctx) => ctx.pausedCount++,
      exit: async(ctx) => ctx.paused = false,
      on: {
        resume: 'running',
        stop: 'idle',
      },
    },
  },
}

export default config
