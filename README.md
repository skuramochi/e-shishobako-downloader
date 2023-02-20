# e-私書箱ダウンローダー

e-私書箱のPDF・XMLを一括でダウンロードするためのスクリプトです。

SBI証券の電子書面交付サービスが、POSTUBからe-私書箱に移行し、[postub_downloader](https://github.com/shingo45endo/postub_downloader)
が使えなくなってしまったので、作成しました。

## 使用方法:
- e-私書箱にログインした状態で、トップページを表示。
- Chromeの開発ツールのコンソールにスクリプトを貼り付けて、下記コマンドを実行。
- await dl(from, to);   // from, to: 交付期間（開始日、終了日）をYYYYMMDDで指定

## 動作確認:
SBI証券・LINE証券、Windows10のChromeでのみ動作確認

## 問題点・TODO
- 100件以上ある場合は、交付期間を適当に分割してください。
- 複数の口座がある場合の動作は確認していません。
- ファイル名がUTF-8なので、7-Zipを使って解凍しないと文字化けする？
- UIは面倒臭いのでありません。
- エラー処理は適当です。

## License :
Apache 2.0
