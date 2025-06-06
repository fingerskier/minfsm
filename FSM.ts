export type StateDef<C> = {
  name: string
  enter?: (ctx: C) => Promise<void>
  update?: (dt: number, ctx: C) => Promise<void>
  exit?: (ctx: C) => Promise<void>
  on?: Record<string, string>
}

export type FsmConfig<C> = {
  initial: string
  states: Record<string, StateDef<C>>
  context: C
}


/**
 * @description A minimalist finite state machine
 * @class FiniteStateMachine
 */
export default class FiniteStateMachine<C> {
  #stateDefs
  #stateKey
  #prevTime = null
  #ctx
  
  chatty = false
  current = null
  
  constructor(parm: FsmConfig<C>) {
    const { states, initial, context } = parm as FsmConfig<C>

    if (!Object.keys(states).length) {
      throw new Error('StateMachine requires at least one state definition')
    }
    
    this.#ctx = {...context}
    if (this.chatty) console.log('FSM_context', this.#ctx)
    this.#stateDefs = { ...states } // decouple external mutations
    this.#changeTo(initial)
  }


  /**
   * @description Transition via named action
   * @param {string} action
   * @returns {Promise<*>} value returned by new state’s enter()
   */
  async act(action: string): Promise<string | void> {
    if (!action) throw new Error('Action must be a non‑empty string')
    if (this.chatty) console.log('FSM::act', action)

    const targetKey = this.current?.on?.[action] ?? action

    if (!this.#stateDefs[targetKey]) {
      throw new Error(`Undefined transition "${targetKey}" from action "${action}"`)
    }
    return await this.#changeTo(targetKey)
  }


  get context() {
    return Object.freeze({...this.#ctx})
  }
  

  /**
   * @description Utility fx
   * @param {string} test
   * @returns {string} ~ if a test-key is passed return true/false if the current state matches, if no test-key is passed return the current state
   */
  state(test?: string): string | boolean {
    if (test) return this.#stateKey === test
    else return this.#stateKey
  }
  

  /**
   * @description Force change to explicit state
   * @param {string|null} nextKey
   * @returns {Promise<*>} value returned by new state’s enter()
   */
  async #changeTo(nextKey: string): Promise<string | void> {
    if (this.current?.exit) {
      await this.current.exit(this.#ctx)
      if (this.chatty) console.log('FSM::exited', this.current?.name)
    }

    this.#stateKey = nextKey
    this.current = nextKey ? this.#stateDefs[nextKey] : null
    this.#prevTime = (typeof performance !== 'undefined' ? performance.now() : Date.now())

    if (this.current?.enter) {
      const result = await this.current.enter(this.#ctx)
      if (this.chatty) console.log('FSM::entered', this.current?.name)
      return result
    }
  }


  /**
   * @description Update/tick the state machine
   * @returns {Promise<void>}
   */
  async update(): Promise<void> {
    if (!this.current?.update) return

    const now = (typeof performance !== 'undefined' ? performance.now() : Date.now())
    const dt = this.#prevTime ? now - this.#prevTime : 0
    this.#prevTime = now

    await this.current.update(dt, this.#ctx)
  }
}