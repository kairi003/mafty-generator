# mafty-generator
反省を促すジェネレーター

https://kairi003.github.io/mafty-generator/


## What is this

反省を促す動画を簡単に生成できるツールです。

本ツールはWebAssemblyで実装されブラウザ上で動作するffmpegである[ffmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm)を利用しています。

ただしffmpeg.wasmの仕様で、1GB程度の空きメモリを必要とします。

メモリ不足である旨の警告が表示された場合は他のタブやアプリを閉じてから試してみてください。

またffmpeg.wasmで利用するSharedArrayBuffuerはCOOP/COEPヘッダを必要とするため、[coi-serviceworker](https://github.com/gzuidhof/coi-serviceworker)でサービスワーカーにリロードしてもらっています。

Issue, PullRequest歓迎です。

## Usage

1. 画像ファイルを選択
1. スライダーか数値入力でサイズと位置を調整
1. BBやGB等は透過色を指定してチェックで透過可能 (近似色範囲はHSV Rangeから調整)
1. Logo/Markでロゴなどを追加
1. Startを押すとエンコード開始。待ちます
1. 動画が表示されたら成功!!
1. 動画下のdownloadボタンでダウンロードできます


## Verified Mobile Devices
| Name |  OS  | Memory | Browser |
| ---- | ---- | ----   | ----    |
| Galaxy S8 | Android 9 | 4 GB | Chrome |
| iPad (9th) | iPadOS 15 | 3 GB | Chrome, Safari|
