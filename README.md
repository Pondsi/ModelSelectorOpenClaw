# PCL Model Picker

**Two-column supplier/model picker enhancement for the OpenClaw Control UI — DeepSeek Harness (dsh), Claude Code, OpenClaw, Cursor, Dify, Ollama and any Agent Skills host**

[English](#english) | [简体中文](#简体中文) | [繁體中文](#繁體中文) | [日本語](#日本語) | [한국어](#한국어) | [Français](#français) | [Español](#español) | [Русский](#русский)

---

> ⚠️ **Disclosure — Intended Behavior / 预期行为披露**
>
> **EN** — This skill patches the **local** OpenClaw installation. By design it performs
> exactly three local file operations inside `…/node_modules/openclaw/dist/control-ui/`:
>
> | Operation | Scope control |
> |-----------|---------------|
> | Append/replace ONE `<script>` line at the end of `index.html` | first run backs up `index.html.bak-pcl`; idempotent; `-Remove` reverts |
> | Copy `pcl-model-picker.v4.js` into `assets/` | versioned filename, Service Worker cache-first safe |
> | Delete older `pcl-model-picker.v*.js` files | keeps the newest TWO versions; deletes only files matching that pattern |
>
> No packaged code is modified. No network access, no telemetry. The injected script runs
> in your **browser** only and only touches the model picker's DOM. The patch is lost when
> OpenClaw is upgraded — re-run to restore. **Installing means accepting these local file
> modifications.**
>
> **中文** — 本技能会修改**本地** OpenClaw 安装目录，按设计只做三件事：在 `index.html`
> 末尾追加/替换一行 `<script>` 标签（首次运行自动备份，`-Remove` 一键还原）；向
> `assets/` 复制一个带版本号的增强脚本；清理旧版本脚本（只删匹配
> `pcl-model-picker.v*.js` 的文件，保留最近两版）。不修改任何打包代码，不联网、无遥测；
> 注入脚本只在你的浏览器里运行、只作用于模型选择器的 DOM。OpenClaw 升级后补丁会丢失，
> 重跑即可恢复。**安装即表示接受上述本地文件修改。**

## Permissions / 权限声明

| Capability | Used for |
|-----------|----------|
| Shell / process | Running `scripts/pcl-patch.ps1` (PowerShell 5.1+ or pwsh) |
| File read | Reading `index.html` to detect an existing injection |
| File write | Writing the tag line, the backup, and the `assets/pcl-model-picker.v*.js` file |

**Not used, not declared: network, MCP.** Nothing leaves the machine.

## English

### What is this?

PCL Model Picker is a portable AI-agent skill (a standard `SKILL.md` bundle) that upgrades
the chat model picker of the **OpenClaw Control UI** (the web console) from the official
long, provider-grouped flat list into a **two-column master-detail layout**: provider chips
on the left, only the selected provider's models on the right, each column with its own
scroll container. It also hides the official "account used by this chat" row (e.g.
`deepseek:default`) inside the picker — it is unrelated to picking a provider or model.

It runs on **any Agent Skills host** — first-class support for **DeepSeek Harness (dsh)**
(drop it into `~/.agents/skills/`), plus OpenClaw, Claude Code, Cursor, Dify, Ollama and
custom agents. The host only needs to be able to run one PowerShell command.

### What problem it solves

- **Too many models, too much scrolling** — with dozens of models across many providers the
  flat list buries your target; two clicks (provider → model) reach it directly.
- **Scroll coupling** — both columns scroll independently (structural CSS Grid, not
  patch-style positioning), so the wheel always scrolls exactly the column you are in.
- **Confusing account row** — the official picker shows the resolved credential account
  (e.g. `deepseek:default`) even when it has nothing to do with your model choice; it is
  hidden in this layout.
- **Theme mismatch** — everything uses official design tokens (`--bg-hover`, `--accent`,
  `--border`), so dark/light/custom themes follow automatically.

### Quick start

```powershell
# Install / repair (idempotent — safe to re-run)
powershell -ExecutionPolicy Bypass -File scripts\pcl-patch.ps1
```

1. The script auto-detects the Control UI directory (`npm root -g`, common npm prefixes,
   the `openclaw` CLI on PATH). Non-standard layout: add `-Dist "<...>\dist\control-ui"`.
2. When it prints `Done`, press **Ctrl+F5** in the Control UI browser tab (the Service
   Worker caches assets — a hard reload guarantees the new script loads).
3. Open the chat model picker: provider chips on the left, that provider's models on the
   right, no account row.

```powershell
# Uninstall
powershell -ExecutionPolicy Bypass -File scripts\pcl-patch.ps1 -Remove
```

OpenClaw upgrades overwrite `dist/control-ui/` and the patch disappears — just re-run the
install command. If you ever edit the JS, you MUST bump the versioned filename
(`v4` → `v5` …), because the Service Worker is cache-first for `/assets/`.

### Is it safe?

- **Three file operations only**, all inside the OpenClaw package directory and all
  reversible (see the disclosure table above; first run keeps `index.html.bak-pcl`).
- **Local only**: no network code, no telemetry, no upload. The enhancement is a plain
  browser-side IIFE with zero dependencies.
- **Narrow blast radius**: it only changes the model picker's layout/DOM — it never touches
  sessions, config, keys or other pages.
- **Clean uninstall**: `-Remove` restores the stock UI; reinstalling OpenClaw does too.

### License

MIT License with a **mandatory attribution requirement** — any use, including modified
variants, must credit **Pondsi**. See [LICENSE](LICENSE).

---

## 简体中文

### 这是什么？

PCL Model Picker 是一个可移植的 AI Agent Skill（标准 `SKILL.md` 格式），把 **OpenClaw
Control UI**（网页控制台）聊天输入框的模型选择器，从官方的长条扁平列表升级为**双列
master-detail 布局**：左列供应商芯片导航，右列仅显示所选供应商的模型，两列各自独立
滚动。同时隐藏选择器内官方的「此聊天使用的账户」账号行（如 `deepseek:default`）——
它与选择供应商/模型无关。

可运行在**任何 Agent Skills 宿主**——原生支持 **DeepSeek Harness（dsh）**（放入
`~/.agents/skills/` 即被自动发现），同样支持 OpenClaw、Claude Code、Cursor、Dify、
Ollama 及自研 Agent。宿主只需能执行一条 PowerShell 命令。

### 解决什么问题

- **模型多、滚动累**：几十个模型挤在扁平列表里，目标模型被淹没；两步直达（先供应商后模型）。
- **滚动耦合**：双列结构性 CSS Grid，各自独立滚动，滚轮滚哪列就只滚哪列。
- **账号行干扰**：官方选择器会显示解析到的凭据账号（如 `deepseek:default`），与模型
  选择无关却容易让人误会；本布局将其隐藏。
- **主题割裂**：全部使用官方设计 token（`--bg-hover`、`--accent`、`--border`），
  深色/浅色/自定义主题自动跟随。

### 快速开始

```powershell
# 安装 / 修复（幂等，可重复运行）
powershell -ExecutionPolicy Bypass -File scripts\pcl-patch.ps1
```

1. 脚本自动检测 Control UI 目录（`npm root -g`、常见 npm 前缀、PATH 里的 openclaw CLI）；
   非标准布局加 `-Dist "<...>\dist\control-ui"`。
2. 看到 `完成` 后，在 Control UI 页面按 **Ctrl+F5** 强刷（Service Worker 缓存资源，
   强刷保证新脚本加载）。
3. 打开模型选择器：左列供应商、右列该供应商的模型，无账号行。

```powershell
# 卸载
powershell -ExecutionPolicy Bypass -File scripts\pcl-patch.ps1 -Remove
```

OpenClaw 升级会覆盖 `dist/control-ui/`，补丁随之消失——重跑安装命令即可。若修改增强
JS 内容，**必须升版本号文件名**（`v4` → `v5` …），因为 Service Worker 对 `/assets/`
是 cache-first。

### 是否安全？

- **仅三处文件操作**，全部位于 OpenClaw 安装目录内且全部可逆（见顶部披露表；
  首次运行保留 `index.html.bak-pcl` 备份）。
- **纯本地**：无网络代码、无遥测、无上传；增强脚本是无依赖的浏览器端 IIFE。
- **作用面窄**：只改变模型选择器的布局/DOM，不触碰会话、配置、密钥或其他页面。
- **干净卸载**：`-Remove` 还原官方界面；重装 OpenClaw 同样还原。

### 许可证

MIT 许可证（附**强制署名条款**）：允许使用全部或部分源码（含修改后的变体），但**必须
标注 Pondsi 的署名**。详见 [LICENSE](LICENSE)。

---

## 繁體中文

### 這是什麼？

PCL Model Picker 是一個可攜的 AI Agent Skill（標準 `SKILL.md` 格式），把 **OpenClaw
Control UI**（網頁控制台）聊天輸入框的模型選擇器，從官方的長條扁平列表升級為**雙列
master-detail 佈局**：左欄供應商晶片導航，右欄僅顯示所選供應商的模型，兩欄各自獨立
捲動。同時隱藏選擇器內官方的「此聊天使用的帳戶」帳號列（如 `deepseek:default`）——
它與選擇供應商/模型無關。

可執行於**任何 Agent Skills 宿主**——原生支援 **DeepSeek Harness（dsh）**（放入
`~/.agents/skills/` 即被自動發現），同樣支援 OpenClaw、Claude Code、Cursor、Dify、
Ollama 及自研 Agent。宿主只需能執行一條 PowerShell 命令。

### 解決什麼問題

- **模型多、捲動累**：數十個模型擠在扁平列表裡，目標模型被淹沒；兩步直達（先供應商後模型）。
- **捲動耦合**：雙欄結構性 CSS Grid，各自獨立捲動，滾輪滾哪欄就只滾哪欄。
- **帳號列干擾**：官方選擇器會顯示解析到的憑證帳號（如 `deepseek:default`），與模型
  選擇無關卻容易讓人誤會；本佈局將其隱藏。
- **主題割裂**：全部使用官方設計 token（`--bg-hover`、`--accent`、`--border`），
  深色/淺色/自訂主題自動跟隨。

### 快速開始

```powershell
# 安裝 / 修復（冪等，可重複執行）
powershell -ExecutionPolicy Bypass -File scripts\pcl-patch.ps1
```

1. 腳本自動偵測 Control UI 目錄（`npm root -g`、常見 npm 前綴、PATH 裡的 openclaw CLI）；
   非標準佈局加 `-Dist "<...>\dist\control-ui"`。
2. 看到 `完成` 後，在 Control UI 頁面按 **Ctrl+F5** 強制重新整理（Service Worker 會快取
   資源，強制重新整理保證新腳本載入）。
3. 開啟模型選擇器：左欄供應商、右欄該供應商的模型，無帳號列。

```powershell
# 解除安裝
powershell -ExecutionPolicy Bypass -File scripts\pcl-patch.ps1 -Remove
```

OpenClaw 升級會覆蓋 `dist/control-ui/`，補丁隨之消失——重跑安裝命令即可。若修改增強
JS 內容，**必須升版本號檔名**（`v4` → `v5` …），因為 Service Worker 對 `/assets/`
是 cache-first。

### 是否安全？

- **僅三處檔案操作**，全部位於 OpenClaw 安裝目錄內且全部可逆（見頂部披露表；
  首次執行保留 `index.html.bak-pcl` 備份）。
- **純本地**：無網路程式碼、無遙測、無上傳；增強腳本是無相依性的瀏覽器端 IIFE。
- **作用面窄**：只改變模型選擇器的佈局/DOM，不觸及會話、設定、金鑰或其他頁面。
- **乾淨解除安裝**：`-Remove` 還原官方介面；重裝 OpenClaw 同樣還原。

### 授權條款

MIT 授權（附**強制署名條款**）：允許使用全部或部分原始碼（含修改後的變體），但**必須
標註 Pondsi 的署名**。詳見 [LICENSE](LICENSE)。

---

## 日本語

### これは何？

PCL Model Picker はポータブルな AI エージェントスキル（標準 `SKILL.md` 形式）です。
**OpenClaw Control UI**（Web コンソール）のチャット用モデルピッカーを、公式の長い
フラットなリストから**2 カラムのマスター・ディテールレイアウト**へアップグレードします：
左にプロバイダーのチップナビゲーション、右に選択したプロバイダーのモデルのみを表示し、
各カラムは独立してスクロールします。さらに、ピッカー内の公式「このチャットで使用する
アカウント」行（例：`deepseek:default`）を非表示にします —— プロバイダー/モデルの選択
には無関係なためです。

**あらゆる Agent Skills ホスト**で動作します —— **DeepSeek Harness（dsh）**をファースト
クラスでサポート（`~/.agents/skills/` に置くだけで自動検出）、OpenClaw・Claude Code・
Cursor・Dify・Ollama・自作エージェントにも対応。ホストに必要なのは PowerShell コマンド
を 1 つ実行できることだけです。

### 解決する問題

- **モデルが多くてスクロールが大変**：フラットリストでは目的のモデルが埋もれます。
  プロバイダー → モデルの 2 クリックで直接到達。
- **スクロールの連動**：構造的な CSS Grid で両カラムが独立スクロール。ホイールは
  自分がいるカラムだけをスクロールします。
- **アカウント行のノイズ**：公式ピッカーは解決済みの資格情報アカウント（例：
  `deepseek:default`）を表示しますが、モデル選択とは無関係。このレイアウトでは非表示。
- **テーマの不整合**：公式デザイントークン（`--bg-hover`、`--accent`、`--border`）のみを
  使用。ダーク/ライト/カスタムテーマに自動追従。

### クイックスタート

```powershell
# インストール / 修復（冪等、再実行安全）
powershell -ExecutionPolicy Bypass -File scripts\pcl-patch.ps1
```

1. スクリプトは Control UI ディレクトリを自動検出します（`npm root -g`、一般的な npm
   プレフィックス、PATH 上の openclaw CLI）。非標準レイアウトは `-Dist` で指定。
2. `完了` と表示されたら、Control UI のタブで **Ctrl+F5** を押してハードリロード
   （Service Worker がアセットをキャッシュするため）。
3. モデルピッカーを開く：左にプロバイダー、右にそのモデル、アカウント行なし。

```powershell
# アンインストール
powershell -ExecutionPolicy Bypass -File scripts\pcl-patch.ps1 -Remove
```

OpenClaw のアップグレードは `dist/control-ui/` を上書きし、パッチは失われます ——
インストールコマンドを再実行するだけ。JS を編集する場合は**ファイル名のバージョンを
必ず上げてください**（`v4` → `v5` …）。Service Worker は `/assets/` について
cache-first です。

### 安全性

- **ファイル操作は 3 つだけ**。すべて OpenClaw パッケージディレクトリ内で、すべて可逆
  （上部の開示表を参照。初回実行で `index.html.bak-pcl` を保存）。
- **ローカルのみ**：ネットワークコード・テレメトリ・アップロードなし。拡張は依存ゼロの
  ブラウザ側 IIFE。
- **影響範囲が狭い**：モデルピッカーのレイアウト/DOM のみを変更。セッション・設定・
  キー・他のページには触れません。
- **クリーンなアンインストール**：`-Remove` で公式 UI に復元。OpenClaw の再インストール
  でも復元されます。

### ライセンス

MIT ライセンス（**署名必須条項付き**）：改変版を含むあらゆる使用で **Pondsi** を
クレジットする必要があります。詳細は [LICENSE](LICENSE) を参照。

---

## 한국어

### 이것은 무엇인가?

PCL Model Picker는 이식 가능한 AI 에이전트 스킬(표준 `SKILL.md` 형식)입니다.
**OpenClaw Control UI**(웹 콘솔)의 채팅 모델 피커를 공식의 긴 플랫 목록에서
**2열 마스터-디테일 레이아웃**으로 업그레이드합니다: 왼쪽에는 공급자 칩 내비게이션,
오른쪽에는 선택한 공급자의 모델만 표시되며, 각 열은 독립적으로 스크롤됩니다. 또한
피커 안의 공식 "이 채팅에서 사용하는 계정" 행(예: `deepseek:default`)을 숨깁니다 —
공급자/모델 선택과 무관하기 때문입니다.

**모든 Agent Skills 호스트**에서 동작합니다 — **DeepSeek Harness(dsh)**를 퍼스트클래스로
지원(`~/.agents/skills/`에 넣으면 자동 발견), OpenClaw·Claude Code·Cursor·Dify·Ollama 및
자작 에이전트도 지원합니다. 호스트에는 PowerShell 명령 하나를 실행할 수 있는 것만
필요합니다.

### 해결하는 문제

- **모델이 많아 스크롤이 길다**: 플랫 목록에서는 목표 모델이 묻힙니다.
  공급자 → 모델 2번의 클릭으로 직접 이동.
- **스크롤 연동**: 구조적 CSS Grid로 두 열이 독립 스크롤. 휠은 자신이 있는 열만 스크롤.
- **계정 행 방해**: 공식 피커는 해결된 자격 증명 계정(예: `deepseek:default`)을 표시하지만
  모델 선택과는 무관. 이 레이아웃에서는 숨겨집니다.
- **테마 불일치**: 공식 디자인 토큰(`--bg-hover`, `--accent`, `--border`)만 사용.
  다크/라이트/커스텀 테마 자동 추종.

### 빠른 시작

```powershell
# 설치 / 복구(멱등, 재실행 안전)
powershell -ExecutionPolicy Bypass -File scripts\pcl-patch.ps1
```

1. 스크립트는 Control UI 디렉터리를 자동 감지합니다(`npm root -g`, 일반 npm 접두사,
   PATH의 openclaw CLI). 비표준 레이아웃은 `-Dist`로 지정.
2. `완료`가 표시되면 Control UI 탭에서 **Ctrl+F5** 강제 새로 고침(Service Worker가
   에셋을 캐시하므로 강제 새로 고침으로 새 스크립트 로드 보장).
3. 모델 피커를 엽니다: 왼쪽 공급자, 오른쪽 해당 모델, 계정 행 없음.

```powershell
# 제거
powershell -ExecutionPolicy Bypass -File scripts\pcl-patch.ps1 -Remove
```

OpenClaw 업그레이드는 `dist/control-ui/`를 덮어쓰고 패치가 사라집니다 — 설치 명령을
다시 실행하면 됩니다. JS를 수정할 경우 **파일명 버전을 반드시 올리세요**(`v4` → `v5` …).
Service Worker는 `/assets/`에 대해 cache-first입니다.

### 안전성

- **파일 작업은 3가지뿐**. 모두 OpenClaw 패키지 디렉터리 안에서 이루어지며 모두 되돌릴 수
  있음(상단 공개 표 참조. 최초 실행 시 `index.html.bak-pcl` 백업 저장).
- **로컬 전용**: 네트워크 코드·텔레메트리·업로드 없음. 확장은 의존성 없는 브라우저 측 IIFE.
- **영향 범위가 좁음**: 모델 피커의 레이아웃/DOM만 변경. 세션·설정·키·다른 페이지에는
  접근하지 않음.
- **깔끔한 제거**: `-Remove`로 공식 UI 복원. OpenClaw 재설치로도 복원됨.

### 라이선스

MIT 라이선스(**필수 서명 조항 포함**): 수정 버전을 포함한 모든 사용에서 **Pondsi**를
표기해야 합니다. 자세한 내용은 [LICENSE](LICENSE) 참조.

---

## Français

### Qu'est-ce que c'est ?

PCL Model Picker est une compétence d'agent IA portable (format standard `SKILL.md`) qui
transforme le sélecteur de modèles du chat de l'**OpenClaw Control UI** (console web) :
la longue liste plate groupée par fournisseur devient une **disposition maître-détail en
deux colonnes** — puces de navigation par fournisseur à gauche, uniquement les modèles du
fournisseur sélectionné à droite, chaque colonne ayant son propre défilement. Elle masque
aussi la ligne officielle « compte utilisé par ce chat » (ex. `deepseek:default`) dans le
sélecteur — sans lien avec le choix du fournisseur ou du modèle.

Fonctionne sur **n'importe quel hôte Agent Skills** — support de premier ordre pour
**DeepSeek Harness (dsh)** (déposez-la dans `~/.agents/skills/`), plus OpenClaw, Claude
Code, Cursor, Dify, Ollama et les agents personnalisés. L'hôte doit seulement pouvoir
exécuter une commande PowerShell.

### Quels problèmes cela résout

- **Trop de modèles, trop de défilement** : la liste plate noie le modèle recherché ;
  deux clics (fournisseur → modèle) y arrivent directement.
- **Défilement couplé** : CSS Grid structurel, les deux colonnes défilent indépendamment —
  la molette ne fait défiler que la colonne visée.
- **Ligne de compte déroutante** : le sélecteur officiel affiche le compte d'identifiants
  résolu (ex. `deepseek:default`), sans rapport avec le choix du modèle ; elle est masquée.
- **Incohérence de thème** : tokens de conception officiels uniquement (`--bg-hover`,
  `--accent`, `--border`) ; thèmes sombre/clair/personnalisés suivis automatiquement.

### Démarrage rapide

```powershell
# Installer / réparer (idempotent — réexécution sans risque)
powershell -ExecutionPolicy Bypass -File scripts\pcl-patch.ps1
```

1. Le script détecte automatiquement le répertoire Control UI (`npm root -g`, préfixes npm
   courants, CLI `openclaw` dans le PATH). Disposition non standard : `-Dist`.
2. Une fois `Terminé` affiché, appuyez sur **Ctrl+F5** dans l'onglet Control UI (le Service
   Worker met les ressources en cache — un rechargement forcé garantit le nouveau script).
