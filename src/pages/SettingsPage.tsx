import { useRef, useState } from "react";
import { Icon } from "../components/Icon";
import { ExerciseManager } from "../components/ExerciseManager";
import { Modal } from "../components/Modal";
import {
  freshStore,
  localDate,
  parseStore,
  STORAGE_KEY,
  type Store,
} from "../lib/model";

function download(text: string, name: string) {
  const url = URL.createObjectURL(
    new Blob([text], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function SettingsPage({
  data,
  blocked,
  restore,
  notify,
  showDemo,
  update,
}: {
  data: Store;
  blocked: boolean;
  restore: (s: Store) => boolean;
  notify: (s: string) => void;
  showDemo: () => void;
  update: (change: (store: Store) => Store) => boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Store | null>(null);
  const [error, setError] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const [reading, setReading] = useState(false);
  const exportData = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (blocked && !raw) {
        setError("救出できる保存データが見つかりませんでした。");
        return;
      }
      const content = blocked
        ? raw!
        : JSON.stringify(raw ? parseStore(raw) : data, null, 2);
      download(
        content,
        `lift-${blocked ? "recovery-" : "backup-"}${localDate()}.json`,
      );
      notify("バックアップのダウンロードを開始しました");
    } catch {
      setError(
        "データを取り出せませんでした。ブラウザの保存設定を確認してください。",
      );
    }
  };
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">MADE FOR YOU</p>
          <h1>
            設定とデータ<span className="heading-dot">.</span>
          </h1>
          <p className="subtitle">大切な記録を、手元に残しておこう。</p>
        </div>
        <span className="header-icon">
          <Icon name="settings" size={28} />
        </span>
      </div>
      <ExerciseManager
        data={data}
        blocked={blocked}
        update={update}
        notify={notify}
      />
      <section className="panel settings-section">
        <div className="section-heading">
          <h2>記録のバックアップ</h2>
          <Icon name="download" size={20} />
        </div>
        <p className="muted">
          記録はこの端末・このブラウザ内に保存されます。機種変更やブラウザのデータ削除に備えて、定期的にバックアップしてください。
        </p>
        <div className="backup-summary">
          <span>{data.sets.length} セット</span>
          <span>{data.exercises.length} 種目</span>
          <span>ログイン不要</span>
        </div>
        <div className="settings-actions">
          <button className="primary" onClick={exportData}>
            <Icon name="download" size={19} />
            {blocked ? "元の保存データを救出" : "バックアップを保存"}
          </button>
          <button
            className="secondary"
            disabled={reading}
            onClick={() => fileRef.current?.click()}
          >
            <Icon name="upload" size={19} />
            {reading ? "読み込み中…" : "バックアップから復元"}
          </button>
        </div>
        <input
          type="file"
          ref={fileRef}
          hidden
          accept=".json,application/json"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            setError("");
            if (file.size > 20 * 1024 * 1024) {
              setError(
                "ファイルが大きすぎます。20MB以下のLIFTバックアップを選んでください。",
              );
              return;
            }
            setReading(true);
            try {
              setPending(parseStore(await file.text()));
            } catch {
              setError(
                "このファイルは復元できません。LIFTで保存した正しいバックアップファイルを選んでください。",
              );
            } finally {
              setReading(false);
            }
          }}
        />
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
      </section>
      <section className="panel settings-section">
        <div className="section-heading">
          <h2>アプリについて</h2>
          <span className="mini-label">LIFT / 01</span>
        </div>
        <div className="about-row">
          <span className="about-mark">
            L<span>.</span>
          </span>
          <div>
            <strong>自分のためのトレーニングノート</strong>
            <p className="muted">
              記録は短く、成長は長く。
              <br />
              自分のペースで、少しずつ。
            </p>
          </div>
        </div>
        <button className="secondary" onClick={showDemo}>
          <Icon name="chart" size={19} />
          成長グラフのサンプルを見る
        </button>
        <p className="small-note left">
          サンプルはあなたの記録に保存されません。
        </p>
      </section>
      <section className="reset-section">
        <div>
          <h2>データを初期化</h2>
          <p className="muted">すべての記録と追加した種目を削除します。</p>
        </div>
        <button className="danger-text" onClick={() => setConfirmReset(true)}>
          初期化する
        </button>
      </section>
      {pending && (
        <Modal
          title="バックアップを復元しますか？"
          close={() => setPending(null)}
        >
          <div className="stack">
            <p>
              バックアップには
              <strong>
                {pending.sets.length}セット・{pending.exercises.length}種目
              </strong>
              が含まれています。
            </p>
            <p className="muted">
              現在の記録はこのバックアップで置き換わります。必要なら先に現在のバックアップを保存してください。
            </p>
            <button className="secondary" onClick={exportData}>
              <Icon name="download" size={18} />
              現在のデータを保存
            </button>
            <button
              className="primary"
              onClick={() => {
                if (restore(pending)) {
                  setPending(null);
                  notify("バックアップを復元しました");
                }
              }}
            >
              このバックアップを復元
            </button>
            <button className="text-button" onClick={() => setPending(null)}>
              キャンセル
            </button>
          </div>
        </Modal>
      )}
      {confirmReset && (
        <Modal
          title="すべてのデータを初期化しますか？"
          close={() => setConfirmReset(false)}
        >
          <div className="stack">
            <p>
              記録と追加した種目がすべて削除されます。この操作は元に戻せません。
            </p>
            <button className="secondary" onClick={exportData}>
              <Icon name="download" size={18} />
              先にバックアップを保存
            </button>
            <button
              className="danger-button"
              onClick={() => {
                if (restore(freshStore())) {
                  setConfirmReset(false);
                  notify("データを初期化しました");
                }
              }}
            >
              すべて削除して初期化
            </button>
            <button
              className="text-button"
              onClick={() => setConfirmReset(false)}
            >
              キャンセル
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
