// メールのセット(研究者が編集する)
//
// このファイルが、メールの正式な版(第4版:プロフィール方式。emails-draft-v4.md の内容をそのまま入れたもの)
// 大学名・人名・会社名はすべて架空
//
// 各メールの項目:
//   id            メールの番号(全セットを通して重ならないようにする)
//   sender        差出人
//   subject       件名
//   body          本文の短い抜粋
//   correctFolder 正解のフォルダ(js/config.js の FOLDERS と同じ書き方)
//   isTrap        ひっかけなら true、通常なら false
//   trapType      ひっかけの種類(通常のメールは "")
//                   similar_company             … 選考中の企業に名前が似ているが、設定にない(正解:その他)
//                   other_university            … みなと大学に名前が似た、ほかの大学(窓口または先生)(正解:その他)
//                   company_other_dept          … 選考中の企業の、人事以外の部署(正解:就職活動)
//                   career_center               … みなと大学の、キャリアセンター(正解:就職活動)
//                   course_procedure_subject    … みなと大学の先生から、手続きのような件名(正解:授業)
//                   office_nonprocedure_subject … みなと大学の窓口から、手続きに見えない件名(正解:手続き)
//   trapGroup     ひっかけのまとまり(通常のメールは "")
//                   not_mine … 似ているが、自分のものではない(similar_company・other_university)
//                   is_mine  … 見た目は違うが、自分のもの(上のそれ以外の4種類)
//                 低頻度の抽選は js/config.js の TRAP_GROUPS で分ける。点検で、この値と食い違いがないかを確かめる
//   note          研究者用メモ:なぜその正解か(参加者には表示しない。下書きにないので空欄)
//   showDialog    【セットPだけ】練習で確認画面を出すなら true
//
// 表示順:P と C はこの並び順のまま(全員同じ)。A と B は参加者ごとにランダム