3. Ouvrez le sélecteur : fournisseurs à gauche, modèles à droite, pas de ligne de compte.

```powershell
# Désinstaller
powershell -ExecutionPolicy Bypass -File scripts\pcl-patch.ps1 -Remove
```

Les mises à jour d'OpenClaw écrasent `dist/control-ui/` et le correctif disparaît —
relancez simplement la commande d'installation. Si vous modifiez le JS, vous DEVEZ
incrémenter le nom de fichier versionné (`v4` → `v5` …), car le Service Worker est
cache-first pour `/assets/`.

### Est-ce sûr ?

- **Trois opérations de fichiers seulement**, toutes dans le répertoire du paquet OpenClaw
  et toutes réversibles (voir le tableau de divulgation ; le premier lancement conserve
  `index.html.bak-pcl`).
- **Local uniquement** : aucun code réseau, aucune télémétrie, aucun envoi. L'enhancement
  est une IIFE navigateur sans dépendance.
- **Impact étroit** : seule la mise en page du sélecteur change — jamais les sessions, la
  configuration, les clés ni les autres pages.
- **Désinstallation propre** : `-Remove` restaure l'UI d'origine ; réinstaller OpenClaw aussi.

### Licence

Licence MIT avec **obligation d'attribution** : toute utilisation, y compris les variantes
modifiées, doit créditer **Pondsi**. Voir [LICENSE](LICENSE).

