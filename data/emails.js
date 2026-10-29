// メールのセット(研究者が編集する)
//
// 〔仮〕段階3のダミー。各セット数通だけ入れてある。本番用のメールは段階8で作る
//
// 各メールの項目:
//   id            メールの番号(全セットを通して重ならないようにする)
//   sender        差出人
//   subject       件名
//   body          本文の短い抜粋
//   correctFolder 正解のフォルダ(js/config.js の FOLDERS と同じ書き方)
//   isTrap        ひっかけなら true、通常なら false
//   trapType      ひっかけの種類(通常のメールは "")
//   note          研究者用メモ:なぜその正解か(参加者には表示しない)
//   showDialog    【セットPだけ】練習で確認画面を出すなら true(段階4で使う)
//
// 表示順:P と C はこの並び順のまま(全員同じ)。A と B は参加者ごとにランダム

const EMAILS = {

  // 練習
  P: [
    { id: "P01", sender: "山本 健", subject: "3月分の交通費精算について", body: "先月分の交通費の精算書を添付します。ご確認ください。",
      correctFolder: "経理", isTrap: false, trapType: "", note: "経費の精算", showDialog: true },
    { id: "P02", sender: "株式会社みどり商事 木村", subject: "お見積もりのお願い", body: "新しい事務用品の導入について、お見積もりをお願いできますでしょうか。",
      correctFolder: "営業", isTrap: true, trapType: "〔仮〕事務用品という語があるが顧客からの見積依頼", note: "顧客からの見積依頼なので営業", showDialog: false },
    { id: "P03", sender: "施設管理担当", subject: "会議室の空調点検のお知らせ", body: "来週水曜日に、3階会議室の空調点検を行います。",
      correctFolder: "総務", isTrap: false, trapType: "", note: "施設", showDialog: true }
  ],

  // 事前の共通課題(確認画面なし)
  C: [
    { id: "C01", sender: "経理部 中村", subject: "請求書の再発行について", body: "先日お送りした請求書に誤りがあったため、再発行いたします。",
      correctFolder: "経理", isTrap: false, trapType: "", note: "請求書" },
    { id: "C02", sender: "小林 由美", subject: "ランチのお誘い", body: "来週、部署のみんなでランチに行きませんか。",
      correctFolder: "その他", isTrap: false, trapType: "", note: "どれにも当てはまらない" },
    { id: "C03", sender: "総務部 加藤", subject: "コピー用紙の補充について", body: "2階のコピー機の用紙を補充しました。",
      correctFolder: "総務", isTrap: false, trapType: "", note: "備品" }
  ],

  // 本番
  A: [
    { id: "A01", sender: "伊藤 誠", subject: "出張費の仮払い申請", body: "来月の大阪出張について、仮払いを申請します。",
      correctFolder: "経理", isTrap: false, trapType: "", note: "経費" },
    { id: "A02", sender: "株式会社あおば 吉田", subject: "商談日程のご相談", body: "新製品のご紹介について、お打ち合わせの日程をご相談させてください。",
      correctFolder: "営業", isTrap: false, trapType: "", note: "顧客との商談" },
    { id: "A03", sender: "総務課", subject: "防災訓練の実施について", body: "10月15日に全館で防災訓練を実施します。",
      correctFolder: "総務", isTrap: false, trapType: "", note: "社内行事" },
    { id: "A04", sender: "松本 さくら", subject: "おすすめの本", body: "この前話していた本、読み終わったのでお貸しします。",
      correctFolder: "その他", isTrap: false, trapType: "", note: "どれにも当てはまらない" }
  ],

  // 本番
  B: [
    { id: "B01", sender: "経理課 斎藤", subject: "振込手数料の確認", body: "先月の振込手数料について、明細をご確認ください。",
      correctFolder: "経理", isTrap: false, trapType: "", note: "支払い" },
    { id: "B02", sender: "有限会社ひかり 清水", subject: "ご注文内容の確認", body: "先日ご連絡いただいた追加注文の内容を確認させてください。",
      correctFolder: "営業", isTrap: false, trapType: "", note: "顧客" },
    { id: "B03", sender: "庶務担当 山口", subject: "駐輪場の利用ルール変更", body: "来月から、駐輪場の利用には登録が必要になります。",
      correctFolder: "総務", isTrap: false, trapType: "", note: "施設" },
    { id: "B04", sender: "森 大輔", subject: "週末の写真", body: "週末に撮った写真を共有します。",
      correctFolder: "その他", isTrap: false, trapType: "", note: "どれにも当てはまらない" }
  ]
};
