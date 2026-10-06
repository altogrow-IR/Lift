import { test, expect, type Page } from "@playwright/test";
const key = "lift.training.v1";
const menu = (page: Page, label: string) =>
  page.locator(".mobile-nav").getByRole("button", { name: label, exact: true });
const getSets = (page: Page) =>
  page.evaluate(
    (storageKey) =>
      JSON.parse(localStorage.getItem(storageKey) || '{"sets":[]}').sets,
    key,
  );
test.beforeEach(async ({ page }) => {
  await page.goto("./");
  await expect(
    page.getByRole("heading", { name: "今日のトレーニング" }),
  ).toBeVisible();
});

test("素早い記録・入力引き継ぎ・自己ベスト・再読み込み・Undo", async ({
  page,
}) => {
  await page.getByRole("textbox", { name: "重量", exact: true }).fill("32.5");
  await page.getByRole("textbox", { name: "回数", exact: true }).fill("12");
  await page.getByRole("button", { name: "1セット記録する" }).click();
  await expect(page.locator(".today-stats")).toContainText("12");
  await expect(page.getByRole("timer")).toContainText("1:");
  await page.getByRole("button", { name: "回数を減らす" }).click();
  await page.getByRole("button", { name: "1セット記録する" }).click();
  expect((await getSets(page)).length).toBe(2);
  await page.getByRole("button", { name: "重量を増やす" }).click();
  await page.getByRole("button", { name: "1セット記録する" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "自己ベスト更新" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "元に戻す", exact: true }).click();
  expect((await getSets(page)).length).toBe(2);
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "重量", exact: true }),
  ).toHaveValue("32.5");
  await expect(
    page.getByRole("textbox", { name: "回数", exact: true }),
  ).toHaveValue("11");
  await expect(page.locator(".today-panel .set-row")).toHaveCount(2);
});

test("編集・削除と復元・履歴のフィルター", async ({ page }) => {
  await page.getByRole("button", { name: "1セット記録する" }).click();
  await page.locator(".set-row").click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("dialog")
    .getByRole("textbox", { name: "重量", exact: true })
    .fill("50");
  await page.getByRole("button", { name: "変更を保存" }).click();
  await expect(page.locator(".set-row")).toContainText("50 kg");
  await page.locator(".set-row").click();
  await page.getByRole("button", { name: "このセットを削除" }).click();
  await expect(page.locator(".set-row")).toHaveCount(0);
  await page.getByRole("button", { name: "元に戻す", exact: true }).click();
  await expect(page.locator(".set-row")).toHaveCount(1);
  await menu(page, "履歴").click();
  await expect(page.locator(".history-day")).toHaveCount(1);
  await page.getByLabel("履歴の種目").selectOption("squat");
  await expect(page.getByText("条件に合う記録がありません")).toBeVisible();
  await page.getByLabel("履歴の種目").selectOption("bench");
  await expect(page.locator(".history-sets")).toContainText("50 kg");
});

