import { useCallback, useEffect, useState } from "react";
import { freshStore, parseStore, STORAGE_KEY, type Store } from "../lib/model";

function load(): { data: Store; problem: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return { data: raw ? parseStore(raw) : freshStore(), problem: "" };
  } catch {
    return {
      data: freshStore(),
      problem:
        "保存データを読み込めませんでした。元のデータは上書きしていません。バックアップから復元するか、データを救出してください。",
    };
  }
}
export function useStore() {
  const [initial] = useState(load);
  const [data, setData] = useState(initial.data);
  const [problem, setProblem] = useState(initial.problem);
  const [blocked, setBlocked] = useState(Boolean(initial.problem));
  const [externalChange, setExternalChange] = useState(false);
  const update = useCallback(
    (change: (previous: Store) => Store): boolean => {
      if (blocked) return false;
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const base = raw ? parseStore(raw) : data;
        const next = change(base);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        setData(next);
        setProblem("");
        return true;
      } catch {
        setProblem(
          "記録を保存できませんでした。ブラウザの保存容量・設定を確認し、もう一度お試しください。",
        );
        return false;
      }
    },
    [blocked, data],
  );
  const restore = useCallback((next: Store): boolean => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setData(next);
      setBlocked(false);
      setProblem("");
      return true;
    } catch {
      setProblem(
        "復元データを保存できませんでした。ブラウザの保存設定を確認してください。",
      );
      return false;
    }
  }, []);
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY && event.key !== null) return;
      try {
        setData(event.newValue ? parseStore(event.newValue) : freshStore());
        setProblem("");
        setBlocked(false);
        setExternalChange(true);
      } catch {
        setBlocked(true);
        setProblem(
          "別のタブで保存データが変更されましたが、読み込めませんでした。バックアップから復元してください。",
        );
      }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  return {
    data,
    update,
    restore,
    problem,
    blocked,
    externalChange,
    acknowledgeExternalChange: () => setExternalChange(false),
  };
}
