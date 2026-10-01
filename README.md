# 林彥宇電子名片

一頁式靜態網站。手機掃 QR 打開，就能存聯絡人、存名片圖、寫信、加 LINE，並看到三個專業領域。

- 正式網址：<https://jin40225-boop.github.io/card/>
- 依對象開啟：網址後面加 `?for=child`（01 兒少保護）、`?for=disability`（02 身心障礙）、`?for=adhd`（03 ADHD）
- 沒有框架、沒有打包、沒有後端。改完存檔，推上 GitHub 就上線。

## 檔案在做什麼

| 檔案 | 用途 |
|---|---|
| `index.html` | 主頁。所有文字與連結都寫在這裡 |
| `card.css` | 樣式。寬度 1024 以上是三欄，以下是三格手風琴 |
| `card.js` | 只管互動（手風琴、出示 QR、存名片圖、分享、複製信箱、版本水印）。這支壞掉，頁面仍然看得到、連結仍然能點 |
| `version.js` | 頁尾「版本 日期 · commit」的來源，由腳本產生 |
| `card-image.html` | 1080×1440 名片圖的原稿頁，用來截圖成 `assets/card-1080x1440.png` |
| `og.html` | 1200×630 分享預覽圖的原稿頁，用來截圖成 `assets/og.png` |
| `print.html` | 實體小卡（90×54 mm，正反兩頁），用來印成 PDF |
| `assets/lin-yanyu.vcf` | 「存入聯絡人」下載的檔案 |
| `assets/qr-card*.svg`、`.png` | 四張 QR（通用＋三個對象） |
| `assets/portrait-*.jpg` | 頭像 |
| `scripts/render-assets.ps1` | 重新產生兩張 PNG 與小卡 PDF |
| `scripts/build-version.ps1` | 重新產生 `version.js` |

`_spec/`（設計稿）與 `_out/`（截圖、PDF 等產出）不會進版控，也不會上線。

## 怎麼改文案

1. 用文字編輯器開 `index.html`，直接改中文字。
2. **有些字桌機版和手機版各寫了一份**（因為兩份設計稿用字不同）。標了 `only-d` 的只在電腦上顯示，標了 `only-m` 的只在手機上顯示。改到這種地方，兩份都要改：
   - 職稱那一行（桌機一行、手機拆兩行）
   - 「存入聯絡人／存聯絡人」「存名片圖到相簿／存名片圖」
   - 信箱與「複製」（桌機在名字下面、手機在按鈕下面）
3. 改連結：找到那張連結卡的 `href="..."`，換掉網址。
4. 改寫信的主旨：`mailto:` 連結裡 `subject=` 後面是編碼過的中文（一串 `%E4%BE...`）。不要手打，請 AI 幫你把新主旨轉成「URL 編碼」再貼上。
5. 如果改的是**名字、職稱、三個領域的標題或專長**，下面這幾個地方也有同樣的字，要一起改：
   - `card-image.html`、`og.html`（改完要重產圖，見下一節）
   - `print.html`（改完要重印 PDF）
   - `assets/lin-yanyu.vcf`（見下面）
   - `index.html` 最上面的 `<title>`、`description`、`og:title`、`og:description`

### 改聯絡人檔（vcf）

`assets/lin-yanyu.vcf` 是純文字，可以用記事本開。

- `FN`、`ORG`、`TITLE`、`EMAIL`、`URL`、`NOTE` 這幾行可以直接改冒號後面的字。
- `NOTE` 那行太長，被折成兩行（第二行開頭有一個空白）。要改的話，把兩行併回一行再改就好，不折行也合法。
- `PHOTO` 開頭之後那一大段英數字是照片，**不要動**。要換照片請 AI 用新的 `assets/portrait-200.jpg` 重產整個 vcf。
- 存檔時維持 UTF-8（無 BOM）、換行維持 Windows 格式（CRLF）。
- **不放電話**，這是刻意的。

## 怎麼重產圖

改了 `card-image.html`、`og.html` 或 `print.html` 之後要做。需要這台電腦有 Google Chrome，而且連得上網路（要載字體）。

在哪裡跑：PowerShell，資料夾 `C:\Dev\yanyu-card`。

```
cd C:\Dev\yanyu-card
```

```
powershell -ExecutionPolicy Bypass -File scripts\render-assets.ps1
```

不會問任何問題，大約半分鐘。跑完會看到三行 `OK`：

- `assets\card-1080x1440.png`（1080×1440）
- `assets\og.png`（1200×630）
- `_out\print.pdf`（兩頁，第 1 頁正面、第 2 頁反面，90×54 mm）

看到 `FAIL` 代表那張沒產成功，舊檔會保留不動。跑完請把兩張 PNG 打開看一眼：中文字體有沒有載入、有沒有破版。

## 版本水印

頁尾會顯示「版本 日期 · commit」，讓你一眼知道線上是哪一版。這行字來自 `version.js`；讀不到時會顯示「版本 未標記」。

每次要上線前，在 `C:\Dev\yanyu-card` 跑：

```
powershell -ExecutionPolicy Bypass -File scripts\build-version.ps1
```

它會把「目前最新一筆 commit 的短編號」和「今天日期」寫進 `version.js`。還沒有任何 commit 時會寫成 `dev`。

注意：`version.js` 記的是「跑腳本當下的最新 commit」。所以順序是先 commit 內容、再跑這支腳本、再把 `version.js` 單獨 commit 一次。頁尾顯示的編號會是「內容那一筆」的編號。

## 怎麼部署（GitHub Pages）

第一次：

1. 在 GitHub 帳號 `jin40225-boop` 底下開一個公開 repo，名字一定要叫 `card`（QR 已經印成這個網址，改名 QR 就要全部重產）。
2. 把這個資料夾推上去（main 分支）。
3. repo 的 Settings → Pages → Source 選「Deploy from a branch」，Branch 選 `main`、資料夾選 `/ (root)`，按 Save。
4. 等一兩分鐘，打開 <https://jin40225-boop.github.io/card/>。

之後每次更新，在 PowerShell（資料夾 `C:\Dev\yanyu-card`）一次跑一行：

```
git add -A
```

```
git commit -m "Update card content"
```

```
powershell -ExecutionPolicy Bypass -File scripts\build-version.ps1
```

```
git add version.js
```

```
git commit -m "Stamp version"
```

```
git push
```

上線後看頁尾的版本編號，和你剛剛 commit 的編號一樣，才是新版。不一樣就是瀏覽器還在用舊的，重新整理幾次或等一兩分鐘。

## 在自己電腦上先看

直接對 `index.html` 按兩下，用瀏覽器打開就能看版面、點連結、開 QR。

有兩件事在「直接開檔案」時和線上不一樣，這是正常的：

- 「存名片圖到相簿」裡的「儲存／分享圖片」會顯示「這個瀏覽器不能直接存，請長按圖片儲存」。因為瀏覽器不准網頁用程式讀本機檔案；放上 GitHub Pages 之後就正常。
- 「存入聯絡人」「分享」「複製」的行為以線上為準。

## 已知的限制

- LINE 內建瀏覽器常會擋下載與分享。所以「存名片圖」的覆層直接把圖顯示出來，**長按圖片儲存**是保底做法。
- 沒有 JavaScript 時：三格全部展開、所有連結可點；「分享」和「複製」兩顆按鈕會藏起來（它們沒有 JS 就沒作用）；「存名片圖」和「出示 QR」會直接打開圖檔。
- `assets/` 裡的四張 QR 都指向 `https://jin40225-boop.github.io/card/`（和三個 `?for=`）。網址一變，QR、名片圖、小卡都要重產。
