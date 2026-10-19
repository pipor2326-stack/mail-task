// ダミーメールデータ（8件）
// correctAction: "archive"（アーカイブすべき） / "trash"（ゴミ箱にすべき） / "none"（どちらもすべきでない）
// ルール: 「システム通知」「配送サービス」等の自動送信メールはtrash、それ以外の人からのメールはarchive
const emails = [
  { sender: "田中 太郎", subject: "来週の会議日程について", date: "2026-09-20", correctAction: "archive" },
  { sender: "山田 花子", subject: "資料送付のお願い", date: "2026-09-21", correctAction: "archive" },
  { sender: "システム通知", subject: "パスワード変更のお知らせ", date: "2026-09-21", correctAction: "trash" },
  { sender: "佐藤 次郎", subject: "見積書のご確認", date: "2026-09-22", correctAction: "archive" },
  { sender: "鈴木 一郎", subject: "Re: プロジェクト進捗共有", date: "2026-09-23", correctAction: "archive" },
  { sender: "総務部", subject: "健康診断のご案内", date: "2026-09-24", correctAction: "archive" },
  { sender: "高橋 美咲", subject: "打ち合わせ議事録の共有", date: "2026-09-25", correctAction: "archive" },
  { sender: "配送サービス", subject: "お荷物のお届け完了のお知らせ", date: "2026-09-26", correctAction: "trash" }
];
