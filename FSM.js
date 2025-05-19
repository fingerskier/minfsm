/**
 * @description A minimalist finite state machine
 * @class FiniteStateMachine
 */
export default class FiniteStateMachine {
  #stateDefs
  #stateKey
  #prevTime = null
  #ctx
  
  current = null
  
  constructor({ states = {}, initial = null, context = {} } = {}) {
    if (!Object.keys(states).length) {
      throw new Error('StateMachine requires at least one state definition')
    }
    
    this.#ctx = {...context}
    this.#stateDefs = { ...states } // decouple external mutations
    this.#changeTo(initial)
  }
  
  /** 
   * @description Retrieve the shared context (read‑only by default)
   * @returns {Object} The shared context
   */
  get context() { 
    return Object.freeze({...this.#ctx})
  }


  /**
   * @description Transition via named action
   * @param {string} action
   * @returns {Promise<*>} value returned by new state’s enter()
   */
  async act(action) {
    if (!action) throw new Error('Action must be a non‑empty string')

    const targetKey = this.current?.on?.[action] ?? action

    if (!this.#stateDefs[targetKey]) {
      throw new Error(`Undefined target state "${targetKey}" from action "${action}"`)
    }
    return this.#changeTo(targetKey)
  }
  
  

  /**
   * @description Force change to explicit state
   * @param {string|null} nextKey
   * @returns {Promise<*>} value returned by new state’s enter()
   */
  async #changeTo(nextKey) {
    if (this.current?.exit) {
      await this.current.exit(this.#ctx)
    }

    this.#stateKey = nextKey
    this.current = nextKey ? this.#stateDefs[nextKey] : null
    this.#prevTime = (typeof performance !== 'undefined' ? performance.now() : Date.now())

    if (this.current?.enter) {
      return await this.current.enter(this.#ctx)
    }
  }


  /**
   * @description Update/tick the state machine
   * @returns {Promise<void>}
   */
  async update() {
    if (!this.current?.update) return

    const now = (typeof performance !== 'undefined' ? performance.now() : Date.now())
    const dt = this.#prevTime ? now - this.#prevTime : 0
    this.#prevTime = now

    await this.current.update(dt, this.#ctx)
  }
}