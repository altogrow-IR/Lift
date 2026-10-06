import { useState } from "react";
import { LIMITS, type Exercise, type ExerciseKind } from "../lib/model";
import { Icon } from "./Icon";
import { Modal } from "./Modal";
export function ExercisePicker({
  exercises,
  selectedId,
  close,
  select,
  add,
}: {
  exercises: Exercise[];
  selectedId: string;
  close: () => void;
  select: (id: string) => boolean;
  add: (exercise: Exercise) => boolean;
}) {
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [group, setGroup] = useState("その他");
  const [kind, setKind] = useState<ExerciseKind>("weight");
  const [error, setError] = useState("");
  return (
    <Modal title={creating ? "自分の種目を追加" : "種目を選ぶ"} close={close}>
      {creating ? (
        <form
          className="stack"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) {
              setError("種目名を入力してください。");
              return;
            }
            if (exercises.some((ex) => ex.name === name.trim())) {
              setError(
                "同じ名前の種目があります。種目一覧から選んでください。",
              );
              return;
            }
            const exercise: Exercise = {
              id: crypto.randomUUID(),
              name: name.trim(),
              group,
              kind,
            };
            if (add(exercise)) close();
          }}
        >
          <label className="field-label">
            種目名
            <input
              autoFocus
              value={name}
              maxLength={40}
              onChange={(e) => setName(e.target.value)}
              placeholder="例：ダンベルフライ"
              required
            />
          </label>
          <label className="field-label">
            部位
            <select value={group} onChange={(e) => setGroup(e.target.value)}>
              {["胸", "背中", "脚", "肩", "腕", "体幹", "全身", "その他"].map(
                (g) => (
                  <option key={g}>{g}</option>
                ),
              )}
            </select>
          </label>
          <label className="field-label">
            記録する内容
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as ExerciseKind)}
            >
              <option value="weight">重量（kg）と回数</option>
              <option value="bodyweight">回数のみ（自重）</option>
              <option value="time">時間（秒）</option>
            </select>
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="primary" type="submit">
            <Icon name="plus" />
            種目を追加
          </button>
          <button
            className="text-button"
            type="button"
            onClick={() => setCreating(false)}
          >
            種目一覧に戻る
          </button>
        </form>
      ) : (
        <>
          <input
            className="search"
            aria-label="種目を検索"
            placeholder="種目名・部位で検索"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <div className="exercise-list">
            {exercises
              .filter((e) => !e.hidden && `${e.name}${e.group}`.includes(query))
              .map((e) => (
                <button
                  key={e.id}
                  className={`exercise-option ${e.id === selectedId ? "selected" : ""}`}
                  onClick={() => {
                    if (select(e.id)) close();
                  }}
                >
                  <span className="exercise-symbol">
                    <Icon name="dumbbell" />
                  </span>
                  <span>
                    <strong>{e.name}</strong>
                    <small>
                      {e.group} ·{" "}
                      {e.kind === "time"
                        ? "時間"
                        : e.kind === "bodyweight"
                          ? "自重"
                          : "重量・回数"}
                    </small>
                  </span>
                  {e.id === selectedId && <Icon name="check" />}
                </button>
              ))}
            {!exercises.some(
              (e) => !e.hidden && `${e.name}${e.group}`.includes(query),
            ) && (
              <p className="muted">
                該当する種目がありません。新しく追加できます。
              </p>
            )}
          </div>
          <button
            className="secondary full"
            onClick={() => {
              setName(query);
              setCreating(true);
            }}
            disabled={exercises.length >= LIMITS.exercises}
          >
            <Icon name="plus" />
            自分の種目を追加
          </button>
        </>
      )}
    </Modal>
  );
}
