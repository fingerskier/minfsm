# min-fsm
Minimalist finite-state machine


## Usage

```js
import FSM from 'min-fsm'

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


## Configuration Basis

Reserved properties on the `config` object:

`initial` - The initial state's name

`states` - An object whose properties are the state objects


Reservered properties on each state object:

`enter` - Function to be called when entering the state

`exit` - Function to be called when exiting the state

`on` - an object whose propertys' values are the possible transitions from the enclosing state
