import React from 'react';
import { Button } from '@/components/ui/button';

const Row: React.FC<{ labelJa: string; labelEn: string; children: React.ReactNode }>
  = ({ labelJa, labelEn, children }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-6 py-4 border-b">
    <div className="md:col-span-1">
      <div className="font-semibold text-foreground">{labelJa}</div>
      <div className="text-xs text-muted-foreground">{labelEn}</div>
    </div>
    <div className="md:col-span-2 leading-relaxed text-foreground">
      {children}
    </div>
  </div>
);

const LegalNotice: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-3xl mx-auto px-4 py-10">
        <header className="mb-8 text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            特定商取引法に基づく表記
          </h1>
          <p className="text-sm text-muted-foreground">Legal Notice under the Act on Specified Commercial Transactions</p>
        </header>

        <section className="rounded-xl border bg-card p-6 shadow-sm space-y-0">
          <Row labelJa="事業者名" labelEn="Company Name">
            <p>SAAD INTERNATIONAL (Brand Name: JEC)</p>
          </Row>

          <Row labelJa="代表者名" labelEn="Representative">
            <div className="space-y-1">
              <p>CHAUDHARY ABDUL JABBAR JUTT</p>
              <p>ジャット チャウダリー アブドル ジャバル</p>
            </div>
          </Row>

          <Row labelJa="所在地" labelEn="Address">
            <div className="space-y-1">
              <p>〒–</p>
              <p>愛知県名古屋市港区神宮寺一丁目1303-1 レンダイスクオーダ401</p>
              <p>AICHI-KEN NAGOYA-SHI MINATO-KU JINGUJI 1-CHOME 1303-1 RENDAI SUKUOADA 401</p>
            </div>
          </Row>

          <Row labelJa="電話番号" labelEn="Phone Number">
            <p>080-8261-8779</p>
          </Row>

          <Row labelJa="メールアドレス" labelEn="Email Address">
            <a href="mailto:info@jec-cars.com" className="underline text-primary">info@jec-cars.com</a>
          </Row>

          <Row labelJa="ウェブサイト" labelEn="Website URL">
            <a href="https://jec-car.com" className="underline text-primary" target="_blank" rel="noreferrer">https://jec-car.com</a>
          </Row>

          <Row labelJa="販売商品" labelEn="Products or Services">
            <div className="space-y-2">
              <p>Automated form service for exporting vehicles in Japan. Automatically generates required documents for car export, including:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>輸出抹消登録証明書 (Export Deregistration Certificate)</li>
                <li>登録抹消届出書 (Notification of Deregistration)</li>
                <li>輸出証明書 (Export Certificate)</li>
              </ul>
            </div>
          </Row>

          <Row labelJa="販売価格" labelEn="Pricing">
            <p>Displayed in the pricing section on the website.</p>
          </Row>

          <Row labelJa="支払方法" labelEn="Payment Methods">
            <p>All payment methods available through KOMOJU (e.g., credit cards, convenience store payments, PayPay, etc.), with monthly settlement.</p>
          </Row>

          <Row labelJa="支払時期" labelEn="Payment Timing">
            <p>Payments occur on the same calendar date each month as the customer’s start date. (Example: If service begins on the 29th, the next charge occurs on the 29th of the following month.)</p>
          </Row>

          <Row labelJa="提供時期" labelEn="Delivery of Service">
            <p>The service is available instantly after account creation and payment — within seconds.</p>
          </Row>

          <Row labelJa="返品・キャンセル" labelEn="Refund & Cancellation Policy">
            <p>No refunds after payment.</p>
          </Row>

          <Row labelJa="特記事項" labelEn="Special Notes">
            <p>None.</p>
          </Row>
        </section>

        <footer className="mt-8 flex justify-center">
          <a href="https://jec-car.com" target="_blank" rel="noreferrer">
            <Button variant="outline" className="rounded-lg">Back to Home</Button>
          </a>
        </footer>
      </main>
    </div>
  );
};

export default LegalNotice;