test("自重と時間・自作種目・入力不正値", async ({ page }) => {
  await page
    .getByRole("button", { name: /胸 \/ ウエイト ベンチプレス/ })
    .click();
  await page.getByRole("button", { name: /腕立て伏せ/ }).click();
  await expect(
    page.getByRole("textbox", { name: "重量", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "1セット記録する" }).click();
  await page.locator(".exercise-select").click();
  await page.getByRole("button", { name: /プランク/ }).click();
  await page.getByRole("textbox", { name: "時間", exact: true }).fill("45");
  await page.getByRole("button", { name: "1セット記録する" }).click();
  await expect(page.locator(".today-list")).toContainText("45 秒");
  await page.locator(".exercise-select").click();
  await page.getByRole("button", { name: "自分の種目を追加" }).click();
  await page.getByLabel("種目名", { exact: true }).fill("ダンベルフライ");
  await page.getByRole("button", { name: "種目を追加", exact: true }).click();
  await expect(page.locator(".exercise-title")).toContainText("ダンベルフライ");
  await page.getByRole("textbox", { name: "回数", exact: true }).fill("1.5");
  await page.getByRole("button", { name: "1セット記録する" }).click();
  await expect(page.getByRole("alert")).toContainText("整数");
  expect((await getSets(page)).length).toBe(2);
  await page.getByRole("textbox", { name: "回数", exact: true }).fill("10");
  await page.getByRole("button", { name: "1セット記録する" }).click();
  expect((await getSets(page)).length).toBe(3);
  await page.reload();
  await expect(page.locator(".exercise-title")).toContainText("ダンベルフライ");
});

test("過去日・前回の入力・重量と総負荷のグラフ", async ({ page }) => {
  const pastDate = (days: number) =>
    page.evaluate((n) => {
      const d = new Date();
      d.setDate(d.getDate() - n);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }, days);
  await page.getByLabel("記録する日付").fill(await pastDate(5));
  await page.getByRole("textbox", { name: "重量", exact: true }).fill("25");
  await page.getByRole("textbox", { name: "回数", exact: true }).fill("8");
  await page.getByRole("button", { name: "1セット記録する" }).click();
  await page.getByLabel("記録する日付").fill(await pastDate(4));
  await expect(page.locator(".previous-record")).toContainText("25 kg × 8 回");
  await page.getByRole("textbox", { name: "重量", exact: true }).fill("30");
  await page.getByRole("button", { name: "1セット記録する" }).click();
  await page.getByRole("button", { name: "1セット記録する" }).click();
  await menu(page, "成長").click();
  await expect(page.locator(".chart-value")).toContainText("30");
  await expect(page.locator(".growth-note")).toContainText("+5");
  await page.getByRole("button", { name: "総負荷", exact: true }).click();
  await expect(page.locator(".chart-value")).toContainText("480");
  await page.getByText("グラフの数値を一覧で見る").click();
  await expect(page.locator("table")).toContainText("200");
  await expect(page.locator("table")).toContainText("480");
  await page.getByLabel("グラフで確認する日").fill("0");
  await expect(page.locator(".chart-value")).toContainText("200");
});

test("バックアップ往復と復元前の確認・不正ファイル拒否", async ({ page }) => {
  await page.getByRole("button", { name: "1セット記録する" }).click();
  await menu(page, "設定").click();
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "バックアップを保存", exact: true })
    .click();
  const result = await download;
  expect(result.suggestedFilename()).toMatch(/^lift-backup-/);
  const backup = await page.evaluate(
    (storageKey) => localStorage.getItem(storageKey)!,
    key,
  );
  await page.locator("input[type=file]").setInputFiles({
    name: "broken.json",
    mimeType: "application/json",
    buffer: Buffer.from("{bad"),
  });
  await expect(page.getByRole("alert")).toContainText("復元できません");
  const empty = JSON.parse(backup);
  empty.sets = [];
  await page.locator("input[type=file]").setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(empty)),
  });
  await expect(page.getByRole("dialog")).toContainText("0セット");
  expect((await getSets(page)).length).toBe(1);
  await page.getByRole("button", { name: "キャンセル" }).click();
  expect((await getSets(page)).length).toBe(1);
  await page.locator("input[type=file]").setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(empty)),
  });
  await page
    .getByRole("button", { name: "このバックアップを復元", exact: true })
    .click();
  expect((await getSets(page)).length).toBe(0);
  await page.locator("input[type=file]").setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(backup),
  });
  await page
    .getByRole("button", { name: "このバックアップを復元", exact: true })
    .click();
  expect((await getSets(page)).length).toBe(1);
});

test("壊れた保存を上書きせずに復元できる", async ({ page }) => {
  await page.evaluate(
    (storageKey) => localStorage.setItem(storageKey, "{broken"),
    key,
  );
  await page.reload();
  await expect(page.getByRole("alert")).toContainText(
    "元のデータは上書きしていません",
  );
  await expect(
    page.getByRole("button", { name: "1セット記録する" }),
  ).toBeDisabled();
  expect(
    await page.evaluate((storageKey) => localStorage.getItem(storageKey), key),
  ).toBe("{broken");
  await menu(page, "設定").click();
  await page.getByRole("button", { name: "初期化する", exact: true }).click();
  await page.getByRole("button", { name: "キャンセル" }).click();
  expect(
    await page.evaluate((storageKey) => localStorage.getItem(storageKey), key),
  ).toBe("{broken");
  await page.getByRole("button", { name: "初期化する", exact: true }).click();
  await page.getByRole("button", { name: "すべて削除して初期化" }).click();
  await menu(page, "記録").click();
  await expect(
    page.getByRole("button", { name: "1セット記録する" }),
  ).toBeEnabled();
});