---

## Español

### ¿Qué es esto?

PCL Model Picker es una habilidad de agente de IA portátil (formato estándar `SKILL.md`)
que convierte el selector de modelos del chat de la **OpenClaw Control UI** (consola web):
la larga lista plana agrupada por proveedor se convierte en un **diseño maestro-detalle de
dos columnas**: chips de navegación de proveedores a la izquierda, solo los modelos del
proveedor seleccionado a la derecha, cada columna con su propio desplazamiento. También
oculta la fila oficial «cuenta usada por este chat» (p. ej. `deepseek:default`) dentro del
selector — no guarda relación con la elección de proveedor o modelo.

Funciona en **cualquier host de Agent Skills** — soporte de primer nivel para **DeepSeek
Harness (dsh)** (déjela en `~/.agents/skills/`), además de OpenClaw, Claude Code, Cursor,
Dify, Ollama y agentes propios. El host solo necesita poder ejecutar un comando de
PowerShell.

### Qué problemas resuelve

- **Demasiados modelos, demasiado desplazamiento**: la lista plana entierra el modelo
  buscado; dos clics (proveedor → modelo) llegan directamente.
- **Desplazamiento acoplado**: CSS Grid estructural, ambas columnas se desplazan de forma
  independiente — la rueda solo desplaza la columna apuntada.
