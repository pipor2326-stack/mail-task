// 質問の項目(研究者が編集する)
//
// 〔仮〕と書いてあるものは、まだ仮の項目。項目は自由に足したり消したりしてよい
//
// 各質問の書き方:
//   id:       記録の列名に使う名前(半角英数字。同じグループの中で重ならないようにする)
//             participants シートでは「グループ名_id」の列になる(例:pre_pcFrequency、rating1_effort)
//   text:     質問の文
//   type:     "choice" … 選択肢から1つ選ぶ(options に選択肢を並べる)
//             "scale"  … 数字の目盛りから1つ選ぶ(min〜max。minLabel・maxLabel は両端の説明)
//             "text"   … 自由に書く
//   required: false にすると、答えなくても先へ進める(書かなければ必須)

const QUESTIONS = {

  // 事前質問(グループ名:pre)
  pre: [
    { id: "pcFrequency", text: "〔仮〕パソコンをどのくらいの頻度で使いますか。", type: "choice",
      options: ["ほぼ毎日", "週に数回", "月に数回", "ほとんど使わない"] },
    { id: "mailFrequency", text: "〔仮〕メールをどのくらいの頻度で確認しますか。", type: "choice",
      options: ["1日に何度も", "1日に1回くらい", "週に数回", "ほとんど確認しない"] },
    { id: "folderUse", text: "〔仮〕メールをフォルダに振り分けて整理することがありますか。", type: "choice",
      options: ["よくある", "ときどきある", "ほとんどない", "まったくない"] }
  ],

  // 各ブロックの直後の主観評価(グループ名:rating1 / rating2。同じ項目を2回聞く)
  rating: [
    { id: "effort", text: "〔仮〕いまの課題を行うのに、どのくらい頭を使いましたか(心的努力)。", type: "scale",
      min: 1, max: 9, minLabel: "非常に少ない", maxLabel: "非常に多い" },
    { id: "annoyance", text: "〔仮〕いまの課題で、確認の画面をどのくらい邪魔に感じましたか。", type: "scale",
      min: 1, max: 7, minLabel: "まったく感じない", maxLabel: "非常に感じた" },
    { id: "fatigue", text: "〔仮〕いま、どのくらい疲れていますか。", type: "scale",
      min: 1, max: 7, minLabel: "まったく疲れていない", maxLabel: "非常に疲れている" }
  ],

  // 全体についての質問(グループ名:post)
  post: [
    { id: "dialogAttention", text: "〔仮〕確認の画面が出たとき、メールの内容を見直しましたか。", type: "scale",
      min: 1, max: 7, minLabel: "まったく見直さなかった", maxLabel: "毎回見直した" },
    { id: "comment", text: "〔仮〕課題について、気づいたことや感想があればお書きください。", type: "text", required: false }
  ]
};