const EMAILS = {

  // 練習(6通)
  P: [
    { id: "P01", sender: "みなと大学 小川 真理 先生(英語コミュニケーション)", subject: "来週の授業の持ち物",
      body: "来週は英和辞典を持ってきてください。",
      correctFolder: "授業", isTrap: false, trapType: "", trapGroup: "", note: "", showDialog: true },
    { id: "P02", sender: "写真サークル FOCUS", subject: "撮影会のお知らせ",
      body: "今月の撮影会は公園で行います。参加希望は返信してください。",
      correctFolder: "その他", isTrap: false, trapType: "", trapGroup: "", note: "", showDialog: false },
    { id: "P03", sender: "みなと国際大学 学生課", subject: "公開講座の受講手続きについて",
      body: "本学の公開講座の受講手続きをご案内します。",
      correctFolder: "その他", isTrap: true, trapType: "other_university", trapGroup: "not_mine", note: "", showDialog: true },
    { id: "P04", sender: "北斗ソフト株式会社 採用チーム", subject: "書類選考の結果のお知らせ",
      body: "書類選考の結果をマイページに掲載しました。",
      correctFolder: "就職活動", isTrap: false, trapType: "", trapGroup: "", note: "", showDialog: false },
    { id: "P05", sender: "みなと大学 キャリアセンター", subject: "業界研究セミナーのご案内",
      body: "さまざまな業界の仕事を知るセミナーを開きます。",
      correctFolder: "就職活動", isTrap: true, trapType: "career_center", trapGroup: "is_mine", note: "", showDialog: false },
    { id: "P06", sender: "みなと大学 学生課", subject: "住所変更の届け出について",
      body: "引っ越しをした人は、学生課の窓口で届け出をしてください。",
      correctFolder: "手続き", isTrap: false, trapType: "", trapGroup: "", note: "", showDialog: true }
  ],

  // 事前の共通課題(8通。確認画面なし)
  C: [
    { id: "C01", sender: "みなと大学 学生課", subject: "奨学金の申込書類の配布",
      body: "来年度の奨学金の申込書類を、学生課で配布しています。",
      correctFolder: "手続き", isTrap: false, trapType: "", trapGroup: "", note: "" },
    { id: "C02", sender: "みなと大学 林 浩二 先生(統計学)", subject: "小テストの返却について",
      body: "前回の小テストを、次の授業で返却します。",
      correctFolder: "授業", isTrap: false, trapType: "", trapGroup: "", note: "" },
    { id: "C03", sender: "北みなと大学 山田 健 先生(経済学概論)", subject: "公開授業のご案内",
      body: "本学の授業を、ほかの大学の学生も見学できます。",
      correctFolder: "その他", isTrap: true, trapType: "other_university", trapGroup: "not_mine", note: "" },
    { id: "C04", sender: "ヨガスタジオ ルーム", subject: "体験レッスンのご案内",
      body: "学生割引で体験レッスンを受けられます。",
      correctFolder: "その他", isTrap: false, trapType: "", trapGroup: "", note: "" },
    { id: "C05", sender: "株式会社つばさ食品 人事部", subject: "グループ面接の日程について",
      body: "グループ面接の候補日をお送りします。ご都合をお知らせください。",
      correctFolder: "就職活動", isTrap: false, trapType: "", trapGroup: "", note: "" },
    { id: "C06", sender: "みなと大学 佐々木 由美 先生(心理学概論)", subject: "課題提出の手続きについて",
      body: "課題は、授業の掲示板から提出してください。",
      correctFolder: "授業", isTrap: true, trapType: "course_procedure_subject", trapGroup: "is_mine", note: "" },
    { id: "C07", sender: "みなと大学 保健センター", subject: "健康診断の結果の受け取り",
      body: "健康診断の結果を、保健センターで受け取ってください。",
      correctFolder: "手続き", isTrap: false, trapType: "", trapGroup: "", note: "" },
    { id: "C08", sender: "青葉トラベル株式会社 採用担当", subject: "エントリーシート受付完了のお知らせ",
      body: "エントリーシートを受け付けました。結果は2週間以内にお知らせします。",
      correctFolder: "就職活動", isTrap: false, trapType: "", trapGroup: "", note: "" }
  ],

  // 本番(20通)
  A: [
    { id: "A01", sender: "みなと大学 山本 健 先生(経済学入門)", subject: "10月30日の休講について",
      body: "本日の授業は休講とします。補講の日程は後日お知らせします。",
      correctFolder: "授業", isTrap: false, trapType: "", trapGroup: "", note: "" },
    { id: "A02", sender: "みなと大学 佐々木 由美 先生(心理学概論)", subject: "第5回の課題について",
      body: "課題のテーマを授業の掲示板に載せました。来週までに提出してください。",
      correctFolder: "授業", isTrap: false, trapType: "", trapGroup: "", note: "" },
    { id: "A03", sender: "みなと大学 林 浩二 先生(統計学)", subject: "教室変更のお知らせ",
      body: "来週から3号館201教室で授業を行います。",
      correctFolder: "授業", isTrap: false, trapType: "", trapGroup: "", note: "" },
    { id: "A04", sender: "みなと大学 小川 真理 先生(英語コミュニケーション)", subject: "小テストの範囲",
      body: "来週の小テストは、Unit 4と5から出題します。",
      correctFolder: "授業", isTrap: false, trapType: "", trapGroup: "", note: "" },
    { id: "A05", sender: "みなと大学 山本 健 先生(経済学入門)", subject: "欠席届の提出手続きについて",
      body: "欠席する場合は、所定の用紙で届け出てください。",
      correctFolder: "授業", isTrap: true, trapType: "course_procedure_subject", trapGroup: "is_mine", note: "" },
    { id: "A06", sender: "株式会社つばさ食品 人事部", subject: "一次面接の日程のご案内",
      body: "一次面接の候補日をお送りします。",
      correctFolder: "就職活動", isTrap: false, trapType: "", trapGroup: "", note: "" },
    { id: "A07", sender: "青葉トラベル株式会社 採用担当", subject: "適性検査の受検について",
      body: "Webでの適性検査を、今週中に受けてください。",
      correctFolder: "就職活動", isTrap: false, trapType: "", trapGroup: "", note: "" },
    { id: "A08", sender: "北斗ソフト株式会社 採用チーム", subject: "会社説明会の資料送付",
      body: "先日の会社説明会の資料をお送りします。",
      correctFolder: "就職活動", isTrap: false, trapType: "", trapGroup: "", note: "" },
    { id: "A09", sender: "株式会社つばさ食品 総務部", subject: "本社見学の参加手続きについて",
      body: "本社見学に参加される方は、前日までにご連絡ください。",
      correctFolder: "就職活動", isTrap: true, trapType: "company_other_dept", trapGroup: "is_mine", note: "" },
    { id: "A10", sender: "みなと大学 キャリアセンター", subject: "就職活動の個別相談のご案内",
      body: "就職活動の悩みを、職員に個別で相談できます。",
      correctFolder: "就職活動", isTrap: true, trapType: "career_center", trapGroup: "is_mine", note: "" },
    { id: "A11", sender: "みなと大学 学生課", subject: "奨学金の継続手続きについて",
      body: "奨学金を続けて受ける人は、12月までに書類を提出してください。",
      correctFolder: "手続き", isTrap: false, trapType: "", trapGroup: "", note: "" },
    { id: "A12", sender: "みなと大学 学生課", subject: "学生証の再発行の受付",
      body: "学生証をなくした人は、学生課の窓口で再発行できます。",
      correctFolder: "手続き", isTrap: false, trapType: "", trapGroup: "", note: "" },
    { id: "A13", sender: "みなと大学 保健センター", subject: "健康診断の再受診の案内",
      body: "健康診断を受けられなかった人のために、11月に再受診日を設けます。",
      correctFolder: "手続き", isTrap: false, trapType: "", trapGroup: "", note: "" },
    { id: "A14", sender: "みなと大学 教務課", subject: "後期の履修登録の修正期間",
      body: "後期の履修登録の修正は、10月31日までです。",
      correctFolder: "手続き", isTrap: false, trapType: "", trapGroup: "", note: "" },
    { id: "A15", sender: "みなと大学 学生課", subject: "学園祭の開催のお知らせ",
      body: "今年の学園祭は、11月22日と23日に開催します。",
      correctFolder: "手続き", isTrap: true, trapType: "office_nonprocedure_subject", trapGroup: "is_mine", note: "" },
    { id: "A16", sender: "テニスサークル SMASH", subject: "今週末の練習について",
      body: "土曜日の練習は、雨の場合は中止です。",
      correctFolder: "その他", isTrap: false, trapType: "", trapGroup: "", note: "" },
    { id: "A17", sender: "株式会社つばさフーズ 人事部", subject: "冬のインターンシップ参加者募集",
      body: "食品業界に興味のある学生を対象に、冬のインターンシップを行います。",
      correctFolder: "その他", isTrap: true, trapType: "similar_company", trapGroup: "not_mine", note: "" },
    { id: "A18", sender: "みなと工科大学 教務課", subject: "公開講座の受講申込について",
      body: "本学の公開講座の受講申込を受け付けています。",
      correctFolder: "その他", isTrap: true, trapType: "other_university", trapGroup: "not_mine", note: "" },
    { id: "A19", sender: "北みなと大学 学生課", subject: "合同説明会の参加手続き",
      body: "学生向けの合同説明会の参加手続きをご案内します。",
      correctFolder: "その他", isTrap: true, trapType: "other_university", trapGroup: "not_mine", note: "" },
    { id: "A20", sender: "東みなと大学 中田 誠 先生(社会学入門)", subject: "特別講義の受講者募集",
      body: "ほかの大学の学生も受けられる特別講義を開きます。",
      correctFolder: "その他", isTrap: true, trapType: "other_university", trapGroup: "not_mine", note: "" }
  ],

  // 本番(20通)
  B: [
    { id: "B01", sender: "みなと大学 小川 真理 先生(英語コミュニケーション)", subject: "11月6日の授業は休講です",
      body: "11月6日の授業は休講です。課題は掲示板に載せます。",
      correctFolder: "授業", isTrap: false, trapType: "", trapGroup: "", note: "" },
    { id: "B02", sender: "みなと大学 林 浩二 先生(統計学)", subject: "演習課題を掲載しました",
      body: "今週の演習課題を、授業の掲示板に載せました。",
      correctFolder: "授業", isTrap: false, trapType: "", trapGroup: "", note: "" },
    { id: "B03", sender: "みなと大学 山本 健 先生(経済学入門)", subject: "次回はPC教室で行います",
      body: "次回の授業は、2号館のPC教室で行います。",
      correctFolder: "授業", isTrap: false, trapType: "", trapGroup: "", note: "" },
    { id: "B04", sender: "みなと大学 佐々木 由美 先生(心理学概論)", subject: "中間テストの範囲について",
      body: "中間テストは、第1回から第6回の内容から出題します。",
      correctFolder: "授業", isTrap: false, trapType: "", trapGroup: "", note: "" },
    { id: "B05", sender: "みなと大学 林 浩二 先生(統計学)", subject: "レポート提出の手続きの変更",
      body: "レポートの提出方法を、紙から授業の掲示板に変更します。",
      correctFolder: "授業", isTrap: true, trapType: "course_procedure_subject", trapGroup: "is_mine", note: "" },
    { id: "B06", sender: "青葉トラベル株式会社 採用担当", subject: "二次面接のご案内",
      body: "二次面接にお進みいただきます。日程をご確認ください。",
      correctFolder: "就職活動", isTrap: false, trapType: "", trapGroup: "", note: "" },
    { id: "B07", sender: "北斗ソフト株式会社 採用チーム", subject: "エントリーの受付を完了しました",
      body: "エントリーを受け付けました。今後の選考をご案内します。",
      correctFolder: "就職活動", isTrap: false, trapType: "", trapGroup: "", note: "" },
    { id: "B08", sender: "株式会社つばさ食品 人事部", subject: "工場見学会のご案内",
      body: "選考に進んでいる方を対象に、工場見学会を行います。",
      correctFolder: "就職活動", isTrap: false, trapType: "", trapGroup: "", note: "" },
    { id: "B09", sender: "北斗ソフト株式会社 総務部", subject: "面接当日の交通費の精算について",
      body: "面接にお越しいただいた際の交通費を精算します。",
      correctFolder: "就職活動", isTrap: true, trapType: "company_other_dept", trapGroup: "is_mine", note: "" },
    { id: "B10", sender: "みなと大学 キャリアセンター", subject: "面接対策講座の参加者募集",
      body: "面接の練習ができる講座を、12月に開きます。",
      correctFolder: "就職活動", isTrap: true, trapType: "career_center", trapGroup: "is_mine", note: "" },
    { id: "B11", sender: "みなと大学 学生課", subject: "通学証明書の発行について",
      body: "通学定期を買うための証明書を、窓口で発行しています。",
      correctFolder: "手続き", isTrap: false, trapType: "", trapGroup: "", note: "" },
    { id: "B12", sender: "みなと大学 学生課", subject: "学生保険の加入手続きについて",
      body: "学生向けの保険の加入は、学生課の窓口で受け付けています。",
      correctFolder: "手続き", isTrap: false, trapType: "", trapGroup: "", note: "" },
    { id: "B13", sender: "みなと大学 保健センター", subject: "健康診断の日程のお知らせ",
      body: "来年度の健康診断は、4月に行います。",
      correctFolder: "手続き", isTrap: false, trapType: "", trapGroup: "", note: "" },
    { id: "B14", sender: "みなと大学 教務課", subject: "在学証明書の自動発行機の停止",
      body: "11月3日は点検のため、自動発行機を使えません。",
      correctFolder: "手続き", isTrap: false, trapType: "", trapGroup: "", note: "" },
    { id: "B15", sender: "みなと大学 保健センター", subject: "季節の変わり目の体調管理について",
      body: "寒くなってきたので、体調管理に気をつけてください。",
      correctFolder: "手続き", isTrap: true, trapType: "office_nonprocedure_subject", trapGroup: "is_mine", note: "" },
    { id: "B16", sender: "軽音楽サークル ハミング", subject: "ライブのリハーサル日程",
      body: "学園祭ライブのリハーサルは、木曜日の18時からです。",
      correctFolder: "その他", isTrap: false, trapType: "", trapGroup: "", note: "" },
    { id: "B17", sender: "北斗ソフトウェア株式会社", subject: "エンジニア職の会社説明会",
      body: "IT業界に興味のある学生向けに、会社説明会を開きます。",
      correctFolder: "その他", isTrap: true, trapType: "similar_company", trapGroup: "not_mine", note: "" },
    { id: "B18", sender: "南みなと大学 教務課", subject: "単位互換制度の申込について",
      body: "ほかの大学の授業を受けられる制度の申込を受け付けています。",
      correctFolder: "その他", isTrap: true, trapType: "other_university", trapGroup: "not_mine", note: "" },
    { id: "B19", sender: "みなと文化大学 学生課", subject: "学生寮の入寮手続きについて",
      body: "来年度の学生寮の入寮手続きをご案内します。",
      correctFolder: "その他", isTrap: true, trapType: "other_university", trapGroup: "not_mine", note: "" },
    { id: "B20", sender: "みなと学院大学 小林 恵 先生(英語)", subject: "英語オープン講座のご案内",
      body: "ほかの大学の学生も参加できる英語の講座を開きます。",
      correctFolder: "その他", isTrap: true, trapType: "other_university", trapGroup: "not_mine", note: "" }
  ]
};