- **Fila de cuenta confusa**: el selector oficial muestra la cuenta de credenciales
  resuelta (p. ej. `deepseek:default`), sin relación con la elección del modelo; queda oculta.
- **Desajuste de tema**: solo tokens de diseño oficiales (`--bg-hover`, `--accent`,
  `--border`); los temas oscuro/claro/personalizados se siguen automáticamente.

### Inicio rápido

```powershell
# Instalar / reparar (idempotente — seguro de repetir)
powershell -ExecutionPolicy Bypass -File scripts\pcl-patch.ps1
```

1. El script detecta automáticamente el directorio de Control UI (`npm root -g`, prefijos
   npm comunes, CLI `openclaw` en PATH). Diseño no estándar: `-Dist`.
2. Cuando muestre `Completado`, pulse **Ctrl+F5** en la pestaña de Control UI (el Service
   Worker almacena recursos en caché — una recarga forzada garantiza el nuevo script).
3. Abra el selector: proveedores a la izquierda, modelos a la derecha, sin fila de cuenta.

```powershell
# Desinstalar
powershell -ExecutionPolicy Bypass -File scripts\pcl-patch.ps1 -Remove
```

Las actualizaciones de OpenClaw sobrescriben `dist/control-ui/` y el parche desaparece —
vuelva a ejecutar el comando de instalación. Si edita el JS, DEBE incrementar el nombre de
archivo versionado (`v4` → `v5` …), porque el Service Worker es cache-first para `/assets/`.

