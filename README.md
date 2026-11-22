# 最後一口呼吸

[線上試玩](https://smilepatrinus.github.io/last-breath-exhibit/)

一款公開展示肺部 mNGS 病原判讀研究流程的網頁遊戲。玩家從一張白色念珠菌讀數最高的定序報告出發，追查同一天核發的培養單來自哪一份檢體。遊戲以模擬病例 D07 串起四關。

## 開始調查

解壓縮，保留原有檔案結構，從瀏覽器開啟 `index.html`。完整故事和關卡可離線跑完。音效預設開啟，右上角可切換。

- 對話以「繼續」、右方向鍵或空白鍵推進。開場可略過。
- 地圖可用方向鍵或 WASD 移動，也可點石板路、地圖上的目的地或底部「走到…」按鈕。到站會接上該關的劇情。
- 地圖與關卡支援觸控。資料拖曳、迷宮走路和文獻滑卡各有點按操作。手機也可直接點地圖的方向按鈕。
- 每關第一次操作會出現框選教學。提示會跟著你實際完成的動作前進，先帶一份紀錄或一張文件，再讓你繼續練習。
- 可按「略過教學」關閉提示，也可從頂端「看操作教學」重新打開當前步驟。按 Esc 也能收起教學。
- 每關的「醫師留言」保留這關的目的和操作。「重新開始」會清除本輪紀錄，並重開各關教學。

## 關卡

| 關卡 | 要解的問題 | 操作 |
| --- | --- | --- |
| 失序的紀錄 | 哪些紀錄在本次採檢附近？報告日期與採檢日期各是什麼？ | 記下 Excel 的檢體編號、採檢時間與檢體類型，再從同編號的 PPT 取出檢驗結果。 |
| 迷宮探路 | 讀數最高的念珠菌，還需要核對什麼？ | 帶著候選走進固定迷宮，沿途自動查看紀錄，找出能由證據支持的出口。 |
| 候選複核室 | 哪些病例可給 K. variicola 當背景？不同菌種或檢體是否可比？ | 一次讀一篇並圈文字，左滑略過、右滑收入。 |
| 言彈議論 | 案卷中的推論有沒有超過證據的支持範圍？哪些支持可以成立？ | 切換證據言彈，瞄準流動的黃色片語反駁、藍色片語支持，完成核對後交出報告。 |

D07 的檢體編號、症狀組合、日期、時間及數值是模擬資料。A、B、C 依序對應銅綠假單胞菌（*Pseudomonas aeruginosa*）、白色念珠菌（*Candida albicans*）和 *Klebsiella variicola*。採檢收件窗、同期窗及篩選是展示案例的設定。結案頁說明遊戲和研究流程的對應。



## 新版第二關：迷宮探路（試作）

[直接試玩](https://smilepatrinus.github.io/last-breath-exhibit/?v=14&demo=maze) · [對照原規則版](https://smilepatrinus.github.io/last-breath-exhibit/?v=14&demo=maze&maze=rules)

新版先帶白色念珠菌走一條短路線。地圖包含相連的回圈、錯路與兩扇證據門，全程留在同一張地圖。第一關的原始紀錄自動帶入，走到紀錄或門牌會自動出現線索；玩家只需移動、觀察和回頭探索。

- 高讀數捷徑提醒玩家，檢出訊號仍需要其他證據。
- 培養紀錄直接讀取第一關收錄的 L01，保留採檢、核發、痰液來源及 Excel／PPT 座標；核對後打開呼吸道走廊。
- 下一頁說明本展示案卷未提供同種念珠菌的血液、無菌部位或病理證據，狀態保持 unknown。
- 抵達脈絡出口後才記錄完成。報告保留本輪實際走過的三個節點。
- 本版只實際探索 B。A、C 依原始案卷整理，報告會標示本關未探索，結案計數也只算實際完成的路徑。
- 第三關未收入文獻且沒有 C 的迷宮路徑時，第四關直接使用 FilmArray 原單作依據，不會製造一條未玩過的路徑。
- 預設只看得到身邊約四格的圓形視野，圈外全黑；角色與光圈保持在畫面中央。門牌要走近才顯示，點黑暗區不會自動尋路。
- 用方向鍵、WASD、點亮處的石板路，或按住觸控方向按鈕移動。小地圖只記下已照亮的附近與曾看見的地標；線索看完仍能原路返回。

`labyrinth-data.js` 保存地形、證據門與線索資料；`labyrinth.js` 負責碰撞、尋路、鏡頭、同行候選及提示；`labyrinth.css` 負責響應式畫面。採用既有原創圖塊與角色，病例沿用模擬 D07。

## 原規則迷宮（對照版）

迷宮包含三條候選路線，共十個判讀節點。玩家先辨認主要規則分類，再按菌種走不同分支。每扇門同時核對「選擇的分支」和「支持選擇的紀錄」，兩者都對才留下路徑。可用方向鍵、WASD、點地板與觸控方向鍵移動；點門牌或下方門名會沿可行走廊自動前往。

- **銅綠假單胞菌**：分類 → mNGS 訊號核對 → 同菌種、下呼吸道院端支持。出口為優先保留。
- **白色念珠菌**：分類 → 培養檢體來源 → 侵襲性證據是否提供 → 高 reads 的判讀界線。出口為暫不列入，保留呼吸道脈絡。沒有提供的項目維持 unknown。
- **K. variicola**：分類 → FilmArray 回報層級 → 保留物種疑問。出口為待複核，接到第三關文獻。

第一關收錄的 L02 培養、FilmArray 和 L01 培養，會以來源座標出現在案卷。遊戲另提供有標示的候選分類卡、模擬訊號整理卡與資料缺漏卡。A 的訊號卡提供模擬的 `rank_priority = 2` 與 `rank_rule = NTC=00`，讓玩家依 `clean_mngs_signal` 對照 reads、排名與標記；原始定序與完整排名計算在研究流程中執行。第二關每次成功的選擇、依據、規則與說明存入本輪狀態，第四關會顯示實際通過的路徑。

這是研究規則的三條教學路線。實際流程還有其他菌種、證據模組、門檻、保護規則與複核路徑。遊戲的「待複核」等出口是展示用摘要，實際研究應使用完整研究程式。

改編依據為 `OliveWoo/Multimodal-Diagnosis-Model` 的 2026/10/20 流程說明及本次讀取的檔案：

| 檔案 | 本次讀取的 Git blob | 遊戲對應 |
| --- | --- | --- |
| `current_pipeline/tools/deterministic_mngs_max_scorer.py` | `877cf5c8319776eaba3023bf1dd256e2e6294fa7` | `clean_mngs_signal`、`typical_pneumonia_hospital_mngs_rule`、`R-S4-CANDIDA-RESP-CONTEXT-NOT-PICKED` |
| `current_pipeline/rules/organism_taxonomy_rules.json` | `3a062ff31332caed098780683627639ab07b6f37` | 物種／屬的主要規則分類、`species_identity_matters` |
| `docs/PIPELINE_UPDATE_20261020.md` | `926cef142e2bbe91291ecd76aac6f3890467dfaa` | 未提供資料保持未知、模型與檢驗證據的界線 |

`maze-rules.js` 保存改編節點與來源；`maze.js` 負責地圖碰撞、尋路、開門與路徑紀錄；`maze.css` 負責響應式畫面。展示 repo 使用模擬病例，原始研究規則檔與病人資料另存研究專案。新增迷宮圖塊由 ImageGen 產製，提示存於 `assets/maze-tiles.prompt.txt`。


## 第四關的言彈議論

[直接試玩第四關](https://smilepatrinus.github.io/last-breath-exhibit/?v=14&demo=debate)。首頁也有相同入口，會明確標示使用已整理的模擬案卷。完整遊戲仍從第一關開始，第四關只使用該輪已收集的來源。

- 點選下方言彈裝填，再點流動發言中的標記片語發射。Q／E 可切換言彈，舞台取得焦點時可按 Enter 對當前標記發射。
- 黃色片語用證據指出矛盾；藍色片語用證據支持。標記包含干擾點，言彈與目標都要對上。
- 強動態模式中，發言從場外快速進入、沿不同方向與高度掠過，再離場。中央保留可閱讀與瞄準的區間，上一句留下短暫殘影。預設使用強動態，舞台右上可手動切換低動態。
- 「集中」切換為四分之一速度，也可在舞台按住空白鍵集中。「暫停」保留畫面並允許瞄準，「重聽本段」從第一句播放。未命中的議論會循環。
- 「查看證據」保留所選言彈的原始內容及來源；閱讀時議論停住。錯誤證據會得到可重試的提示。
- 四段議論依序核對採檢來源、同菌種 BAL 培養支持、群組與物種的界線、文獻的支持範圍。未收入文獻時，最後一段用可用的實際判讀路徑或院端原單支持保留疑問。
- 成功後會記下言彈、命中片語與修正後的說法，帶入調查報告。支持成立代表該項檢驗支持成立，仍保留臨床判讀與未知項目的界線。
- 本版採可暫停與重聽的展場設計，並支援減少動態效果的系統偏好。四段核對完成後才可送出報告。

`debate-data.js` 負責依本輪案卷建立言彈、議論內容與核對規則；`debate.js` 負責流動發言、切換、慢速、暫停、射擊及回應；`debate.css` 負責響應式舞台。這些是展示遊戲的證據核對機制，研究的菌種判讀仍對應第二關說明中的實際程式。

機制參考《槍彈辯駁》的言彈、無休止議論、精神集中與同意點，畫面使用本遊戲既有場景、角色與自製介面。[官方系統說明](https://www.danganronpa.com/pages/v3/system/) · [PlayStation 系統介紹](https://blog.ja.playstation.com/2016/12/28/20161228-danganronpav3/)

## 案卷格式與資料參考

- 遊戲內的採檢清冊採 Excel 列號、欄號和儲存格編號。個案彙整採 PowerPoint 縮圖與目前投影片配置，投影片內嵌可讀的模擬檢驗報告。格式以公開的文件介面與檢驗項目為參考。 [Excel 工作表列欄](https://support.microsoft.com/en-us/excel/print-row-and-column-headings) · [PowerPoint 一般檢視](https://support.microsoft.com/en-us/powerpoint/show-or-hide-slide-thumbnails) · [成大斗六分院檢驗項目](https://web.hosp.ncku.edu.tw/pathology/Pathology/Page/562?t=d6)
- 報告的肺炎克雷伯氏菌群依 BIOFIRE 手冊列出群組包含的三個菌種。遊戲中的白色念珠菌線索呈現呼吸道檢出後仍需比對檢體與定植可能性。 [BIOFIRE 肺炎套組說明](https://www.biomerieux.com/content/dam/biomerieux-com/service-support/support-documents/instructions-for-use-and-manuals/RFIT-PRT-0575-FilmArray-Pneumo-Instructions-for-Use-EN.pdf) · [IDSA 念珠菌指引第 IX 節](https://www.idsociety.org/practice-guideline/candidiasis/)
- 第 01、04 張摘要根據公開研究改寫並附原文連結。第 02、03、05 張為標示過的教學模擬摘要。 [臺灣臨床分離株研究](https://pubmed.ncbi.nlm.nih.gov/41787580/) · [呼吸道病例報告](https://pmc.ncbi.nlm.nih.gov/articles/PMC13372066/)

## 舞台與程式

- `story.js` 是兩人對話、內心戲、電話與道具的劇本。
- `world.js` 提供四向移動、橋面邊界、鏡頭和站點觸發。角色在 `assets/lung-city.png` 的石板路上共用一套坐標。四方向各三格的走路圖放在 `assets/detective-walk.png`。
- `stages.js` 負責過場、走圖介面與立繪切換。表情從像素立繪圖 `assets/portraits-pixel-v1.png` 選取，立繪同場保留並依發話者移動和明暗變化。
- `content.js` 保存模擬病例和文獻，`documents.js` 產生工作表、PPT、檢驗報告及來源座標。`game.js` 控制關卡與報告。`styles.css`、`exhibit.css` 和 `dossier.css` 控制畫面。

地圖、走路圖與像素立繪皆透過內建 ImageGen 產製。地圖提示採用「連續石板路，檔案櫃、蓋章窗口、文獻架、結案桌依序開向走道，無角色與文字的俯視像素場景」。走路圖以原偵探造型為參考，使用「貝雷帽與黃圍巾，四個朝向，各三格步態，透明背景」。

演出參考《活俠傳》官方畫面中的雙人立繪與對話框呈現。走圖參考 RPG Maker 的移動路線與到站事件。教學以對話先提出問題，再讓玩家在原始文件中用一次操作驗證。 [《活俠傳》官方預告](https://www.youtube.com/watch?v=O3To9yxYRvU) · [RPG Maker MZ 移動路線手冊](https://rpgmakerofficial.com/product/MZ_help-en/01_10_06_01.html) · [George Fan 的教學設計演講](https://www.gdcvault.com/play/1015541/Playtesting-for-Game)


## 原創背景音樂

音樂預設開啟，首次點擊或鍵盤操作後開始播放。右上角「音樂」與「音效」是獨立開關。關卡換曲時會淡出銜接，對話和線索視窗出現時降低配樂音量，切到背景分頁時暫停。

| 場景 | 曲名 | 氣氛 |
| --- | --- | --- |
| 開場與診療室 | 肺城夜航 | 緩慢、帶一點疑問 |
| 第一關 | 散落的紀錄 | 輕巧、逐步整理 |
| 第二關 | 呼吸道迴廊 | 好奇、探索與回頭找路 |
| 第三關 | 翻頁之間 | 安靜、適合閱讀 |
| 第四關 | 證據交鋒 | 較快的節奏與脈衝 |
| 報告與結局 | 裂縫仍在 | 放慢、保留未解的部分 |

`music.js` 保存六段為本遊戲編寫的旋律、和聲與節奏，以 Web Audio 即時合成循環配樂。沒有下載或引用第三方錄音，完整遊戲與配樂可離線使用。

## GitHub Pages

將解壓後的 `index.html`、JavaScript、CSS、`assets/`、`.nojekyll` 和說明放在獨立 repo 的分支根目錄。在 **Settings → Pages** 選 **Deploy from a branch**，選該分支的 **/(root)**。 [GitHub Pages 官方設定說明](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