test("保存失敗時に成功表示を出さず入力を保持する", async ({ page }) => {
  await page.getByRole("textbox", { name: "重量", exact: true }).fill("42.5");
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    };
  });
  await page.getByRole("button", { name: "1セット記録する" }).click();
  await expect(page.getByRole("alert")).toContainText("保存できませんでした");
  await expect(
    page.getByRole("textbox", { name: "重量", exact: true }),
  ).toHaveValue("42.5");
  await expect(page.locator(".today-panel .set-row")).toHaveCount(0);
  await expect(page.locator(".toast")).toHaveCount(0);
});

test("サンプルが実記録を変更しない・空状態・グラフの1点", async ({ page }) => {
  await menu(page, "成長").click();
  await expect(page.getByText("あなたの成長は、ここから。")).toBeVisible();
  await menu(page, "設定").click();
  await page
    .getByRole("button", { name: "成長グラフのサンプルを見る" })
    .click();
  await expect(page.locator(".demo-banner")).toBeVisible();
  await expect(page.locator(".trend-svg")).toBeVisible();
  expect((await getSets(page)).length).toBe(0);
  await page.getByRole("button", { name: "サンプルを閉じる" }).click();
  await expect(page.getByText("あなたの成長は、ここから。")).toBeVisible();
  await menu(page, "記録").click();
  await page.getByRole("button", { name: "1セット記録する" }).click();
  await menu(page, "成長").click();
  await expect(page.locator(".trend-svg")).toBeVisible();
  await expect(page.getByLabel("グラフで確認する日")).toBeDisabled();
});

test("休憩の再読み込みと期限超過・OFF設定", async ({ page }) => {
  await page.getByRole("button", { name: "1セット記録する" }).click();
  await page.reload();
  await expect(page.getByRole("timer")).toBeVisible();
  await page.clock.install();
  await page.clock.fastForward(100000);
  await expect(page.getByText("休憩終了。次のセットへ！")).toBeVisible();
  await page.getByRole("button", { name: "OFF", exact: true }).click();
  await page.getByRole("button", { name: "1セット記録する" }).click();
  await expect(page.getByRole("timer")).toHaveCount(0);
});

test("別タブの更新を読み込み同時利用の記録を保持する", async ({
  page,
  context,
}) => {
  const other = await context.newPage();
  await other.goto("./");
  await page.getByRole("button", { name: "1セット記録する" }).click();
  await expect(other.locator(".set-row")).toHaveCount(1);
  await other.getByRole("button", { name: "1セット記録する" }).click();
  await expect(page.locator(".set-row")).toHaveCount(2);
  expect((await getSets(page)).length).toBe(2);
  await other.close();
});

for (const width of [320, 375, 390, 430, 768, 1024, 1440]) {
  test(`${width}px: メニュー・モーダルで横にはみ出さずコンソールエラーなし`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    await page.setViewportSize({ width, height: 900 });
    const nav =
      width > 800 ? page.locator(".sidebar nav") : page.locator(".mobile-nav");
    const overflow = async () =>
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    await overflow();
    if (width === 375 || width === 390 || width === 430) {
      await page.setViewportSize({ width, height: 844 });
      const save = await page
        .getByRole("button", { name: "1セット記録する" })
        .boundingBox();
      const bottomNav = await page.locator(".mobile-nav").boundingBox();
      expect(save!.y + save!.height).toBeLessThanOrEqual(bottomNav!.y);
    }
    await page.locator(".exercise-select").click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await overflow();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await nav
      .getByRole("button", {
        name: width > 800 ? "成長を見る" : "成長",
        exact: true,
      })
      .click();
    await overflow();
    await nav
      .getByRole("button", {
        name: width > 800 ? "トレーニング履歴" : "履歴",
        exact: true,
      })
      .click();
    await overflow();
    await nav
      .getByRole("button", {
        name: width > 800 ? "設定とデータ" : "設定",
        exact: true,
      })
      .click();
    await page
      .getByRole("button", { name: "成長グラフのサンプルを見る" })
      .click();
    await expect(page.locator(".trend-svg")).toBeVisible();
    await overflow();
    if (width === 390 || width === 1440) {
      await page.screenshot({
        path: `.qa/progress-${width}.png`,
        fullPage: true,
      });
      await nav
        .getByRole("button", {
          name: width > 800 ? "トレーニングを記録" : "記録",
          exact: true,
        })
        .click();
      await page.screenshot({
        path: `.qa/record-${width}.png`,
        fullPage: true,
      });
    }
    expect(errors).toEqual([]);
  });
}

