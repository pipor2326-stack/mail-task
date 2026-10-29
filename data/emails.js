// メールのセット(研究者が編集する)
//
// このファイルが、メールの正式な版(面談前の下書き emails-draft.md をもとに作り、そのあと修正したもの)
// 会社名・人名はすべて架空
//
// 各メールの項目:
//   id            メールの番号(全セットを通して重ならないようにする)
//   sender        差出人
//   subject       件名
//   body          本文の短い抜粋
//   correctFolder 正解のフォルダ(js/config.js の FOLDERS と同じ書き方)
//   isTrap        ひっかけなら true、通常なら false
//   trapType      ひっかけの種類(通常のメールは "")
//                   keyword_class     … 件名に「授業」とあるが、差出人は教務課(正解:手続き)
//                   keyword_procedure … 件名に「手続き」とあるが、差出人は先生(正解:授業)
//                   sender_university … 差出人が「大学」だが、キャリアセンター(正解:就職活動)
//                   sender_similar    … 選考中の企業に名前が似ているが、リストにない(正解:その他)
//   note          研究者用メモ:なぜその正解か(参加者には表示しない。下書きにないので空欄)
//   showDialog    【セットPだけ】練習で確認画面を出すなら true
//
// 表示順:P と C はこの並び順のまま(全員同じ)。A と B は参加者ごとにランダム

