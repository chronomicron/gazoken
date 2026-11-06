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

The static browser workbench in this checkout offers JPEG Phase 1 source identity,
file-structure, metadata-inventory, and quantization-atlas steps, plus JPEG error-level analysis, a
noise residual, edge strength, and bit-plane inspection. These are exploratory
views and measurements; they do not assign a tampering probability. Other catalog
steps are run in the local Python workbench or remain under development. The
separate read-only JPEG inspector displays raw-file structures, EXIF, quantization
tables, and encoded-byte statistics without rendering pixels. Images stay on your
device.

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

このチェックアウトの静的ブラウザ版では、JPEG の Phase 1 にあるソース識別、
ファイル構造、メタデータ、量子化テーブルの調査に加え、エラーレベル解析、ノイズ残差、
エッジ強度、
ビットプレーンを利用できます。
これらは探索用の可視化・計測であり、改ざんの確率を判定するものではありません。
その他のステップはローカル Python ワークベンチで実行するか、開発中です。
画像は外部に送信されません。別の読み取り専用 JPEG インスペクターでは、画像を
描画せずにファイル構造、EXIF、量子化テーブル、符号化されたバイトの統計を確認できます。

### 研究

検証で得られた知見をもとに、既存手法の改良や独自のアイデアに取り組みます。
再現可能な実験を行い、学術誌や学会での成果発表を目指すとともに、英語と日本語で
研究内容を伝えていきます。画像について適切に判断できるよう、根拠となる情報と
その限界を示すことを重視します。

---

**Status / 現状:** Initial workbench implemented locally / 初期ワークベンチ実装済み（ローカル）

**Local research app / ローカル研究アプリ:** The Python-backed three-phase framework
provides grouped step controls with collapsed-card readiness indicators,
image/byte/table views, and session exports.
Python adapters currently measure source identity,
[JPEG file structure](docs/file-structure.md),
[bounded metadata](docs/metadata-inventory.md), byte distribution, and
[exact quantization tables](docs/quantization-tables.md), plus
[Huffman codebooks and scan assignments](docs/entropy-coding.md), and
[embedded JPEG preview ranges](docs/embedded-images.md).
The [evidence report](docs/evidence-report.md) assembles current-run Phase 1 results.
An optional [stored-coefficient reader](docs/stored-coefficients.md) exposes actual
quantized DCT arrays for [frequency statistics](docs/coefficient-statistics.md); install with `.venv/bin/pip install -e ".[coefficients]"`.
See [setup and coverage](docs/local-workbench.md). From an installed checkout,
run `.venv/bin/gazoken` and open `http://127.0.0.1:8765/`.

- [Browser demo and local installation options](docs/publishing.md#browser-demo-and-full-local-app)
- [Future media roadmap: other images, audio and video](docs/roadmap.md#media-expansion-direction--accepted-2026-11-05)
- [Tool modules and contributor guide](docs/tool-development.md)
- [Documentation / ドキュメント](docs/README.md)
- [Prototype methods / 試作版の手法](docs/first-workbench.md)
- [JPEG inspector / JPEG インスペクター](docs/jpeg-inspector.md)
- [Website / ウェブサイト](https://chronomicron.com/gazoken/)
- [License / ライセンス: Apache-2.0](LICENSE)
