import { useEffect, useRef, useState, useCallback } from "react";
import FiniteStateMachine from "./FSM";

export interface FsmConfig<C> {
  states: Record<string, any>;
  initial: string;
  context?: C;
}

/** Drive the machine, expose state & helpers */
export function useFSM<C = unknown>(config: FsmConfig<C>) {
  const [, force] = useState(0);          // quick “force-render”
  const fsmRef = useRef<FiniteStateMachine<C> | null>(new FiniteStateMachine({...config, context: config.context ?? {} as C}))


  /** Imperative transition */
  const act = useCallback(async (action: string) => {
    await fsmRef.current!.act(action);    // throws on bad action ↔ see class docs :contentReference[oaicite:0]{index=0}
    force((n) => n + 1);                  // re-render with new state
  }, []);

  // animation-frame update loop (good for game-like UIs)
  useEffect(() => {
    let id: number;
    const step = async () => {
      await fsmRef.current!.update();     // runs current state's update(dt, ctx) :contentReference[oaicite:1]{index=1}
      id = requestAnimationFrame(step);
    };
    id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, []);

  const fsm = fsmRef.current!;
  return {
    fsm,                                  // rare cases you need full access
    state: fsm.state(),                   // current state's key
    context: fsm.context,                 // immutable snapshot
    act,
  };
}