const EMAILS = {

  // 練習(6通)
  P: [
    { id: "P01", sender: "西村 聡 先生(哲学入門)", subject: "来週の授業の持ち物",
      body: "来週は配布したプリントを必ず持ってきてください。",
      correctFolder: "授業", isTrap: false, trapType: "", note: "", showDialog: true },
    { id: "P02", sender: "写真サークル FOCUS", subject: "撮影会のお知らせ",
      body: "今月の撮影会は公園で行います。参加希望は返信してください。",
      correctFolder: "その他", isTrap: false, trapType: "", note: "", showDialog: false },
    { id: "P03", sender: "青葉ツーリスト株式会社", subject: "インターンシップ説明会のご案内",
      body: "旅行業界に興味のある学生向けに、説明会を開催します。",
      correctFolder: "その他", isTrap: true, trapType: "sender_similar", note: "", showDialog: true },
    { id: "P04", sender: "北斗ソフト株式会社 採用チーム", subject: "書類選考の結果のお知らせ",
      body: "書類選考の結果をマイページに掲載しました。",
      correctFolder: "就職活動", isTrap: false, trapType: "", note: "", showDialog: false },
    { id: "P05", sender: "大学 教務課", subject: "授業の履修中止の申請期間",
      body: "履修中止の申請は、11月15日まで受け付けます。",
      correctFolder: "手続き", isTrap: true, trapType: "keyword_class", note: "", showDialog: false },
    { id: "P06", sender: "大学 学生課", subject: "住所変更の届け出について",
      body: "引っ越しをした人は、学生課の窓口で届け出をしてください。",
      correctFolder: "手続き", isTrap: false, trapType: "", note: "", showDialog: true }
  ],

  // 事前の共通課題(8通。確認画面なし)
  C: [
    { id: "C01", sender: "大学 学生課", subject: "奨学金の申込書類の配布",
      body: "来年度の奨学金の申込書類を、学生課で配布しています。",
      correctFolder: "手続き", isTrap: false, trapType: "", note: "" },
    { id: "C02", sender: "藤井 康介 先生(経営学入門)", subject: "レポートの返却について",
      body: "前回のレポートを、次の授業で返却します。",
      correctFolder: "授業", isTrap: false, trapType: "", note: "" },
    { id: "C03", sender: "大学 キャリアセンター", subject: "インターンシップ報告会のご案内",
      body: "夏にインターンシップに参加した先輩が体験を話します。",
      correctFolder: "就職活動", isTrap: true, trapType: "sender_university", note: "" },
    { id: "C04", sender: "ヨガスタジオ ルーム", subject: "体験レッスンのご案内",
      body: "学生割引で体験レッスンを受けられます。",
      correctFolder: "その他", isTrap: false, trapType: "", note: "" },
    { id: "C05", sender: "株式会社つばさ食品 人事部", subject: "グループ面接の日程について",
      body: "グループ面接の候補日をお送りします。ご都合をお知らせください。",
      correctFolder: "就職活動", isTrap: false, trapType: "", note: "" },
    { id: "C06", sender: "松本 直樹 先生(地域社会論)", subject: "フィールドワークの申込手続き",
      body: "授業で行うフィールドワークの申し込みは、次回の授業で受け付けます。",
      correctFolder: "授業", isTrap: true, trapType: "keyword_procedure", note: "" },
    { id: "C07", sender: "大学 保健センター", subject: "インフルエンザ予防接種の申し込み",
      body: "学内での予防接種を希望する人は、申込用紙を提出してください。",
      correctFolder: "手続き", isTrap: false, trapType: "", note: "" },
    { id: "C08", sender: "映画サークル シネマ", subject: "上映会の打ち合わせ",
      body: "次の上映会の作品を決めるので、金曜日に集まりましょう。",
      correctFolder: "その他", isTrap: false, trapType: "", note: "" }
  ],

  // 本番(20通)
  A: [
    { id: "A01", sender: "山本 健 先生(経済学入門)", subject: "10月30日の休講について",
      body: "本日の授業は休講とします。補講の日程は後日お知らせします。",
      correctFolder: "授業", isTrap: false, trapType: "", note: "" },
    { id: "A02", sender: "佐々木 由美 先生(心理学概論)", subject: "第5回の課題について",
      body: "課題のテーマを授業の掲示板に載せました。来週までに提出してください。",
      correctFolder: "授業", isTrap: false, trapType: "", note: "" },
    { id: "A03", sender: "林 浩二 先生(統計学)", subject: "教室変更のお知らせ",
      body: "来週から3号館201教室で授業を行います。",
      correctFolder: "授業", isTrap: false, trapType: "", note: "" },
    { id: "A04", sender: "小川 真理 先生(英語コミュニケーション)", subject: "小テストの範囲",
      body: "来週の小テストは、Unit 4と5から出題します。",
      correctFolder: "授業", isTrap: false, trapType: "", note: "" },
    { id: "A05", sender: "石田 誠 先生(社会学基礎)", subject: "レポート提出の手続きについて",
      body: "レポートは授業の掲示板から提出してください。締切は11月10日です。",
      correctFolder: "授業", isTrap: true, trapType: "keyword_procedure", note: "" },
    { id: "A06", sender: "株式会社つばさ食品 人事部", subject: "一次面接の日程のご案内",
      body: "一次面接の候補日をお送りします。",
      correctFolder: "就職活動", isTrap: false, trapType: "", note: "" },
    { id: "A07", sender: "青葉トラベル株式会社 採用担当", subject: "エントリーシート受付完了のお知らせ",
      body: "エントリーシートを受け付けました。結果は2週間以内にお知らせします。",
      correctFolder: "就職活動", isTrap: false, trapType: "", note: "" },
    { id: "A08", sender: "北斗ソフト株式会社 採用チーム", subject: "会社説明会の資料送付",
      body: "先日の会社説明会の資料をお送りします。",
      correctFolder: "就職活動", isTrap: false, trapType: "", note: "" },
    { id: "A09", sender: "株式会社つばさ食品 人事部", subject: "適性検査の受検について",
      body: "Webでの適性検査を、今週中に受けてください。",
      correctFolder: "就職活動", isTrap: false, trapType: "", note: "" },
    { id: "A10", sender: "大学 キャリアセンター", subject: "就職活動の個別相談のご案内",
      body: "就職活動の悩みを、職員に個別で相談できます。",
      correctFolder: "就職活動", isTrap: true, trapType: "sender_university", note: "" },
    { id: "A11", sender: "大学 学生課", subject: "奨学金の継続手続きについて",
      body: "奨学金を続けて受ける人は、12月までに書類を提出してください。",
      correctFolder: "手続き", isTrap: false, trapType: "", note: "" },
    { id: "A12", sender: "大学 学生課", subject: "学生証の再発行の受付",
      body: "学生証をなくした人は、学生課の窓口で再発行できます。",
      correctFolder: "手続き", isTrap: false, trapType: "", note: "" },
    { id: "A13", sender: "大学 保健センター", subject: "健康診断の再受診の案内",
      body: "健康診断を受けられなかった人のために、11月に再受診日を設けます。",
      correctFolder: "手続き", isTrap: false, trapType: "", note: "" },
    { id: "A14", sender: "大学 教務課", subject: "卒業見込証明書の発行について",
      body: "卒業見込証明書を、自動発行機で発行できるようになりました。",
      correctFolder: "手続き", isTrap: false, trapType: "", note: "" },
    { id: "A15", sender: "大学 教務課", subject: "授業の履修登録の修正期間について",
      body: "後期の履修登録の修正は、10月31日までです。",
      correctFolder: "手続き", isTrap: true, trapType: "keyword_class", note: "" },
    { id: "A16", sender: "テニスサークル SMASH", subject: "今週末の練習について",
      body: "土曜日の練習は、雨の場合は中止です。",
      correctFolder: "その他", isTrap: false, trapType: "", note: "" },
    { id: "A17", sender: "カフェ・モカ", subject: "11月のクーポンをお届けします",
      body: "アプリの画面を見せると、ドリンクが50円引きになります。",
      correctFolder: "その他", isTrap: false, trapType: "", note: "" },
    { id: "A18", sender: "書店ブックス大和(アルバイト先)", subject: "来月のシフト希望の提出",
      body: "来月のシフト希望を、金曜日までに出してください。",
      correctFolder: "その他", isTrap: false, trapType: "", note: "" },
    { id: "A19", sender: "ネットショップ ハコブネ", subject: "ご注文の商品を発送しました",
      body: "ご注文の商品を本日発送しました。",
      correctFolder: "その他", isTrap: false, trapType: "", note: "" },
    { id: "A20", sender: "株式会社つばさフーズ", subject: "冬のインターンシップ参加者募集",
      body: "食品業界に興味のある学生を対象に、冬のインターンシップを行います。",
      correctFolder: "その他", isTrap: true, trapType: "sender_similar", note: "" }
  ],

  // 本番(20通)
  B: [
    { id: "B01", sender: "中村 恵 先生(日本文学)", subject: "11月6日の授業は休講です",
      body: "11月6日の授業は休講です。課題は掲示板に載せます。",
      correctFolder: "授業", isTrap: false, trapType: "", note: "" },
    { id: "B02", sender: "高木 隆 先生(発達心理学)", subject: "ミニレポートの課題を掲載しました",
      body: "今週のミニレポートの課題を、授業の掲示板に載せました。",
      correctFolder: "授業", isTrap: false, trapType: "", note: "" },
    { id: "B03", sender: "森田 修 先生(情報処理演習)", subject: "次回はPC教室で行います",
      body: "次回の授業は、2号館のPC教室で行います。",
      correctFolder: "授業", isTrap: false, trapType: "", note: "" },
    { id: "B04", sender: "吉川 あゆみ 先生(中国語I)", subject: "中間テストの範囲について",
      body: "中間テストは、第1課から第6課までです。",
      correctFolder: "授業", isTrap: false, trapType: "", note: "" },
    { id: "B05", sender: "岡本 誠一 先生(教育学概論)", subject: "課題提出の手続きの変更",
      body: "課題の提出方法を、紙から授業の掲示板に変更します。",
      correctFolder: "授業", isTrap: true, trapType: "keyword_procedure", note: "" },
    { id: "B06", sender: "青葉トラベル株式会社 採用担当", subject: "二次面接のご案内",
      body: "二次面接にお進みいただきます。日程をご確認ください。",
      correctFolder: "就職活動", isTrap: false, trapType: "", note: "" },
    { id: "B07", sender: "北斗ソフト株式会社 採用チーム", subject: "エントリーの受付を完了しました",
      body: "エントリーを受け付けました。今後の選考をご案内します。",
      correctFolder: "就職活動", isTrap: false, trapType: "", note: "" },
    { id: "B08", sender: "株式会社つばさ食品 人事部", subject: "工場見学会のご案内",
      body: "選考に進んでいる方を対象に、工場見学会を行います。",
      correctFolder: "就職活動", isTrap: false, trapType: "", note: "" },
    { id: "B09", sender: "青葉トラベル株式会社 採用担当", subject: "Web適性検査の受検期限",
      body: "Web適性検査の受検期限は、11月8日です。",
      correctFolder: "就職活動", isTrap: false, trapType: "", note: "" },
    { id: "B10", sender: "大学 キャリアセンター", subject: "面接対策講座の参加者募集",
      body: "面接の練習ができる講座を、12月に開きます。",
      correctFolder: "就職活動", isTrap: true, trapType: "sender_university", note: "" },
    { id: "B11", sender: "大学 学生課", subject: "通学証明書の発行について",
      body: "通学定期を買うための証明書を、窓口で発行しています。",
      correctFolder: "手続き", isTrap: false, trapType: "", note: "" },
    { id: "B12", sender: "大学 学生課", subject: "学生保険の加入手続きについて",
      body: "学生向けの保険の加入は、学生課の窓口で受け付けています。",
      correctFolder: "手続き", isTrap: false, trapType: "", note: "" },
    { id: "B13", sender: "大学 保健センター", subject: "健康診断の結果の受け取り",
      body: "健康診断の結果を、保健センターで受け取ってください。",
      correctFolder: "手続き", isTrap: false, trapType: "", note: "" },
    { id: "B14", sender: "大学 教務課", subject: "在学証明書の自動発行機の停止",
      body: "11月3日は点検のため、自動発行機を使えません。",
      correctFolder: "手続き", isTrap: false, trapType: "", note: "" },
    { id: "B15", sender: "大学 教務課", subject: "授業の追加登録の申し込みについて",
      body: "追加で履修したい授業がある人は、申込書を提出してください。",
      correctFolder: "手続き", isTrap: true, trapType: "keyword_class", note: "" },
    { id: "B16", sender: "軽音楽サークル Groove", subject: "ライブのリハーサル日程",
      body: "学園祭ライブのリハーサルは、木曜日の18時からです。",
      correctFolder: "その他", isTrap: false, trapType: "", note: "" },
    { id: "B17", sender: "ベーカリー小麦堂", subject: "新商品のお知らせ",
      body: "秋の新商品のパンを発売しました。",
      correctFolder: "その他", isTrap: false, trapType: "", note: "" },
    { id: "B18", sender: "ファミリーレストラン ひだまり(アルバイト先)", subject: "年末のシフトのお願い",
      body: "年末に入れる日を、店長まで教えてください。",
      correctFolder: "その他", isTrap: false, trapType: "", note: "" },
    { id: "B19", sender: "動画配信サービス ミルフィ", subject: "今月のおすすめ作品",
      body: "今月新しく配信された作品をご紹介します。",
      correctFolder: "その他", isTrap: false, trapType: "", note: "" },
    { id: "B20", sender: "北斗システム株式会社", subject: "エンジニア職の会社説明会",
      body: "IT業界に興味のある学生向けに、会社説明会を開きます。",
      correctFolder: "その他", isTrap: true, trapType: "sender_similar", note: "" }
  ]
};
