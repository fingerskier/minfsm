class StateMachine {
  constructor(config) {
    this.states = config.states || {}
    this.at = config.initial || null
    
    if (this.at && this.states[this.at]) {
      this.current = this.states[this.at]
      this.current?.enter()
    }
  }
  
  
  goto(action) {
    try {
      const result = {from: this.at, to: action}
      
      if (this.at) { // can always transition from null to any state
        if (!this.current.on[action]) 
          return {...result, error: 'undefined'}
        
        if (!this.states[this.current.on[action]]) 
          return {...result, error: 'missing'}
      }
      
      this.current?.exit()
      
      this.at = this.current.on[action]
      
      this.current = this.states[this.at]
      
      return this.current?.enter()
    } catch (error) {
      return {...result, error: 'invalid'}
    }
  }
  
  
  update(dt) {
    if (this.current?.update) this.current?.update(dt)
  }
}


export default StateMachine