export type StateDef<C> = {
  name?: string
  enter?: (ctx: C) => any
  update?: (dt: number, ctx: C) => Promise<void>
  exit?: (ctx: C) => Promise<void>
  on?: Record<string, string>
}

export type FsmConfig<C> = {
  initial: string
  states: Record<string, StateDef<C>>
  context?: C
  onAnyEnter?: (stateKey: string, ctx: C) => Promise<void> | void
  onAnyExit?: (stateKey: string, ctx: C) => Promise<void> | void
  onAnyUpdate?: (stateKey: string, dt: number, ctx: C) => Promise<void> | void
}

const now = typeof performance !== 'undefined'
  ? () => performance.now()
  : () => Date.now()

export default class FiniteStateMachine<C> {
  #stateDefs
  #stateKey
  #prevTime = null
  #ctx
  #onAnyEnter
  #onAnyExit
  #onAnyUpdate
  #current: StateDef<C> | null = null
  #initPromise: Promise<any>
  #ctxSnapshot: Readonly<C> | null = null

  chatty = false

  get current(): StateDef<C> | null { return this.#current }

  /** Resolves when the initial state's enter() has completed */
  get ready(): Promise<void> { return this.#initPromise.then(() => {}) }

  constructor(parm: FsmConfig<C>) {
    const { states, initial, context, onAnyEnter, onAnyExit, onAnyUpdate } = parm as FsmConfig<C>

    if (!Object.keys(states).length) {
      throw new Error('StateMachine requires at least one state definition')
    }

    this.#ctx = { ...(context ?? {} as C) }
    this.#stateDefs = { ...states }
    this.#onAnyEnter = onAnyEnter
    this.#onAnyExit = onAnyExit
    this.#onAnyUpdate = onAnyUpdate
    this.#initPromise = this.#changeTo(initial)
  }

  async act(action: string): Promise<any> {
    if (!action) throw new Error('Action must be a non‑empty string')
    if (this.chatty) console.log('FSM::act', action)

    const targetKey = this.#current?.on?.[action] ?? action

    if (!this.#stateDefs[targetKey]) {
      throw new Error(`Undefined transition "${targetKey}" from action "${action}"`)
    }
    return this.#changeTo(targetKey)
  }

  get context(): Readonly<C> {
    if (!this.#ctxSnapshot) {
      this.#ctxSnapshot = Object.freeze({...this.#ctx})
    }
    return this.#ctxSnapshot
  }

  /**
   * @param {string} test - if passed, returns true/false for match; otherwise returns current state key
   */
  state(test?: string): string | boolean {
    if (test) return this.#stateKey === test
    else return this.#stateKey
  }

  async #changeTo(nextKey: string): Promise<any> {
    const prevKey = this.#stateKey

    if (prevKey && this.#onAnyExit) {
      await this.#onAnyExit(prevKey, this.#ctx)
    }

    if (this.#current?.exit) {
      await this.#current.exit(this.#ctx)
      if (this.chatty) console.log('FSM::exited', this.#current?.name)
    }

    this.#stateKey = nextKey
    this.#current = nextKey ? this.#stateDefs[nextKey] : null
    this.#prevTime = now()

    if (this.#onAnyEnter) {
      await this.#onAnyEnter(nextKey, this.#ctx)
    }

    const result = this.#current?.enter ? await this.#current.enter(this.#ctx) : undefined
    if (this.chatty) console.log('FSM::entered', this.#current?.name)
    this.#ctxSnapshot = null
    return result
  }

  async update(): Promise<void> {
    const t = now()
    const dt = this.#prevTime ? t - this.#prevTime : 0
    this.#prevTime = t

    if (this.#current?.update) {
      await this.#current.update(dt, this.#ctx)
    }

    if (this.#onAnyUpdate && this.#stateKey) {
      await this.#onAnyUpdate(this.#stateKey, dt, this.#ctx)
    }

    this.#ctxSnapshot = null
  }
}