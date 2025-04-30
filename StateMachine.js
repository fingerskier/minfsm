export default class StateMachine {
  #at = null
  
  #prevTime
  #states = {}
  
  current = null
  
  
  constructor(config) {
    this.#states = config.states
    this.#at = config.initial
    
    if (this.#at && this.#states?.[this.#at]) {
      this.current = this.#states[this.#at]
      this.current?.enter()
    } else {
      throw new Error(`FSM::Must set a valid initial state`)
    }
  }
  
  
  async act(action) {
    let transition
    
    try {
      transition = {from: this.#at, to: action}
      
      // can always transition from null to any state
      if (this.#at) { 
        // if there is no trasition from current to action
        if (this.current?.on && !this.current.on[action])
          throw new Error(`FSM::State ${this.#at} to ${action} is undefined`)
          
        // if the requested transition is not defined at all
        if (!this.#states[this.current.on[action]])
          throw new Error(`FSM::State ${this.current.on[action]} is undefined`)
      }
      
      const exitFx = this.current?.exit
      if (exitFx && exitFx.constructor.name === 'AsyncFunction') {
        await exitFx()
      } else {
        this.current?.exit()
      }
      
      this.#at = this.current.on[action]
      
      this.current = this.#states[this.#at]
      
      const enterFx = this.current?.enter
      if (enterFx && enterFx.constructor.name === 'AsyncFunction') {
        await enterFx()
      } else {
        this.current?.enter()
      }
      
      return transition
    } catch (error) {
      throw error
    }
  }
  
  
  update() {
    const now = performance.now()
    if (!this.#prevTime) this.#prevTime = now
    const dt = now - this.#prevTime
    this.#prevTime = now
    if (this.current?.update) this.current?.update(dt)
  }
}