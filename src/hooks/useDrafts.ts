import { useEffect, useState } from "react";

type Draft = { weight: string; reps: string; seconds: string };
const KEY = "lift.training.drafts.v1";
function load(): Record<string, Draft> {
  try {
    const raw: unknown = JSON.parse(sessionStorage.getItem(KEY) || "{}");
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
    const result: Record<string, Draft> = {};
    for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
      if (
        key.length > 120 ||
        !value ||
        typeof value !== "object" ||
        Array.isArray(value)
      )
        continue;
      const draft = value as Record<string, unknown>;
      if (
        [draft.weight, draft.reps, draft.seconds].every(
          (v) => typeof v === "string" && v.length <= 8,
        )
      ) {
        result[key] = {
          weight: draft.weight as string,
          reps: draft.reps as string,
          seconds: draft.seconds as string,
        };
      }
    }
    return result;
  } catch {
    return {};
  }
}
export function useDrafts() {
  const [values, setValues] = useState(load);
  useEffect(() => {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(values));
    } catch {
      /* Keep drafts in memory when browser storage is unavailable. */
    }
  }, [values]);
  return {
    values,
    set: (key: string, value: Draft) =>
      setValues((previous) => ({ ...previous, [key]: value })),
    remove: (key: string) =>
      setValues((previous) => {
        const next = { ...previous };
        delete next[key];
        return next;
      }),
    clear: () => setValues({}),
  };
}