test("入力途中の値はメニュー・種目切り替え・リロードで保持される", async ({
  page,
}) => {
  const weight = page.getByRole("textbox", { name: "重量", exact: true });
  await weight.fill("42.5");
  await page.getByRole("textbox", { name: "回数", exact: true }).fill("7");
  await menu(page, "成長").click();
  await menu(page, "記録").click();
  await expect(weight).toHaveValue("42.5");
  await page
    .locator(".quick-exercises")
    .getByRole("button", { name: "スクワット", exact: true })
    .click();
  await weight.fill("65");
  await page
    .locator(".quick-exercises")
    .getByRole("button", { name: "ベンチプレス", exact: true })
    .click();
  await expect(weight).toHaveValue("42.5");
  await expect(
    page.getByRole("textbox", { name: "回数", exact: true }),
  ).toHaveValue("7");
  await page.reload();
  await expect(weight).toHaveValue("42.5");
  expect((await getSets(page)).length).toBe(0);
  await page.getByRole("button", { name: "1セット記録する" }).click();
  expect((await getSets(page))[0].weight).toBe(42.5);
});

test("成長画面から選択中の種目を記録する", async ({ page }) => {
  await menu(page, "成長").click();
  await page.getByLabel("グラフの種目").selectOption("squat");
  await page
    .getByRole("button", { name: "トレーニングを記録する", exact: true })
    .click();
  await expect(page.locator(".exercise-title")).toContainText("スクワット");
  await page.getByRole("button", { name: "1セット記録する" }).click();
  await menu(page, "成長").click();
  await page
    .getByRole("button", { name: "スクワットを記録する", exact: true })
    .click();
  await expect(page.locator(".exercise-title")).toContainText("スクワット");
});

test("種目名の変更・非表示・再表示で履歴を保持する", async ({ page }) => {
  await page.getByRole("button", { name: "1セット記録する" }).click();
  await menu(page, "設定").click();
  await page.getByText("種目一覧を開く（8種目）", { exact: true }).click();
  await page
    .getByRole("button", { name: "ベンチプレスの名前を変更", exact: true })
    .click();
  await page.getByLabel("種目名", { exact: true }).fill("ベンチ（ジム）");
  await page.getByRole("button", { name: "名前を保存", exact: true }).click();
  await page
    .getByRole("button", { name: "ベンチ（ジム）を非表示", exact: true })
    .click();
  await menu(page, "記録").click();
  await expect(page.locator(".exercise-title")).toContainText("スクワット");
  await page.locator(".exercise-select").click();
  await expect(page.getByRole("dialog")).not.toContainText("ベンチ（ジム）");
  await page.keyboard.press("Escape");
  await menu(page, "履歴").click();
  await expect(page.locator(".history-list")).toContainText("ベンチ（ジム）");
  expect((await getSets(page)).length).toBe(1);
  await page.reload();
  await menu(page, "設定").click();
  await page.getByText("種目一覧を開く（8種目）", { exact: true }).click();
  await page
    .getByRole("button", { name: "ベンチ（ジム）を再表示", exact: true })
    .click();
  await menu(page, "記録").click();
  await page.locator(".exercise-select").click();
  await expect(page.getByRole("dialog")).toContainText("ベンチ（ジム）");
});

