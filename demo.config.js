const config = {
  initial: 'idle',
  states: {
    idle: {
      enter: () => 'idle',
      update: () => console.log('idling'),
      exit: () => console.log('un-idle'),
      on: {
        start: 'running',
        stop: 'idle',
      },
    },
    running: {
      enter: () => 'run',
      // update: () => console.log('running'),
      exit: () => console.log('un-run'),
      on: {
        stop: 'idle',
        pause: 'paused',
      },
    },
    paused: {
      enter: () => 'pause',
      update: () => console.log('paused'),
      exit: () => console.log('un-pause'),
      on: {
        resume: 'running',
        stop: 'idle',
      },
    },
  },
}

export default config
