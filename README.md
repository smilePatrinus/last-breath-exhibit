# 最後一口呼吸

[線上試玩](https://smilepatrinus.github.io/last-breath-exhibit/)

一款公開展示肺部 mNGS 病原判讀研究流程的網頁遊戲。玩家從一張白色念珠菌讀數最高的定序報告出發，追查同一天核發的培養單來自哪一份檢體。遊戲以模擬病例 D07 串起四關。

## 開始調查

解壓縮，保留原有檔案結構，從瀏覽器開啟 `index.html`。完整故事和關卡可離線跑完。音效預設關閉，右上角可切換。

- 對話以「繼續」、右方向鍵或空白鍵推進。開場可略過。
- 地圖可用方向鍵或 WASD 移動，也可點石板路、地圖上的目的地或底部「走到…」按鈕。到站會接上該關的劇情。
- 地圖與關卡支援觸控。拖曳、蓋章和滑卡各有點按操作。手機也可直接點地圖的方向按鈕。
- 每關的「醫師留言」保留這關的目的和操作。「重新開始」會清除本輪紀錄。

## 關卡

| 關卡 | 要解的問題 | 操作 |
| --- | --- | --- |
| 失序的紀錄 | 哪些紀錄在本次採檢附近？報告日期與採檢日期各是什麼？ | 記下 Excel 的檢體編號、採檢時間與檢體類型，再從同編號的 PPT 取出檢驗結果。 |
| 文件審查窗口 | 這張單是哪一份檢體？結果指到菌名還是群組？ | 標記編號，蓋章歸檔，標出兩段同檢體證據各自的範圍。 |
| 候選複核室 | 哪些病例可給 K. variicola 當背景？不同菌種或檢體是否可比？ | 一次讀一篇並圈文字，左滑略過、右滑收入。 |
| 交回調查報告 | 讀數最高的白色念珠菌為何仍未列入？菌群結果還有哪些待查問題？ | 展開來源，回覆醫師，再交出帶原始紀錄的報告。 |

D07 的檢體編號、症狀組合、日期、時間及數值是模擬資料。A、B、C 依序對應銅綠假單胞菌（*Pseudomonas aeruginosa*）、白色念珠菌（*Candida albicans*）和 *Klebsiella variicola*。採檢收件窗、同期窗及篩選是展示案例的設定。結案頁說明遊戲和研究流程的對應。

## 案卷格式與資料參考

- 遊戲內的採檢清冊採 Excel 列號、欄號和儲存格編號。個案彙整採 PowerPoint 縮圖與目前投影片配置，投影片內嵌可讀的模擬檢驗報告。格式以公開的文件介面與檢驗項目為參考。 [Excel 工作表列欄](https://support.microsoft.com/en-us/excel/print-row-and-column-headings) · [PowerPoint 一般檢視](https://support.microsoft.com/en-us/powerpoint/show-or-hide-slide-thumbnails) · [成大斗六分院檢驗項目](https://web.hosp.ncku.edu.tw/pathology/Pathology/Page/562?t=d6)
- 報告的肺炎克雷伯氏菌群依 BIOFIRE 手冊列出群組包含的三個菌種。遊戲中的白色念珠菌線索呈現呼吸道檢出後仍需比對檢體與定植可能性。 [BIOFIRE 肺炎套組說明](https://www.biomerieux.com/content/dam/biomerieux-com/service-support/support-documents/instructions-for-use-and-manuals/RFIT-PRT-0575-FilmArray-Pneumo-Instructions-for-Use-EN.pdf) · [IDSA 念珠菌指引第 IX 節](https://www.idsociety.org/practice-guideline/candidiasis/)
- 第 01、04 張摘要根據公開研究改寫並附原文連結。第 02、03、05 張為標示過的教學模擬摘要。 [臺灣臨床分離株研究](https://pubmed.ncbi.nlm.nih.gov/41787580/) · [呼吸道病例報告](https://pmc.ncbi.nlm.nih.gov/articles/PMC13372066/)

## 舞台與程式

- `story.js` 是兩人對話、內心戲、電話與道具的劇本。
- `world.js` 提供四向移動、橋面邊界、鏡頭和站點觸發。角色在 `assets/lung-city.png` 的石板路上共用一套坐標。四方向各三格的走路圖放在 `assets/detective-walk.png`。
- `stages.js` 負責過場、走圖介面與立繪切換。表情從原立繪圖選取，立繪同場保留並依發話者移動和明暗變化。
- `content.js` 保存模擬病例和文獻，`documents.js` 產生工作表、PPT、檢驗報告及來源座標。`game.js` 控制關卡與報告。`styles.css`、`exhibit.css` 和 `dossier.css` 控制畫面。

新增兩張素材透過內建 ImageGen 產製。地圖提示採用「連續石板路，檔案櫃、蓋章窗口、文獻架、結案桌依序開向走道，無角色與文字的俯視像素場景」。走路圖以原偵探造型為參考，使用「貝雷帽與黃圍巾，四個朝向，各三格步態，透明背景」。

演出參考《活俠傳》官方畫面中的雙人立繪與對話框呈現。走圖參考 RPG Maker 的移動路線與到站事件。教學以對話先提出問題，再讓玩家在原始文件中用一次操作驗證。 [《活俠傳》官方預告](https://www.youtube.com/watch?v=O3To9yxYRvU) · [RPG Maker MZ 移動路線手冊](https://rpgmakerofficial.com/product/MZ_help-en/01_10_06_01.html) · [George Fan 的教學設計演講](https://www.gdcvault.com/play/1015541/Playtesting-for-Game)

## GitHub Pages

將解壓後的 `index.html`、JavaScript、CSS、`assets/`、`.nojekyll` 和說明放在獨立 repo 的分支根目錄。在 **Settings → Pages** 選 **Deploy from a branch**，選該分支的 **/(root)**。 [GitHub Pages 官方設定說明](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)


