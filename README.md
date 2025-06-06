# minfsm
Minimalist finite-state machine with optional React bindings

## Core Usage (No React Required)

```js
import FSM from 'minfsm'

const fsm = new FSM({
  initial: 'idle',
  states: {
    idle: {
      enter: () =>'idle',
      update: ()=>console.log('idling'),
      exit: () => console.log('un-idle'),
      on: {
        start: 'running',
      },
    },
    running: {
      enter: () =>'run',
      // update: ()=>console.log('running'),
      exit: () => console.log('un-run'),
      on: {
        stop: 'idle',
        pause: 'paused',
      },
    },
    paused: {
      enter: () =>'pause',
      update: ()=>console.log('paused'),
      exit: () => console.log('un-pause'),
      on: {
        resume: 'running',
        stop: 'idle',
      },
    },
  },
})

// start in the `idle` state
fsm.act('start')
// transition to the `running` state
fsm.act('stop')
// transition to the `idle` state

...
```

## React Bindings (Optional)

If you're using React, you can use the provided hooks and context:

### Prerequisites
```bash
npm install react  # React 16.8+ required for hooks
```

### React Hook Usage
```jsx
import { useFSM } from 'minfsm/useFSM'

function MyComponent() {
  const { state, act, context } = useFSM({
    initial: 'idle',
    states: {
      idle: { on: { start: 'running' } },
      running: { on: { stop: 'idle' } },
    },
  })

  return (
    <div>
      <p>Current state: {state}</p>
      <button onClick={() => act('start')}>Start</button>
      <button onClick={() => act('stop')}>Stop</button>
    </div>
  )
}
```

### React Context Provider
```jsx
import { FSMProvider, useFsm } from 'minfsm/FSMProvider'

function App() {
  const config = {
    initial: 'idle',
    states: {
      idle: { on: { start: 'running' } },
      running: { on: { stop: 'idle' } },
    },
  }

  return (
    <FSMProvider config={config}>
      <MyComponent />
    </FSMProvider>
  )
}

function MyComponent() {
  const { state, act } = useFsm()
  
  return (
    <div>
      <p>Current state: {state}</p>
      <button onClick={() => act('start')}>Start</button>
    </div>
  )
}
```

## Configuration Basis

Reserved properties on the `config` object:

`initial` - The initial state's name

`states` - An object whose properties are the state objects


Reservered properties on each state object:

`enter` - Function to be called when entering the state

`exit` - Function to be called when exiting the state

`on` - an object whose propertys' values are the possible transitions from the enclosing state
