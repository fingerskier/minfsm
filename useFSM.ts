import { useEffect, useRef, useState, useCallback } from "react";
import FiniteStateMachine, { FsmConfig } from "./FSM";
export type { FsmConfig };

export function useFSM<C = unknown>(config: FsmConfig<C>) {
  const [, force] = useState(0);
  const fsmRef = useRef<FiniteStateMachine<C> | null>(new FiniteStateMachine({...config, context: config.context ?? {} as C}))

  const act = useCallback(async (action: string) => {
    await fsmRef.current!.act(action);
    force((n) => n + 1);
  }, []);

  useEffect(() => {
    const hasUpdate = Object.values(config.states).some(s => s?.update);
    if (!hasUpdate) return;

    let id: number;
    const step = async () => {
      await fsmRef.current!.update();
      id = requestAnimationFrame(step);
    };
    id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, []);

  const fsm = fsmRef.current!;
  return {
    fsm,
    get state() { return fsm.state() as string },
    get context() { return fsm.context },
    act,
  };
}