### ¿Es seguro?

- **Solo tres operaciones de archivos**, todas dentro del directorio del paquete OpenClaw y
  todas reversibles (vea la tabla de divulgación; la primera ejecución conserva
  `index.html.bak-pcl`).
- **Solo local**: sin código de red, sin telemetría, sin envíos. La mejora es una IIFE de
  navegador sin dependencias.
- **Impacto reducido**: solo cambia el diseño/DOM del selector — nunca toca sesiones,
  configuración, claves ni otras páginas.
- **Desinstalación limpia**: `-Remove` restaura la UI original; reinstalar OpenClaw también.

### Licencia

Licencia MIT con **obligación de atribución**: cualquier uso, incluidas las variantes
modificadas, debe acreditar a **Pondsi**. Vea [LICENSE](LICENSE).

---

## Русский

### Что это?

PCL Model Picker — переносимый навык AI-агента (стандартный формат `SKILL.md`), который
преобразует селектор моделей чата в **OpenClaw Control UI** (веб-консоль): длинный плоский
список, сгруппированный по поставщикам, становится **двухколоночной компоновкой
«мастер-деталь»** — чипы навигации по поставщикам слева, только модели выбранного
поставщика справа, каждая колонка прокручивается независимо. Также скрывает официальную
строку «аккаунт, используемый этим чатом» (например, `deepseek:default`) внутри селектора —
она не связана с выбором поставщика или модели.

