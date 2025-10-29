import React from 'react';
import { Button } from '@/components/ui/button';

const Block: React.FC<{ titleJa: string; titleEn: string; children: React.ReactNode }> = ({ titleJa, titleEn, children }) => (
  <section className="space-y-2">
    <h2 className="text-lg font-semibold text-foreground">{titleJa}</h2>
    <h3 className="text-muted-foreground text-sm">{titleEn}</h3>
    <div className="space-y-2 leading-relaxed text-muted-foreground">
      {children}
    </div>
  </section>
);

const Terms: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-8">
          <Button variant="outline" size="sm" onClick={() => history.back()} className="rounded-lg">← 戻る / Back</Button>
        </div>

        <header className="mb-8 space-y-1">
          <h1 className="text-3xl font-bold text-foreground">利用規約</h1>
          <p className="text-muted-foreground">Terms of Service</p>
          <p className="text-xs text-muted-foreground">最終更新日 / Last Updated: {new Date().toLocaleDateString()}</p>
        </header>

        <div className="prose prose-slate dark:prose-invert max-w-none text-sm">
          <div className="space-y-8">
            <Block titleJa="同意" titleEn="Agreement">
              <p>
                本利用規約（以下「本規約」）は、SAAD INTERNATIONAL（以下「当社」）が提供するJECプラットフォーム（以下「本サービス」）の利用条件を定めるものです。ユーザーは本サービスを利用することで、本規約に同意したものとみなされます。準拠法は日本法です。
              </p>
              <p>
                These Terms of Service ("Terms") govern your use of the JEC platform provided by SAAD INTERNATIONAL ("we"). By using the Service, you agree to these Terms. Governing law: Japan.
              </p>
            </Block>

            <Block titleJa="アカウント" titleEn="Accounts">
              <ul className="list-disc pl-6 space-y-1">
                <li>ユーザーは13歳以上であること。Users must be 13+.</li>
                <li>登録情報は正確かつ最新に保つこと。Provide accurate and up‑to‑date information.</li>
                <li>資格情報の保護はユーザーの責任。You are responsible for safeguarding credentials.</li>
              </ul>
            </Block>

            <Block titleJa="許可とライセンス" titleEn="License to Use">
              <p>
                当社は、本サービスを利用するための限定的・非独占的・譲渡不可の権利を付与します。ユーザーはアップロードしたコンテンツ（画像・書類）について、OCR、AI抽出、PDF生成の目的で当社および当社の処理業者に対して必要な範囲での利用許諾を付与します。
              </p>
              <p>
                We grant a limited, non‑exclusive, non‑transferable license to use the Service. You grant us and our processors a license to process your uploads for OCR, AI extraction, and PDF generation.
              </p>
            </Block>

            <Block titleJa="禁止事項" titleEn="Acceptable Use / Prohibited Conduct">
              <ul className="list-disc pl-6 space-y-1">
                <li>法令違反・権利侵害・不正アクセス / Illegal activity, IP infringement, unauthorized access.</li>
                <li>他者の個人情報の無断アップロード / Uploading third‑party personal data without rights.</li>
                <li>リバースエンジニアリング、スクレイピング、負荷試験 / Reverse engineering, scraping, stress testing.</li>
                <li>妨害・スパム・マルウェア配布 / Interference, spam, malware.</li>
              </ul>
            </Block>

            <Block titleJa="コンテンツの所有権" titleEn="Content Ownership">
              <p>
                ユーザーは自身のアップロードコンテンツの権利を保持します。当社は本規約及びプライバシーポリシーに基づき処理します。テンプレート、コード、UI等を含む本サービスに関する知的財産権は当社またはライセンサーに帰属します。
              </p>
              <p>
                You retain rights to your uploads. We own the platform IP (templates, code, UI) and grant no rights other than as stated.
              </p>
            </Block>

            <Block titleJa="料金と返金" titleEn="Fees and Refunds">
              <p>
                本サービスは有料で提供される場合があり、支払い後の返金は行いません（法令で要求される場合を除く）。
              </p>
              <p>
                The Service may be paid; there is no refund after payment, except where required by law.
              </p>
            </Block>

            <Block titleJa="第三者サービス" titleEn="Third‑Party Services">
              <p>
                当社は Supabase、Google Vision API、OpenAI 等を利用します。各サービスの仕様変更・制限・停止等により本サービスの機能に影響が生じる場合があります。
              </p>
              <p>
                We rely on Supabase, Google Vision API, and OpenAI. Changes or outages may impact features.
              </p>
            </Block>

            <Block titleJa="免責事項" titleEn="Disclaimers">
              <p>
                本サービス（OCR結果、AI抽出結果、PDFへの反映を含む）は現状有姿で提供され、正確性、完全性、有用性等について保証しません。ユーザーは出力結果を確認の上、自己の責任で利用するものとします。
              </p>
              <p>
                The Service and outputs (OCR/AI/PDF) are provided "as is" without warranties. You are responsible for verifying outputs.
              </p>
            </Block>

            <Block titleJa="責任制限" titleEn="Limitation of Liability">
              <p>
                当社は、直接・間接・付随的・特別・結果的損害等について、法令上許される最大限の範囲で責任を負いません。総責任は、当該請求の直近12ヶ月にユーザーが支払った金額を上限とします（無料利用の場合は1万円）。
              </p>
              <p>
                To the maximum extent permitted by law, we are not liable for any damages. Aggregate liability is limited to fees paid in the 12 months prior to the claim (or JPY 10,000 for free use).
              </p>
            </Block>

            <Block titleJa="補償" titleEn="Indemnification">
              <p>
                ユーザーは、違法なアップロード、権利侵害、規約違反等に起因する第三者請求から当社を防御・補償します。
              </p>
              <p>
                You agree to defend and indemnify us against claims arising from your unlawful uploads or violations.
              </p>
            </Block>

            <Block titleJa="終了" titleEn="Termination">
              <p>
                当社は、規約違反や不正利用などがある場合、通知の上でアカウントやアクセスを停止・終了することがあります。
              </p>
              <p>
                We may suspend or terminate access for violations or abuse.
              </p>
            </Block>

            <Block titleJa="準拠法・紛争解決" titleEn="Governing Law & Disputes">
              <p>
                本規約は日本法に準拠します。紛争は日本の裁判所の専属的管轄に服します。
              </p>
              <p>
                These Terms are governed by Japanese law; courts in Japan shall have exclusive jurisdiction.
              </p>
            </Block>

            <Block titleJa="変更" titleEn="Changes to Terms">
              <p>
                本規約は随時更新される場合があります。重要な変更時には合理的な方法により通知します。変更後も本サービスの利用を継続する場合、変更に同意したものとみなされます。
              </p>
              <p>
                We may update these Terms; continued use after notice indicates acceptance.
              </p>
            </Block>

            <Block titleJa="連絡先" titleEn="Contact">
              <p>info@jec-cars.com</p>
            </Block>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;

