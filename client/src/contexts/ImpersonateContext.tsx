import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface ImpersonateState {
  active: boolean;
  targetId: number | null;
  targetType: "staff" | "customer" | null;
  targetName: string | null;
  targetRole: string | null;
}

interface ImpersonateContextValue {
  state: ImpersonateState;
  startImpersonating: (targetId: number, targetType: "staff" | "customer", targetName: string, targetRole: string) => void;
  stopImpersonating: () => void;
  getImpersonateHeader: () => Record<string, string>;
}

const ImpersonateContext = createContext<ImpersonateContextValue | null>(null);

const STORAGE_KEY = "hibi_impersonate";

function loadState(): ImpersonateState {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return { active: false, targetId: null, targetType: null, targetName: null, targetRole: null };
}

function saveState(state: ImpersonateState) {
  try {
    if (state.active) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch {}
}

export function ImpersonateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ImpersonateState>(loadState);

  const startImpersonating = useCallback((targetId: number, targetType: "staff" | "customer", targetName: string, targetRole: string) => {
    const newState: ImpersonateState = { active: true, targetId, targetType, targetName, targetRole };
    setState(newState);
    saveState(newState);
  }, []);

  const stopImpersonating = useCallback(() => {
    const newState: ImpersonateState = { active: false, targetId: null, targetType: null, targetName: null, targetRole: null };
    setState(newState);
    saveState(newState);
  }, []);

  const getImpersonateHeader = useCallback((): Record<string, string> => {
    if (state.active && state.targetId) {
      if (state.targetType === "staff") {
        return { "x-impersonate-staff-id": String(state.targetId) };
      } else if (state.targetType === "customer") {
        return { "x-impersonate-customer-id": String(state.targetId) };
      }
    }
    return {};
  }, [state]);

  return (
    <ImpersonateContext.Provider value={{ state, startImpersonating, stopImpersonating, getImpersonateHeader }}>
      {children}
    </ImpersonateContext.Provider>
  );
}

export function useImpersonate() {
  const ctx = useContext(ImpersonateContext);
  if (!ctx) throw new Error("useImpersonate must be used within ImpersonateProvider");
  return ctx;
}