Работает на **любом хосте Agent Skills** — первоклассная поддержка **DeepSeek Harness
(dsh)** (положите в `~/.agents/skills/`), а также OpenClaw, Claude Code, Cursor, Dify,
Ollama и собственных агентов. От хоста требуется лишь возможность выполнить одну команду
PowerShell.

### Какие проблемы решает

- **Слишком много моделей, слишком долгая прокрутка**: в плоском списке нужная модель
  тонет; два клика (поставщик → модель) ведут прямо к цели.
- **Связанная прокрутка**: структурный CSS Grid — колонки прокручиваются независимо,
  колесо прокручивает только ту колонку, на которую наведён курсор.
- **Смущающая строка аккаунта**: официальный селектор показывает учётную запись
  (например, `deepseek:default`), не связанную с выбором модели; здесь она скрыта.
- **Несоответствие темы**: только официальные дизайн-токены (`--bg-hover`, `--accent`,
  `--border`); тёмная/светлая/свои темы подхватываются автоматически.

### Быстрый старт

```powershell
# Установка / восстановление (идемпотентно — можно повторять)
powershell -ExecutionPolicy Bypass -File scripts\pcl-patch.ps1
```

1. Скрипт сам находит каталог Control UI (`npm root -g`, типичные npm-префиксы, CLI
   `openclaw` в PATH). Нестандартная компоновка: `-Dist`.
