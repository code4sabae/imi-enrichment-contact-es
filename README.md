# imi-enrichment-contact ES

入力となる JSON-LD に含まれる `電話番号 をもつ 連絡先型` に対して正規化を行うESモジュールです。

[![esmodules](https://taisukef.github.com/denolib/esmodulesbadge.svg)](https://developer.mozilla.org/ja/docs/Web/JavaScript/Guide/Modules)
[![deno](https://taisukef.github.com/denolib/denobadge.svg)](https://deno.land/)

# 利用者向け情報

```
<script type="module">
import IMIEnrichmentContact from "https://code4sabae.github.io/imi-enrichment-contact-es/IMIEnrichmentContact.mjs";
console.log(IMIEnrichmentContact("0398765432(代表)"));
</script>
```

`IMIEnrichmentContact` に String あるいは JSON を渡すことで、変換結果を取得できます。

- 入力 (input) : 変換対象となる JSON または電話番号文字列
- 出力 : 変換結果の JSON-LD オブジェクト ※ 変換は同期で行うため Promise でないことに注意

**input.json**

```input.json
{
  "@type": "連絡先型",
  "電話番号": "０３－５２５３－２１１１（内線３１４２７）"
}
```

**output.json**

```output.json
{
  "@type": "連絡先型",
  "電話番号": "(03)5253-2111",
  "内線番号": "内線３１４２７"
}
```

- ルート直下の `連絡先型` に限らず、JSON-LD に含まれるすべての `連絡先型` に対して作用します
- `電話番号` プロパティの値が `0-9 の数字及び + - ( ) ,` になるような文字種正規化を行い、値を更新します
- `電話番号` プロパティの電話番号部分が後述のパターンに合致する場合には、番号がカッコ／ハイフンを用いてフォーマットされます
- `電話番号` プロパティの電話番号部分の後にカッコつきの追加情報がある場合には `内線番号` プロパティの付与を行います
- `電話番号` プロパティの正規化ができなかった場合には `メタデータ` プロパティにメッセージが記述されます

**output_with_error.json**

```output_with_error.json
{
  "@context": "https://imi.go.jp/ns/core/context.jsonld",
  "@type": "連絡先型",
  "電話番号": "0312345678",
  "メタデータ": {
    "@type": "文書型",
    "説明": "市外局番に続く番号は 2-9 で始まる番号でなければなりません"
  }
}
```

以下のエラーが検出されます

- 電話番号でない場合
- 1 で始まる緊急用電話番号
- 00 で始まる中継用電話番号
- 2～9 で始まる市内通話用電話番号
- 市外局番に続く番号が 2～9 でない不正な電話番号
- 該当する市外局番が存在しない不正な電話番号


## 電話番号のフォーマット

電話番号の区切り（ハイフンやカッコの挿入位置）については特に標準はありませんが、
[総務省:電気通信番号指定状況](https://www.soumu.go.jp/main_sosiki/joho_tsusin/top/tel_number/number_shitei.html) および
ここからリンクされる PDF では国内で使用される各種の電話番号について以下のような区切りが提示されています。

> 携帯電話・ＰＨＳ番号（０７０－ＣＤＥ－ＦＧＨＪＫ）
> 携帯電話・ＰＨＳ番号（０８０－ＣＤＥ－ＦＧＨＪＫ）
> 携帯電話・ＰＨＳ番号（０９０－ＣＤＥ－ＦＧＨＪＫ）
> Ｍ２Ｍ等専用番号（０２０－ＣＤＥ－ＦＧＨＪＫ）
> 発信者課金ポケベル電話番号（０２０－４ＤＥ－ＦＧＨＪＫ）
> ＦＭＣ用電話番号（０６００－ＤＥＦ－××××）
> ＩＰ電話の番号（０５０－ＣＤＥＦ－××××）
> 着信課金用電話番号（０１２０－ＤＥＦ－×××）
> 着信課金用電話番号（０８００－ＤＥＦ－××××）
> 情報料代理徴収機能用電話番号（０９９０－ＤＥＦ－×××）
> 統一番号（０５７０－ＤＥF－×××）

本ライブラリはこれらに該当する電話番号についてはこの区切りに従って電話番号のフォーマットを行います。

また、固定電話番号については市外局番の桁数に応じて以下のいずれかの書式でフォーマットするものとします。

```
(0A)BCDE-FGHI
(0AB)CDE-FGHI
(0ABC)DE-FGHI
(0ABCD)E-FGHI
```

日本国内で使用される市外局番は
[総務省:市外局番の一覧](https://www.soumu.go.jp/main_sosiki/joho_tsusin/top/tel_number/shigai_list.html) で公表されており、
本ライブラリはこの市外局番データ(令和元年５月２２日現在版) を加工して `lib/areacode.json` として保持しています。
与えられた電話番号が固定電話番号相当であると判定された場合には
さらに市外局番データとの照合を行ってフォーマットまたはエラー検出（存在しない市外局番）を行います。


# 開発者向け情報

## 環境構築

以下の手順で環境を構築します。

```
$ github clone https://github.com/code4sabae/imi-enrichment-contact.git
```

## コマンドラインインターフェイス

コマンドラインインターフェイスが同梱されています。
ファイルの実体は `bin/cli.mjs` です。

```
$ cd bin

# ヘルプの表示
$ deno run cli.mjs -h

# JSON ファイルの変換
$ deno run -A cli.mjs input.json > output.json

# 標準入力からの変換
$ cat input.json | deno run cli.mjs > output.json

# 文字列からの変換
$ deno run cli.mjs -s 0398765432 > output.json

```

## Web API

Web API を提供するサーバプログラムが同梱されています。

### サーバの起動方法

`bin/server.mjs` がサーバの実体です。
以下のように `bin/server.mjs` を実行することで起動できます。

```
$ deno run -A bin/server.mjs
Usage: deno run -A bin/server.mjs [port number]

$ deno run -A bin/server.mjs 8080
imi-enrichment-contact-server is running on port 8080
```

なお、実行時にはポート番号の指定が必要です。指定しなかった場合にはエラーが表示されて終了します。
サーバを停止するには `Ctrl-C` を入力してください。

### 利用方法

WebAPI は POST された JSON または テキストを入力として JSON を返します。

```
$ curl -X POST -H 'Content-Type: application/json' -d '{"@type":"連絡先型","電話番号":"0398765432(代表)"}' localhost:8080
{
  "@type": "連絡先型",
  "電話番号": "(03)9876-5432",
  "内線番号": "代表"
}
```

```
$ curl -X POST -H 'Content-Type: text/plain' -d '0398765432(代表)' localhost:8080
{
  "@context": "https://imi.go.jp/ns/core/context.jsonld",
  "@type": "連絡先型",
  "電話番号": "(03)9876-5432",
  "内線番号": "代表"
}
```

- WebAPI の URL に GET メソッドでアクセスした場合には HTML ページが表示され、WebAPI の動作を確認することができます
- POST,GET 以外のメソッドでアクセスした場合には `405 Method Not Allowed` エラーが返されます
- `Content-Type: application/json` ヘッダが設定されている場合は、POST Body を JSON として扱い、JSON に対しての変換結果を返します
- `Content-Type: application/json` ヘッダが設定されているが POST Body が JSON としてパースできない場合は `400 Bad Request` エラーが返されます
- `Content-Type: application/json` ヘッダが設定されていない場合は、POST Body を電話番号文字列として扱い、電話番号文字列を連絡先型に整形・正規化した結果を返します


## テスト

以下の手順でテストを実行します（cli / serverのテストは未対応）

```
$ deno test -A
```

## 依存関係

なし

## 出典

本ライブラリは IMI 情報共有基盤 コンポーネントツール <https://info.gbiz.go.jp/tools/imi_tools/> の「電話番号正規化パッケージ一式」をESモジュール対応したものです。

## 関連記事

Deno対応ESモジュール対応、IMIコンポーネントツールx4とDenoバッジ  
https://fukuno.jig.jp/2866  

日本政府発のJavaScriptライブラリを勝手にweb標準化するプロジェクト、全角-半角統一コンポーネントのESモジュール/Deno対応版公開  
https://fukuno.jig.jp/2865  
