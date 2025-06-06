import { createContext, useContext, ReactNode } from "react";
import { useFSM, FsmConfig } from "./useFSM";

const FsmCtx = createContext<ReturnType<typeof useFSM> | null>(null);

export function FSMProvider<C>({
  config,
  children,
}: {
  config: FsmConfig<C>;
  children: ReactNode;
}) {
  const value = useFSM(config);
  return <FsmCtx.Provider value={value}>{children}</FsmCtx.Provider>;
}

export const useFsm = () => {
  const ctx = useContext(FsmCtx);
  if (!ctx) throw new Error("useFsm must be inside <FSMProvider>");
  return ctx;
}