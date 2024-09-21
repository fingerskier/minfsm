# janus-fsm
Minimalist finite-state machine


## Configuration Basis

Reserved properties on the `config` object:

`initial` - The initial state's name

`states` - An object whose properties are the state objects


Reservered properties on each state object:

`enter` - Function to be called when entering the state

`exit` - Function to be called when exiting the state

`on` - an object whose propertys' values are the possible transitions from the enclosing state
