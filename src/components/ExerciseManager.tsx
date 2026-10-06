import { useState } from "react";
import { Modal } from "./Modal";
import type { Exercise, Store } from "../lib/model";

export function ExerciseManager({
  data,
  blocked,
  update,
  notify,
}: {
  data: Store;
  blocked: boolean;
  update: (change: (store: Store) => Store) => boolean;
  notify: (message: string) => void;
}) {
  const [editing, setEditing] = useState<Exercise | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  return (
    <section className="panel settings-section">
      <div className="section-heading">
        <h2>種目を整理</h2>
      </div>
      <p className="muted">
        名前を変更したり、使わない種目を非表示にできます。履歴と成長グラフは残ります。
      </p>
      <details className="exercise-management">
        <summary>種目一覧を開く（{data.exercises.length}種目）</summary>
        <div className="managed-exercises">
          {data.exercises.map((exercise) => (
            <div className="managed-exercise" key={exercise.id}>
              <div>
                <strong>{exercise.name}</strong>
                <span>
                  {exercise.group}
                  {exercise.hidden ? " · 非表示" : ""}
                </span>
              </div>
              <div className="manage-actions">
                <button
                  className="secondary"
                  disabled={blocked}
                  aria-label={`${exercise.name}の名前を変更`}
                  onClick={() => {
                    setEditing(exercise);
                    setName(exercise.name);
                    setError("");
                  }}
                >
                  名前を変更
                </button>
                <button
                  className="secondary"
                  disabled={
                    blocked ||
                    (!exercise.hidden &&
                      data.exercises.filter((e) => !e.hidden).length <= 1)
                  }
                  aria-label={`${exercise.name}を${exercise.hidden ? "再表示" : "非表示"}`}
                  onClick={() => {
                    if (
                      update((store) => {
                        const exercises = store.exercises.map((e) =>
                          e.id === exercise.id
                            ? { ...e, hidden: !e.hidden }
                            : e,
                        );
                        if (!exercises.some((e) => !e.hidden)) return store;
                        return {
                          ...store,
                          exercises,
                          selectedId:
                            exercises.find(
                              (e) => e.id === store.selectedId && !e.hidden,
                            )?.id ?? exercises.find((e) => !e.hidden)!.id,
                        };
                      })
                    )
                      notify(
                        exercise.hidden
                          ? "種目を再表示しました"
                          : "種目を非表示にしました。履歴は残っています",
                      );
                  }}
                >
                  {exercise.hidden ? "再表示" : "非表示"}
                </button>
              </div>
            </div>
          ))}
        </div>
        <p className="small-note left">少なくとも1種目は表示します。</p>
      </details>
      {editing && (
        <Modal title="種目の名前を変更" close={() => setEditing(null)}>
          <form
            className="stack"
            onSubmit={(event) => {
              event.preventDefault();
              const trimmed = name.trim();
              if (!trimmed || trimmed.length > 40) {
                setError("種目名を1〜40文字で入力してください。");
                return;
              }
              if (
                data.exercises.some(
                  (e) => e.id !== editing.id && e.name === trimmed,
                )
              ) {
                setError("同じ名前の種目があります。");
                return;
              }
              if (
                update((store) => ({
                  ...store,
                  exercises: store.exercises.map((e) =>
                    e.id === editing.id ? { ...e, name: trimmed } : e,
                  ),
                }))
              ) {
                setEditing(null);
                notify("種目名を変更しました");
              }
            }}
          >
            <label className="field-label">
              種目名
              <input
                autoFocus
                maxLength={40}
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </label>
            <p className="muted">
              これまでの履歴にも新しい名前が表示されます。
            </p>
            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}
            <button className="primary" type="submit" disabled={blocked}>
              名前を保存
            </button>
            <button
              className="text-button"
              type="button"
              onClick={() => setEditing(null)}
            >
              キャンセル
            </button>
          </form>
        </Modal>
      )}
    </section>
  );
}
