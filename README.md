# ガゾケン · GAZOKEN

**Image Forensics Workbench · 画像フォレンジック・ワークベンチ**

**グルー研究室 · Grou-lab**

## English

Gazoken is an image forensics project combining software development and research.
We aim to build a workbench for investigating image artefacts, processing traces,
and signs of editing or manipulation, with tools that make the evidence inspectable.

### Development

We will begin by studying, implementing, and testing methods from existing research
for detecting image artefacts and doctoring. Through controlled comparisons, we
will assess which methods produce useful results and understand their limitations.
The goal is a usable website supported by reusable Python, C, and C++ packages.

The first browser-based prototype offers JPEG error-level analysis, a noise
residual, edge strength, and bit-plane inspection. Images stay on your device.
These exploratory views do not assign a tampering probability. A separate
read-only JPEG inspector displays raw-file structures, EXIF, quantization tables,
and encoded-byte statistics without rendering pixels.

### Research

Building on those evaluations, we will explore improvements to existing methods
and develop ideas of our own. We aim to conduct reproducible experiments and
publish our findings in journals or conferences, with research material in English
and Japanese. Gazoken will present evidence and its limitations to support informed
judgments about an image.

## 日本語

Gazoken（ガゾケン）は、ソフトウェア開発と研究を両輪とする画像フォレンジックの
プロジェクトです。画像のアーティファクト、処理の痕跡、編集・改ざんの兆候を調べ、
その根拠を確認できるワークベンチの構築を目指します。

### 開発

まずは既存研究を学び、画像のアーティファクトや改ざんを検出する手法を実装・検証
することから始めます。条件を管理した比較実験を通じて、どの手法が有用な結果を
もたらすのか、またどのような限界があるのかを評価します。再利用可能な Python・C・C++
のパッケージと、それらを活用できるウェブサイトの開発を目指します。

初期のブラウザ版では、JPEG のエラーレベル解析、ノイズ残差、エッジ強度、
ビットプレーンの観察ができます。画像は外部に送信されません。これらは探索用の
可視化であり、改ざんの確率を判定するものではありません。読み取り専用の JPEG
インスペクターでは、画像を描画せずにファイル構造、EXIF、量子化テーブル、
符号化されたバイトの統計を確認できます。

### 研究

検証で得られた知見をもとに、既存手法の改良や独自のアイデアに取り組みます。
再現可能な実験を行い、学術誌や学会での成果発表を目指すとともに、英語と日本語で
研究内容を伝えていきます。画像について適切に判断できるよう、根拠となる情報と
その限界を示すことを重視します。

---

**Status / 現状:** Initial workbench implemented locally / 初期ワークベンチ実装済み（ローカル）

**Local research app / ローカル研究アプリ:** The Python-backed Phase 1 and Phase 2 framework
provides grouped step controls, image/byte/table views, and session exports.
See [setup and coverage](docs/local-workbench.md). From an installed checkout,
run `.venv/bin/gazoken` and open `http://127.0.0.1:8765/`.

- [Documentation / ドキュメント](docs/README.md)
- [Prototype methods / 試作版の手法](docs/first-workbench.md)
- [JPEG inspector / JPEG インスペクター](docs/jpeg-inspector.md)
- [Website / ウェブサイト](https://chronomicron.com/gazoken/)
- [License / ライセンス: Apache-2.0](LICENSE)
