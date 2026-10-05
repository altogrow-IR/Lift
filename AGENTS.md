# LIFT プロジェクト指示

- 目的：トレーニング中に少ない操作でセットを記録し、日々の成長を実感できる個人用アプリ。
- React / TypeScript / Vite。無料、サーバーレス、ログイン・APIキー不要。外部フォントや画像に依存しない。
- モバイル最優先。記録・成長・履歴・設定の4メニュー。記録中の操作を増やす変更は避ける。
- データモデルは `src/lib/model.ts`。localStorageキー `lift.training.v1`、Store.version=1。種目IDを履歴の参照に使い、表示名へ依存しない。
- 保存処理は `src/hooks/useStore.ts`。保存に成功した場合だけ画面を更新する。破損データ・未知バージョンを初期値で自動上書きしない。
- バックアップ復元・初期化には確認を入れる。サンプルデータは保存しない。
- 重量・回数・時間の記録形式を保つ。最高重量は日ごとの最大値、総負荷は日ごとの重量×回数の合計。
- Vite.baseは `./`。URLルーティングを追加する場合はGitHub Pagesでのリロード404を考慮する。
- 変更後は `npm test`、`npm run build`。UI・保存変更ではプレビューを起動して `npm run test:browser` も実行する。
- Playwrightは既定でWindowsのEdgeを使う。他環境はPLAYWRIGHT_CHANNELとTEST_URLで調整する。
- ブラウザ幅の検証と、実機のiPhone／Androidの検証を区別して報告する。
