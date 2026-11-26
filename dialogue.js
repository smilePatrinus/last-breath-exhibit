(function () {
  "use strict";
  const phrases=[
    "檢出不等於致病","檢出 ≠ 致病","不一定正在造成感染","不能直接當作致病菌","不足以認定","不足以確認致病",
    "同菌種、同檢體","同菌種 BAL 培養支持","同一份 BAL 檢體","同一份檢體","另一份 L01 痰液","L01 痰液",
    "撿到鑰匙不會直接開門","每段限時七十五秒","打錯扣八秒，打歪或碰到遮擋扣四秒",
    "前後 72 小時","前後三天","倒數不會變慢","包含端點","採檢日期","採檢時間","檢體編號","核發日","核發日期","採檢日",
    "尚待確認","仍待確認","保持未知","保留未知","未提供","證據不足","未確認致病","保留疑問",
    "原始紀錄","原始來源","對回證據","推論","文獻限制","限制","檢體部位","檢體類型","菌群層級","物種",
    "背景訊號","定植","微生物的遺傳訊號","參考資料庫","reads","定序","mNGS",
    "資料整理","整理、對齊","線索鑰匙","鑰匙包","金色路線","培養來源","培養的來源","血液、無菌部位或病理",
    "同菌種","呼吸道","檢體與日期","每段只有一枚","一枚言彈","集中","同一編號","同一個檢體編號",
    "分類卡","菌種特性","判讀手冊","原單","依據","K. variicola","Klebsiella pneumoniae group",
    "放進檢驗結果欄","收錄","收入案卷","略過","沒把不知道的事當成答案"
  ];
  const escape=text=>String(text).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function render(value,emphasis=[]) {
    const text=String(value??""),spans=[];
    for(const phrase of emphasis.length?emphasis:phrases) {
      if(!phrase)continue;
      const start=text.indexOf(phrase),end=start+phrase.length;
      if(start<0||spans.some(s=>start<s.end&&end>s.start))continue;
      spans.push({start,end});if(spans.length===3)break;
    }
    spans.sort((a,b)=>a.start-b.start);
    let index=0,output="";
    for(const s of spans){output+=escape(text.slice(index,s.start))+'<strong class="dialogue-key">'+escape(text.slice(s.start,s.end))+'</strong>';index=s.end;}
    return output+escape(text.slice(index));
  }
  window.BreathDialogue={render};
})();
