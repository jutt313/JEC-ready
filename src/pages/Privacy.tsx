import React from 'react';
import { Button } from '@/components/ui/button';

const Section: React.FC<{ titleJa: string; titleEn: string; children: React.ReactNode }> = ({ titleJa, titleEn, children }) => (
  <section className="space-y-2">
    <h2 className="text-lg font-semibold text-foreground">{titleJa}</h2>
    <h3 className="text-muted-foreground text-sm">{titleEn}</h3>
    <div className="space-y-2 leading-relaxed text-muted-foreground">
      {children}
    </div>
  </section>
);

const Privacy: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-8">
          <Button variant="outline" size="sm" onClick={() => history.back()} className="rounded-lg">← 戻る / Back</Button>
        </div>

        <header className="mb-8 space-y-1">
          <h1 className="text-3xl font-bold text-foreground">プライバシーポリシー</h1>
          <p className="text-muted-foreground">Privacy Policy</p>
          <p className="text-xs text-muted-foreground">最終更新日 / Last Updated: {new Date().toLocaleDateString()}</p>
        </header>

        <div className="prose prose-slate dark:prose-invert max-w-none text-sm">
          <div className="space-y-8">
            <Section titleJa="概要" titleEn="Overview">
              <p>
                SAAD INTERNATIONAL（以下「当社」）は、JEC プラットフォーム（以下「本サービス」）の提供にあたり、ユーザーのプライバシーを尊重し、適用法令（日本法を含む）に従い個人情報を適切に取り扱います。
              </p>
              <p>
                SAAD INTERNATIONAL ("we", "us") respects your privacy. This Privacy Policy explains how we collect, use, store, and protect information in connection with the JEC platform ("Service"). Governing law is Japan.
              </p>
            </Section>

            <Section titleJa="連絡先" titleEn="Contact">
              <p>
                お問い合わせ先: info@jec-cars.com
              </p>
              <p>
                Contact: info@jec-cars.com
              </p>
            </Section>

            <Section titleJa="収集する情報" titleEn="Information We Collect">
              <ul className="list-disc pl-6 space-y-1">
                <li>アカウント情報（氏名、メールアドレス、会社情報）/ Account info (name, email, company).</li>
                <li>アップロードされたファイル（車両書類、画像）/ Uploaded files (vehicle documents/images).</li>
                <li>OCR 結果とAI抽出データ（テキスト、ナンバープレート、VIN等）/ OCR text and AI extracted data (plate, VIN, etc.).</li>
                <li>利用ログ、IPアドレス、デバイス情報 / Usage logs, IP address, device information.</li>
              </ul>
              <p>
                ユーザーは13歳以上である必要があります。Users must be 13+.
              </p>
            </Section>

            <Section titleJa="利用目的" titleEn="How We Use Information">
              <ul className="list-disc pl-6 space-y-1">
                <li>サービス提供・運用・カスタマーサポート / To provide and operate the Service and support.</li>
                <li>車検証等のOCR・AI抽出・PDF生成 / To perform OCR, AI extraction, and PDF generation.</li>
                <li>セキュリティ、監査、法令遵守 / For security, auditing, and compliance.</li>
                <li>サービス改善・品質向上 / To improve the Service and quality.</li>
              </ul>
            </Section>

            <Section titleJa="第三者への委託" titleEn="Processors / Subprocessors">
              <p>
                当社は次のサービス提供者を利用し、データの処理・保管を行います。We use these processors:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Supabase（認証・データベース・ストレージ）/ Supabase (auth, DB, storage) — 主としてシンガポール地域。</li>
                <li>Google Vision API（OCR）/ Google Vision API (OCR)。</li>
                <li>OpenAI（データ抽出）/ OpenAI (data extraction).</li>
              </ul>
              <p>
                これらのプロバイダは各自のデータセンター（US/EU/JP など）で処理する場合があります。We may transfer to regions where providers operate.
              </p>
            </Section>

            <Section titleJa="法的根拠" titleEn="Legal Basis">
              <p>
                同意、契約の履行、正当な利益、法的義務の履行などに基づき処理します。We process data based on consent, contract performance, legitimate interests, and legal obligations.
              </p>
            </Section>

            <Section titleJa="クッキー・解析" titleEn="Cookies & Analytics">
              <p>
                動作に必要なクッキーを使用する場合があります。Optional analytics may be used to improve the Service.
              </p>
            </Section>

            <Section titleJa="保存期間" titleEn="Data Retention">
              <p>
                特定の保存期間は定めていませんが、サービス提供に必要な期間保持し、ユーザーからの適切な削除要求に応じて削除します。
              </p>
              <p>
                We retain data as necessary to provide the Service and delete upon verified request.
              </p>
            </Section>

            <Section titleJa="移転" titleEn="Transfers">
              <p>
                データはシンガポールを中心に保管され、プロバイダにより他地域で処理される場合があります。適用される保護措置に従います。
              </p>
              <p>
                Data may be stored in Singapore and processed in other regions by providers subject to appropriate safeguards.
              </p>
            </Section>

            <Section titleJa="セキュリティ" titleEn="Security">
              <p>
                当社は適切な技術的・組織的安全管理措置（暗号化、アクセス制御等）を講じていますが、絶対的な安全は保証できません。
              </p>
              <p>
                We implement encryption and access controls, but no method is 100% secure.
              </p>
            </Section>

            <Section titleJa="ユーザーの権利" titleEn="Your Rights">
              <ul className="list-disc pl-6 space-y-1">
                <li>アクセス、訂正、削除、処理の停止の要求 / Request access, correction, deletion, restriction.</li>
                <li>同意撤回 / Withdraw consent.</li>
                <li>苦情申立て / Lodge a complaint with an authority.</li>
              </ul>
              <p>
                これらの権利を行使するには info@jec-cars.com へご連絡ください。Contact us to exercise rights.
              </p>
            </Section>

            <Section titleJa="児童のプライバシー" titleEn="Children’s Privacy">
              <p>本サービスは13歳未満向けではありません。Not intended for children under 13.</p>
            </Section>

            <Section titleJa="変更" titleEn="Changes">
              <p>
                本ポリシーは随時更新される場合があります。重要な変更がある場合は、適切な方法で通知します。
              </p>
              <p>
                We may update this Policy; material changes will be notified appropriately.
              </p>
            </Section>

            <Section titleJa="お問い合わせ" titleEn="Contact">
              <p>info@jec-cars.com</p>
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;