2. Когда появится `Готово`, нажмите **Ctrl+F5** во вкладке Control UI (Service Worker
   кэширует ресурсы — жёсткая перезагрузка гарантирует загрузку нового скрипта).
3. Откройте селектор моделей: поставщики слева, их модели справа, без строки аккаунта.

```powershell
# Удаление
powershell -ExecutionPolicy Bypass -File scripts\pcl-patch.ps1 -Remove
```

Обновления OpenClaw перезаписывают `dist/control-ui/`, и патч исчезает — просто повторите
команду установки. Если вы правите JS, ОБЯЗАТЕЛЬНО увеличивайте версию в имени файла
(`v4` → `v5` …), потому что Service Worker для `/assets/` работает по принципу cache-first.

### Это безопасно?

- **Только три файловые операции**, все внутри каталога пакета OpenClaw и все обратимы
  (см. таблицу раскрытия выше; первый запуск сохраняет `index.html.bak-pcl`).
- **Только локально**: нет сетевого кода, телеметрии, отправки данных. Улучшение — обычная
  браузерная IIFE без зависимостей.
- **Узкий радиус действия**: меняется только разметка/DOM селектора моделей — сессии,
  конфигурация, ключи и другие страницы не затрагиваются.
- **Чистое удаление**: `-Remove` возвращает штатный интерфейс; переустановка OpenClaw — тоже.

