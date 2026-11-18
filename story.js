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
    {target:"審查窗口", objective:"找出哪張培養屬於這次 mNGS 的檢體。", label:"接過第一張檢驗單",
     task:"先點兩邊的檢體編號。選章、蓋章，再把文件送入歸檔口。", script:[
      detective("清冊對上了。L01 是咳出的痰，L02 是肺泡灌洗液。窗口把兩張報告疊在一起，等我蓋章。", {prop:"L01 · 11/16　/　L02 · 11/18", face:1}),
      doctor("把 mNGS 的 L02 放在旁邊比對。L01 的痰液檢驗也留下來，另外註明它來自另一份檢體。", {cue:"phone"}),
      thought("所以留在案卷裡的紀錄，也可能只能當背景。有了正確來源，才能再看結果有沒有指到某個候選。", {motion:"inspect"})
    ]},
    {target:"文獻室", objective:"為只有群組線索的 K. variicola 找可參考的病例。", label:"查看第一篇摘要",
     task:"圈出與本案相符的部位，再右滑收入；不同部位或候選就左滑略過。", script:[
      detective("L02 的培養寫著銅綠假單胞菌。至於 mNGS 那行 K. variicola，FilmArray 只驗到它所屬的菌群。", {face:1, prop:"L02｜FilmArray：Klebsiella pneumoniae group"}),
      doctor("用 K. variicola 和呼吸道檢體去找。小心名字很像的近親。對得上的也要留下檢體類型和作者說到哪裡。", {cue:"phone", face:2}),
      thought("就算別人的病例有這一種，我手上的群組結果仍分不出它。我得把查到的和還缺的都寫進去。", {motion:"inspect"})
    ]},
    {target:"結案桌", objective:"把可追溯的調查報告交回診療室。", label:"打開調查報告",
     task:"展開白色念珠菌的來源，回覆醫師是哪一份檢體，再送出報告。", script:[
      detective("案卷整理好了。{summary}", {face:2}),
      doctor("我回去之前想再確認一件事：最先看到的那張白色念珠菌培養，究竟是哪份檢體？我得讓會診的人也找得到原單。", {cue:"phone"}),
      thought("把確定的檢體和原單寫清楚，菌群這一欄暫時留著疑問。", {motion:"inspect"})
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

  window.BreathStory = {intro,chapters,ending};
})();

