# BibTeXからHTMLリストへの変換

このREADMEは、BibTeXファイルをHTML形式の出版物リストに変換するexportHTMLListFromBibtex.pyスクリプトについて説明します。生成されたHTMLは、ウェブサイト上で研究論文やその他の出版物を紹介するために利用できます。

## 概要

exportHTMLListFromBibtex.pyスクリプトは、出版物エントリーを含むBibTeXファイルを読み込み、各引用情報を処理してHTML形式のリストとして出力します。このリストは、ウェブサイトに埋め込むことで整形された文献リストを表示するのに適しています。

## 特徴

- BibTeXファイル内のエントリーを解析
- エントリーをHTMLリストの項目に変換
- カスタムの入力・出力ファイルパスを指定できるコマンドラインオプションに対応
- 様々なHTML形式のレイアウトに柔軟に対応可能

## 使用方法

```bash
python exportHTMLListFromBibtex.py <対象ディレクトリ名>
```

## 手順（ADADA事務局メモ）
1. J-Stageの対象ページ（ https://www.jstage.jst.go.jp/browse/adada/list/-char/en ）からリストを作成したい Issue のページからDownload citationでBibTeXファイルをダウンロードする。解凍したディレクトリをbibsに保存。
2. exportHTMLListFromBibtex.pyを実行して、対象ディレクトリには先ほど保存したディレクトリを指定する。
3. 出力されたHTMLファイルがoutput.htmlに保存されるので、その内容を automadのpublication List( https://adada.info/journal/publications )にコピペする。


