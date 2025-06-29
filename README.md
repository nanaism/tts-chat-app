
# Near (ニア)

> そばにいるよ。

[![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Gemini](https://img.shields.io/badge/Gemini-8E77EE?style=for-the-badge&logo=googlebard&logoColor=white)](https://gemini.google.com/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

『Near(ニア)』は、子どもたちがAIキャラクターと自由に対話できる、スマートフォン向けのチャット＆ビデオ通話アプリケーションです。まるで友達とビデオ通話するように、嬉しかったことや悩み、他愛ない雑談まで、ニアが優しく耳を傾けます。

---

## 🚀 デモサイト (Live Demo)

**以下のURLから、実際にニアとのおはなしをお試しいただけます！**

### [➡️ Near(ニア)とおはなししてみる](https://near.aiichiro.jp/)

---

## 🖼️ スクリーンショット (Screenshot)

![image](https://github.com/user-attachments/assets/6120e80c-2076-4cdb-b65d-b15f5bd9d130)


---

## 🌟 プロジェクト概要 (About this Project)

### コンセプト

**「Near(ニア)は、子ども専用のチャット＆ビデオ通話AI。**

**自分で決めたキャラクターと、嬉しかったこと、悩みごと、雑談もぜんぶ話せます。**

**チャットでも音声でも話せるから、使い方も自由。**

**子どもの気持ちを分析して、もしも深い悩みがあったときは、親や先生に内容を伏せてそっと通知します。**

**子どもを守りたいすべての人に届けたい、新しい見守りの形です」**

このコンセプトに基づき、高品質な3Dキャラクターとの対話を通じて、子どもたちに安心感と自己表現の場を提供し、同時に保護者には新しい形の見守りを提供することを目指しています。

### プロダクトのポジショニング

| 要素 | 内容 |
| :--- | :--- |
| **❶ 課題 (Problem)** | 子どもが大人には話しにくい本音や悩みを抱え込み、周囲がそのサインに気づきにくい。 |
| **❷ ターゲット (Target)** | 話し相手が欲しい子どもたち。そして、子どもの心の健康をさりげなく見守りたい保護者や教育関係者。 |
| **❸ プロダクト (Product)** | **Near (ニア)**：対話型AIキャラクターチャットアプリ |
| **❹ 提供価値 (Value)** | 子どもに「何でも話せる友達」という安心感を提供。保護者には、子どものプライバシーを守りつつ、深刻な悩みの兆候を検知できるという新しい見守りの手段を提供。 |
| **❺ 既存代替手段 (Alternative)** | 一般的なチャットアプリ、日記、ぬいぐるみへの語りかけ。 |
| **❻ 差別化要因 (Differentiation)**| **ビデオ通話のような高品質な対話体験**。感情豊かな3Dキャラクターが音声・表情・全身の動きでリアルタイムに応答。バックエンドで子どもの心理状態を分析する「見守り」の視点。 |

---

## ✨ 主な機能 (Features)

*   **💬 リアルタイムAIチャット**
    *   ユーザーが送ったメッセージに対し、Google Gemini APIが状況に応じた自然な返答を生成します。

*   **🗣️ 感情豊かな音声合成**
    *   生成されたテキストをリアルタイムで音声に変換。感情のこもった声でニアが応答します。

*   **💃 表現力豊かな3Dキャラクター**
    *   `@pixiv/three-vrm` を活用し、会話の内容や感情に合わせて表情、まばたき、呼吸、体の動きをリアルタイムに制御。
    *   「考え中」や「嬉しい」など、状況に応じた多彩なアニメーションで生命感を演出します。

*   **📱 ビデオ通話風UI/UX**
    *   スマートフォンでの体験を重視し、通話の開始・終了ボタンを配置するなど、直感的なビデオ通話風のインターフェースを採用。

*   **👆 インタラクティブなふれあい**
    *   キャラクターの頭をタップすると、嬉しそうな反応を見せるなど、直接的なインタラクションが可能です。

*   **💖 子どもの見守り機能（コンセプト）**
    *   会話の内容を分析し、子どもが深刻な悩みを抱えている兆候が見られた場合に、保護者へそっと通知する仕組みを想定しています。

---

## 🛠️ 使用技術 (Tech Stack)

| カテゴリ | 技術・サービス |
| :--- | :--- |
| **フレームワーク** | [Next.js (App Router)](https://nextjs.org/), [TypeScript](https://www.typescriptlang.org/) |
| **3D / VRM** | [Three.js](https://threejs.org/), [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber), [@react-three/drei](https://github.com/pmndrs/drei), [@pixiv/three-vrm](https://github.com/pixiv/three-vrm) |
| **AI / TTS** | [Google Gemini API (@google/genai)](https://ai.google.dev/) |
| **UI / アニメーション** | [shadcn/ui](https://ui.shadcn.com/), [Framer Motion](https://www.framer.com/motion/), [Tailwind CSS](https://tailwindcss.com/) |
| **インフラ** | [Vercel](https://vercel.com/) |

---

## 📖 ユーザーストーリー (User Stories)

1.  **セッションの開始**: ユーザーはウェルカム画面で「はじめる」をタップし、ニアとの"通話"を開始する。
2.  **初回挨拶**: もし会話履歴がなければ、ニアが笑顔でランダムな挨拶を投げかけ、会話のきっかけを作る。
3.  **メッセージの送信**: ユーザーが入力欄にメッセージを書き込み、送信ボタンをタップする。
4.  **ニアの応答**: ニアは「考え中」の仕草を見せた後、音声と、内容に合った表情・ジェスチャーで応答する。吹き出しにもメッセージが表示される。
5.  **キャラクターとの触れ合い**: 会話の合間にニアの頭をタップすると、嬉しそうに反応し、パーティクルエフェクトが表示される。
6.  **会話履歴の確認**: ユーザーは履歴ボタンをタップして、過去のやり取りをスクロールして確認できる。
7.  **セッションの終了**: ユーザーが通話終了ボタンをタップすると、ニアが「またね！」とランダムな挨拶を返し、アプリはウェルカム画面に戻る。