### Лицензия

Лицензия MIT с **обязательным указанием авторства**: любое использование, включая
изменённые варианты, должно указывать авторство **Pondsi**. См. [LICENSE](LICENSE).

---

## Security / 安全模型

**The patch is scoped, backed up, and reversible by design.**

- The installer touches exactly two paths: `index.html` (one tag line, `.bak-pcl` backup on
  first run) and `assets/pcl-model-picker.v*.js` (versioned filename, newest two kept).
- No packaged OpenClaw code (JS/CSS/SW) is modified — the enhancement is a separate file,
  loaded only by the injected tag.
- Local only: no network code, no telemetry, no MCP anywhere in the package.
- The browser-side script only reads/writes the model picker's own DOM (class gates,
  zero no-op writes); it never reads page data beyond that picker and never calls the network.
- Clean uninstall: `-Remove` removes the tag and the assets; reinstalling OpenClaw also
  restores the stock UI.

**补丁作用域受限、有备份、设计上可逆。** 安装器只触碰两个路径（`index.html` 的一行标签 +
首次运行备份；`assets/` 的带版本号脚本，保留最近两版）；不修改任何打包代码；纯本地无
网络无遥测；浏览器端脚本只作用于模型选择器自身的 DOM（状态门控、零空写），不读取其他
页面数据。卸载一键还原。

---

Pondsi (+deepseek-v4-flash+GLM5.3-flash+Qwen3.8-27b) — automatically committed by Openclaw
