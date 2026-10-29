// 実験の設定値をまとめるファイル
// 〔 〕の値は SPEC.md の仮の値。決まったらここを書き換える

// ===== 条件 =====

// 確認画面を出す割合(低頻度条件・高頻度条件)。0.25 = 25%
const LOW_RATE = 0.25;
const HIGH_RATE = 1.0;

// ===== 課題 =====

// フォルダ名(画面のボタンに、この順番で左から並ぶ)
const FOLDERS = ["経理", "営業", "総務", "その他"];

// 各セットの通数とひっかけ数(開発者モードでメールのデータを点検するときの「正しい数」)
const SET_SIZES = {
  P: { total: 6, trap: 2 },   // 練習
  C: { total: 8, trap: 2 },   // 事前の共通課題
  A: { total: 20, trap: 4 },  // 本番
  B: { total: 20, trap: 4 }   // 本番
};

// 本番セット(A・B)で、正解フォルダごとにそろえる通数
const MAIN_PER_FOLDER = 5;

// 確定してから次のメールを表示するまでの空白時間(ミリ秒)
const BLANK_MS = 300;

// 練習で「正解/不正解」を表示しておく時間(ミリ秒)。この後に空白をはさんで次のメールへ
// 不正解のときは正しい答えを読めるよう長めにする
const FEEDBACK_MS_CORRECT = 1500;
const FEEDBACK_MS_WRONG = 3000;

// ===== 実験の流れ =====

// 休憩画面で「次へ」が押せるようになるまでの秒数
const REST_MIN_SECONDS = 30;

// PC チェック:この幅(px)より画面が狭いと参加できない
const MIN_SCREEN_WIDTH = 900;

// サーバーとの通信(ID・割り付け)を何回失敗したら、ブラウザ側で決めて先へ進むか
const MAX_SERVER_TRIES = 3;

// ===== 保存 =====

// 参加済みかどうかをlocalStorageで判定するためのキー
const PARTICIPATED_KEY = "mailSortExperiment_participated";

// データの送信先（GASのウェブアプリのURL）
const SAVE_URL = "https://script.google.com/macros/s/AKfycby2nGN1T1RRMSahj-s9ZLGnexZlCH6USq_hzFl9gA3jJJt_5ju9PUszHLFZmNkupyqD/exec";
