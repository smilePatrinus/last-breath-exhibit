(function () {
  "use strict";
  const doctor = (body, extra = {}) => ({role:"doctor", face:1, body, ...extra});
  const detective = (body, extra = {}) => ({role:"detective", face:0, body, ...extra});
  const thought = (body, extra = {}) => ({role:"thought", face:1, body, ...extra});
  const frame = (body, extra = {}) => ({role:"narrator", body, ...extra});

  const intro = [
    frame("門裡傳來兩聲短鈴。偵探正要敲門，聽見有人接起了電話。", {cue:"phone", motion:"ring", prop:"深夜｜醫院診療室"}),
    doctor("血氧又降了？好，我等一下過去。", {face:0, motion:"doctor-in"}),
    detective("你找我來，是要查那份還沒送出去的報告？", {cue:"knock", motion:"detective-in"}),
    doctor("對。mNGS 是把檢體裡的遺傳訊號拿去定序，一次就能查到好幾種微生物。你看，這份有三個名字。", {prop:"mNGS｜肺泡灌洗液（BAL）L02｜11/18 採檢", report:true}),
    detective("白色念珠菌的讀數最高。旁邊的培養也有它，日期同樣寫十一月十八。", {face:1, prop:"培養報告 P-02｜11/18 核發｜Candida albicans", report:true, motion:"inspect"}),
    doctor("念珠菌有時只是定植在呼吸道。先看那張培養是從哪一份檢體來的，我怕我們把兩張單連錯了。", {face:0}),
    thought("兩份文件都寫著十八號。日期旁的欄名不同，剛才我卻只看了數字。", {prop:"採檢日？出報告日？", motion:"inspect"}),
    detective("先給我採檢試算表。我想知道，這份長出白色念珠菌的檢體到底哪天採的。", {face:2}),
    frame("他抽出壓在下方的肺部影像。紙上的裂縫忽然亮起，裡面漂著幾張只看得見日期的檢驗單。", {cue:"rift", motion:"rift", rift:true}),
    doctor("等一下，你看得見裡面的字嗎？", {face:0, rift:true}),
    detective("看不清。我得靠近一點。電話先別掛，我找到編號就回你。", {face:2, rift:true}),
    frame("偵探伸手抓住一張快被帶走的檢驗單。下一刻，腳踩上了肺城的石板路。", {rift:true, motion:"cross", label:"走入裂縫"})
  ];

  const chapters = [
    {target:"檔案櫃", objective:"把試算表和檢驗投影片對回同一次採檢。", label:"翻開原始檔案",
     task:"抄錄檢體編號、採檢時間與檢體類型，再到 PPT 帶入對應報告。", script:[
      frame("檔案櫃吐出一列試算表和一疊檢驗投影片。最上面兩張，都露著「11/18」。", {prop:"檔案櫃｜試算表、檢驗 PPT"}),
      detective("我到了。這兩個日期看起來一樣。我先查哪一欄？", {cue:"phone", face:1}),
      doctor("以 mNGS 的採檢日 11/18 當基準，先找前後三天的檢體。採檢和出報告常隔幾天，填表要看「採檢日期」。", {face:1}),
      thought("左邊的清冊記著檢體、時間和類型，右邊的簡報才有結果。我要把同一編號的兩份資料接起來。", {prop:"用檢體編號接起原始來源", motion:"inspect"})
    ]},
    {target:"判讀迷宮", objective:"用分類規則和案卷證據，帶三個候選走出各自的路。", label:"帶第一個候選進場",
     task:"先查判讀手冊，再從案卷選依據，走向符合條件的門。可點門牌自動尋路，也能用方向鍵或 WASD 移動。", script:[
      frame("窗口後面的牆移開了。三條走廊各刻著不同的門牌，手上的候選卡只亮起一個名字。", {prop:"判讀迷宮｜分類、訊號與檢驗證據"}),
      detective("同一份報告裡的三個名字，為什麼要走不同的路？", {face:1}),
      doctor("菌種特性不同，需要核對的條件也不同。先看分類卡和門邊的手冊，案卷裡的原單就是你的依據。", {cue:"phone"}),
      thought("門上是問題，手冊裡有規則。我得拿得出紀錄，才知道這一步能不能往前。", {motion:"inspect"})
    ]},
    {target:"文獻室", objective:"為只有群組線索的 K. variicola 找可參考的病例。", label:"查看第一篇摘要",
     task:"圈出與本案相符的部位，再右滑收入；不同部位或候選就左滑略過。", script:[
      detective("L02 的培養寫著銅綠假單胞菌。至於 mNGS 那行 K. variicola，FilmArray 只驗到它所屬的菌群。", {face:1, prop:"L02｜FilmArray：Klebsiella pneumoniae group"}),
      doctor("用 K. variicola 和呼吸道檢體去找。小心名字很像的近親。對得上的也要留下檢體類型和作者說到哪裡。", {cue:"phone", face:2}),
      thought("就算別人的病例有這一種，我手上的群組結果仍分不出它。我得把查到的和還缺的都寫進去。", {motion:"inspect"})
    ]},
    {target:"結案桌", objective:"把前三關的證據裝填為言彈，核對案卷回聲中的推論。", label:"裝填第一枚言彈",
     task:"選一枚言彈，開始議論。瞄準黃色片語指出矛盾，或對藍色片語提出支持；可以集中放慢與重聽。", script:[
      detective("案卷整理好了。{summary}", {face:2}),
      frame("結案桌突然亮起。文件裡的句子浮到空中，彼此接成幾段說法；有些連得太快，有些卻停在關鍵的地方。", {prop:"案卷回聲｜讓每一句推論對回證據"}),
      doctor("先別送出。聽聽那些句子，看看我們找到的紀錄，真的有說到那裡嗎？", {cue:"phone"}),
      thought("原單、走過的路、文獻留下的限制……都還在手上。這次，要找出是哪一句把它們接錯了。", {motion:"inspect"})
    ]}
  ];

  function ending(kept) {
    const clue = kept.some((item) => item.id === "02") ?
      "文獻摘錄｜記載檢出，致病角色未確認" : "本案院端紀錄｜只到肺炎克雷伯氏菌群";
    return [
      frame("文件沿著各自的路徑歸位。遠處的燈一盞盞亮起，只有桌旁那道裂縫沒有合上。", {scene:"world", cue:"rift", rift:true, prop:clue}),
      detective("……還有沒辦法拼起來的地方。", {scene:"world", face:1, rift:true}),
      frame("偵探伸手碰了碰裂縫。再睜眼時，他已經回到診療室，手裡還握著調查報告。", {motion:"return"}),
      doctor("這裡……你沒有替它下結論？", {prop:"調查報告｜K. variicola：尚待確認", motion:"doctor-in"}),
      detective("查到的都在裡面了。剩下的，我還找不到足夠的證據。", {face:2}),
      frame("醫師把那頁原樣放進會診資料夾。桌上的電話又響了，還是同樣兩聲。", {cue:"phone", motion:"ring"}),
      doctor("好，我現在過去。這次有些資料，可以拿來好好討論了。", {face:2, motion:"exit-doctor"}),
      detective("至少，這次沒把不知道的事當成答案。", {face:2, prop:"影像上的裂縫已不發光，只留下一道細痕。", trace:true, label:"收起案卷"})
    ];
  }

  const explorationChapter = {
    target:"呼吸道迷宮",objective:"帶著白色念珠菌，沿紀錄找出能由證據支持的出口。",label:"帶著念珠菌出發",
    task:"微光只照亮身邊一圈。用方向鍵、WASD 或點亮處的石板路移動，走近亮點會自動出現線索。小地圖只記錄已探索的附近。",
    script:[
      frame("牆後的走廊陷在黑暗裡，只有身邊一圈微光。小小的念珠菌跟了過來，一同照見腳邊的石板路。",{prop:"呼吸道迷宮｜沿微光探索"}),
      detective("它的讀數最高。我先帶它找出口，看看一路上的紀錄能說到哪裡。",{face:1}),
      doctor("培養的來源和還缺的檢查，都留在路上的紀錄裡。走近看看，記得別把不知道的事補成答案。",{cue:"phone"}),
      thought("這次先帶一隻菌走。遇到走不通的路，就看看哪一條線索還沒接上。",{motion:"inspect"})
    ]
  };
  function chapter(state,index=state.chapter) {
    return index===1 && state.mazeMode==="explore" ? explorationChapter : chapters[index];
  }
  window.BreathStory = {intro,chapters,ending,chapter};
})();