test("前回比・全期間自己ベスト・前回の全セットの値が正しい", async ({
  page,
}) => {
  const date = await page.getByLabel("記録する日付").inputValue();
  await page.evaluate(
    ({ key, date }) => {
      const state = {
        version: 1,
        exercises: [
          { id: "bench", name: "ベンチプレス", group: "胸", kind: "weight" },
        ],
        selectedId: "bench",
        restSeconds: 0,
        sets: [
          {
            id: "a",
            exerciseId: "bench",
            date: "2025-01-01",
            weight: 80,
            reps: 3,
            seconds: 0,
            createdAt: 1,
          },
          {
            id: "b",
            exerciseId: "bench",
            date: "2025-01-02",
            weight: 50,
            reps: 10,
            seconds: 0,
            createdAt: 2,
          },
          {
            id: "c",
            exerciseId: "bench",
            date: "2025-01-02",
            weight: 45,
            reps: 8,
            seconds: 0,
            createdAt: 3,
          },
          {
            id: "d",
            exerciseId: "bench",
            date,
            weight: 60,
            reps: 10,
            seconds: 0,
            createdAt: 4,
          },
        ],
      };
      localStorage.setItem(key, JSON.stringify(state));
    },
    { key, date },
  );
  await page.reload();
  await menu(page, "成長").click();
  await expect(page.locator(".comparison-grid")).toContainText("+10 kg");
  await expect(page.locator(".comparison-grid")).toContainText("80 kg");
  await expect(page.locator(".previous-sets li")).toHaveCount(2);
  await expect(page.locator(".previous-sets")).toContainText("50 kg × 10 回");
  await expect(page.locator(".previous-sets")).toContainText("45 kg × 8 回");
  await page.getByRole("button", { name: "総負荷", exact: true }).click();
  await expect(page.locator(".comparison-grid")).toContainText("-260 kg・回");
});

test("日付ごとの入力保持・過去日の記録後も同じ値で続けられる", async ({
  page,
}) => {
  const date = page.getByLabel("記録する日付");
  const today = await date.inputValue();
  const weight = page.getByRole("textbox", { name: "重量", exact: true });
  await weight.fill("70");
  await page.getByRole("button", { name: "1セット記録する" }).click();
  await date.fill("2025-01-01");
  await weight.fill("35");
  await menu(page, "成長").click();
  await menu(page, "記録").click();
  await expect(date).toHaveValue("2025-01-01");
  await expect(weight).toHaveValue("35");
  await page.getByRole("button", { name: "1セット記録する" }).click();
  await expect(weight).toHaveValue("35");
  await date.fill(today);
  await expect(weight).toHaveValue("70");
});

test("初期化で下書きを消去し、最後の表示種目は非表示にできない", async ({
  page,
}) => {
  const weight = page.getByRole("textbox", { name: "重量", exact: true });
  await weight.fill("99");
  await menu(page, "設定").click();
  await page.getByRole("button", { name: "初期化する", exact: true }).click();
  await page
    .getByRole("button", { name: "すべて削除して初期化", exact: true })
    .click();
  await menu(page, "記録").click();
  await expect(weight).toHaveValue("20");
  await page.reload();
  await expect(weight).toHaveValue("20");
  await menu(page, "設定").click();
  await page.getByText("種目一覧を開く（8種目）", { exact: true }).click();
  const buttons = page
    .locator(".manage-actions button")
    .filter({ hasText: "非表示" });
  for (let i = 0; i < 7; i++) await buttons.first().click();
  await expect(buttons.last()).toBeDisabled();
});

for (const kind of ["bodyweight", "time"]) {
  test(kind + ": 前回比と自己ベストを適切な単位で表示", async ({ page }) => {
    await page.evaluate(
      ({ key, kind }) => {
        const sets = [10, 15].map((value, i) => ({
          id: String(i),
          exerciseId: "custom",
          date: "2025-01-0" + (i + 1),
          weight: 0,
          reps: kind === "bodyweight" ? value : 0,
          seconds: kind === "time" ? value : 0,
          createdAt: i,
        }));
        localStorage.setItem(
          key,
          JSON.stringify({
            version: 1,
            exercises: [{ id: "custom", name: "検証用", group: "全身", kind }],
            sets,
            selectedId: "custom",
            restSeconds: 0,
          }),
        );
      },
      { key, kind },
    );
    await page.reload();
    await menu(page, "成長").click();
    const unit = kind === "time" ? "秒" : "回";
    await expect(page.locator(".comparison-grid")).toContainText("+5 " + unit);
    await expect(page.locator(".comparison-grid")).toContainText("15 " + unit);
    await expect(page.locator(".previous-sets li")).toHaveCount(1);
  });
}
