import { useEffect, useRef, useState } from "react";
import { Icon, type IconName } from "./components/Icon";
import { ExercisePicker } from "./components/ExercisePicker";
import { EditSet } from "./components/EditSet";
import { RecordPage } from "./pages/RecordPage";
import { ProgressPage } from "./pages/ProgressPage";
import { HistoryPage } from "./pages/HistoryPage";
import { SettingsPage } from "./pages/SettingsPage";
import { useStore } from "./hooks/useStore";
import { useRestTimer } from "./hooks/useRestTimer";
import {
  generateDemo,
  localDate,
  type Exercise,
  type Store,
  type TrainingSet,
} from "./lib/model";

type Page = "record" | "progress" | "history" | "settings";
const pages: { id: Page; label: string; icon: IconName; short: string }[] = [
  {
    id: "record",
    label: "トレーニングを記録",
    icon: "dumbbell",
    short: "記録",
  },
  { id: "progress", label: "成長を見る", icon: "chart", short: "成長" },
  { id: "history", label: "トレーニング履歴", icon: "history", short: "履歴" },
  { id: "settings", label: "設定とデータ", icon: "settings", short: "設定" },
];
type Toast = { message: string; undo?: () => void };
export default function App() {
  const {
    data,
    update,
    restore,
    problem,
    blocked,
    externalChange,
    acknowledgeExternalChange,
  } = useStore();
  const [page, setPage] = useState<Page>("record");
  const [picker, setPicker] = useState(false);
  const [editing, setEditing] = useState<TrainingSet | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [today, setToday] = useState(localDate);
  const [demo, setDemo] = useState(false);
  const [demoData] = useState(generateDemo);
  const timer = useRestTimer();
  const toastTimer = useRef<number | undefined>(undefined);
  const notify = (message: string, undo?: () => void) => {
    window.clearTimeout(toastTimer.current);
    setToast({ message, undo });
    toastTimer.current = window.setTimeout(
      () => setToast(null),
      undo ? 10000 : 4500,
    );
  };
  useEffect(() => () => window.clearTimeout(toastTimer.current), []);
  useEffect(() => {
    const refresh = () => setToday(localDate());
    const interval = window.setInterval(refresh, 60000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);
  useEffect(() => {
    if (externalChange) {
      setEditing(null);
      setPicker(false);
      setToast(null);
      acknowledgeExternalChange();
    }
  }, [externalChange, acknowledgeExternalChange]);
  const navigate = (next: Page) => {
    setPage(next);
    setDemo(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const select = (id: string) => {
    update((s) => ({ ...s, selectedId: id }));
  };
  const add = (exercise: Exercise) =>
    update((s) => ({
      ...s,
      exercises: [...s.exercises, exercise],
      selectedId: exercise.id,
    }));
  const restoreData = (next: Store) => {
    const result = restore(next);
    if (result) {
      setToast(null);
      timer.stop();
      setEditing(null);
      setPicker(false);
    }
    return result;
  };
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button
          className="brand"
          onClick={() => navigate("record")}
          aria-label="LIFT 記録画面へ"
        >
          <span className="brand-symbol">
            <Icon name="dumbbell" size={25} />
          </span>
          <span>
            LIFT<span className="brand-dot">.</span>
          </span>
        </button>
        <p className="brand-caption">自分のためのトレーニングノート</p>
        <div className="nav-label">MY TRAINING</div>
        <nav aria-label="メインメニュー">
          {pages.map((p) => (
            <button
              key={p.id}
              className={`nav-item ${page === p.id ? "active" : ""}`}
              onClick={() => navigate(p.id)}
              aria-current={page === p.id ? "page" : undefined}
            >
              <Icon name={p.icon} />
              <span>{p.label}</span>
              {page === p.id && <span className="nav-active-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <span className="sidebar-quote">
            今日のひとつが、
            <br />
            明日の自分になる。
          </span>
          <span className="sidebar-line" />
          <p>
            <span className="status-dot" />
            PRIVATE & PERSONAL
          </p>
          <small>あなたの記録は、この端末の中に。</small>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <span className="topbar-brand">
            LIFT<span>.</span>
          </span>
          <span className="topbar-title">MY TRAINING NOTE</span>
          <span className="topbar-date">
            {new Date(`${today}T12:00:00`).toLocaleDateString("ja-JP", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            })}
            <span className="status-dot" />
          </span>
        </header>
        <div className="page-content">
          {problem && (
            <div className="storage-alert" role="alert">
              <Icon name="info" />
              <div>
                <strong>保存についてのお知らせ</strong>
                <p>{problem}</p>
                <button
                  className="text-button"
                  onClick={() => navigate("settings")}
                >
                  設定とデータを開く
                </button>
              </div>
            </div>
          )}
          {demo && (
            <div className="demo-banner">
              <span>
                <strong>サンプル表示中</strong> · あなたの記録には保存されません
              </span>
              <button onClick={() => setDemo(false)}>
                サンプルを閉じる
                <Icon name="close" size={16} />
              </button>
            </div>
          )}
          {page === "record" && (
            <RecordPage
              data={data}
              today={today}
              blocked={blocked}
              update={update}
              openPicker={() => setPicker(true)}
              select={select}
              edit={setEditing}
              timer={timer}
              saved={(set, best) => {
                if (set.date === today) timer.start(data.restSeconds);
                notify(
                  best
                    ? "自己ベスト更新！ 1セット記録しました"
                    : "1セット記録しました",
                  () => {
                    if (
                      update((s) => ({
                        ...s,
                        sets: s.sets.filter((item) => item.id !== set.id),
                      }))
                    ) {
                      timer.stop();
                      notify("記録を取り消しました");
                    }
                  },
                );
              }}
            />
          )}
          {page === "progress" && (
            <ProgressPage
              key={demo ? "demo" : "real"}
              data={demo ? demoData : data}
              today={today}
              goRecord={() => navigate("record")}
              demo={demo}
            />
          )}
          {page === "history" && (
            <HistoryPage
              data={data}
              edit={setEditing}
              goRecord={() => navigate("record")}
            />
          )}
          {page === "settings" && (
            <SettingsPage
              data={data}
              blocked={blocked}
              restore={restoreData}
              notify={notify}
              showDemo={() => {
                setPage("progress");
                setDemo(true);
                window.scrollTo({ top: 0, behavior: "instant" });
              }}
            />
          )}
          <footer className="page-footer">
            <span>LIFT.</span> YOUR PACE. YOUR PROGRESS.
          </footer>
        </div>
      </main>
      <nav className="mobile-nav" aria-label="モバイルメニュー">
        {pages.map((p) => (
          <button
            key={p.id}
            className={page === p.id ? "active" : ""}
            aria-current={page === p.id ? "page" : undefined}
            onClick={() => navigate(p.id)}
          >
            <Icon name={p.icon} size={22} />
            <span>{p.short}</span>
          </button>
        ))}
      </nav>
      {toast && (
        <div className="toast" role="status">
          <span className="toast-check">
            <Icon name="check" size={18} />
          </span>
          <span>{toast.message}</span>
          {toast.undo && <button onClick={toast.undo}>元に戻す</button>}
          <button
            className="toast-close"
            aria-label="通知を閉じる"
            onClick={() => setToast(null)}
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      )}
      <span className="sr-only" role="status">
        {timer.finished ? "休憩が終了しました。" : ""}
      </span>
      {picker && (
        <ExercisePicker
          exercises={data.exercises}
          selectedId={data.selectedId}
          close={() => setPicker(false)}
          select={select}
          add={add}
        />
      )}
      {editing && data.exercises.some((e) => e.id === editing.exerciseId) && (
        <EditSet
          set={editing}
          exercise={data.exercises.find((e) => e.id === editing.exerciseId)!}
          today={today}
          close={() => setEditing(null)}
          save={(set) => {
            const old = editing;
            const result = update((s) => ({
              ...s,
              sets: s.sets.map((item) => (item.id === set.id ? set : item)),
            }));
            if (result)
              notify("記録を更新しました", () => {
                if (
                  update((s) => ({
                    ...s,
                    sets: s.sets.map((item) =>
                      item.id === old.id ? old : item,
                    ),
                  }))
                )
                  notify("変更を取り消しました");
              });
            return result;
          }}
          remove={() => {
            const old = editing;
            const result = update((s) => ({
              ...s,
              sets: s.sets.filter((item) => item.id !== old.id),
            }));
            if (result)
              notify("セットを削除しました", () => {
                if (
                  update((s) => ({
                    ...s,
                    sets: s.sets.some((item) => item.id === old.id)
                      ? s.sets
                      : [...s.sets, old],
                  }))
                )
                  notify("セットを元に戻しました");
              });
            return result;
          }}
        />
      )}
    </div>
  );
}
