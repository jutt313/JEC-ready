import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Car, FileText, Building, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toReiwaFormat } from '@/lib/japanese-date';
import { PDFDocument, TextAlignment } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

interface ExportData {
  id: string;
  request_number: string;
  plate_number?: string;
  vin?: string;
  chassis_number?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_color?: string;
  vehicle_year?: number;
  owner_name_japanese?: string;
  owner_name_english?: string;
  owner_address_japanese?: string;
  owner_address_english?: string;
  owner_phone?: string;
  export_date?: string;
  created_at: string;
  company_id: string;
}

interface CompanyData {
  name_english: string;
  name_katakana: string;
  name_kanji: string;
  address_japanese: string;
  phone?: string;
  juso_code?: string;
}

function parseJapanesePlate(plateString: string) {
  if (!plateString) return null;
  const pattern = /^(?<city>[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf\s]+?)\s+(?<class>[\dA-Z]{1,3})\s+(?<hiragana>[\u3040-\u309f])\s+(?<number>[\d\-\・\s\.]+)$/;
  const match = plateString.trim().match(pattern);

  if (!match?.groups) {
    const parts = plateString.trim().split(/\s+/);
    if (parts.length >= 4) {
      return {
        city: parts[0],
        class: parts[1],
        hiragana: parts[2],
        number: parts.slice(3).join('').replace(/[\-・\.]/g, ''),
      };
    }
    return null;
  }

  const data = match.groups;
  data.number = data.number.replace(/[\-・\.]/g, '').trim();
  return data;
}

const ExportResults = () => {
  const { exportRequestId } = useParams();
  const navigate = useNavigate();
  const [exportData, setExportData] = useState<ExportData | null>(null);
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateDoc1 = async (fontBytes: ArrayBuffer) => {
    if (!exportData || !companyData) throw new Error("Data not fully loaded.");

    const templateBytes = await fetch('/templates/1.pdf').then(res => res.arrayBuffer());
    const pdfDoc = await PDFDocument.load(templateBytes);
    pdfDoc.registerFontkit(fontkit);
    const customFont = await pdfDoc.embedFont(fontBytes);
    const form = pdfDoc.getForm();

    // Center-align license plate character fields for template 1
    const plateCenterFields1 = [
      ...Array.from({ length: 4 }, (_, i) => `number plate city ${i + 1} letter`),
      'number plate 1 number',
      'number plate 2 number',
      'number plate 3 number',
      'number plate hiragana letter',
      'number plate 4 number',
      'number plate 5 number',
      'number plate 6 number',
      'number plate 7 number',
    ];
    plateCenterFields1.forEach((name) => {
      try { form.getTextField(name).setAlignment(TextAlignment.Center); } catch {}
    });

    // Center-align JUSO code (template 1)
    const jushoCenterFields = Array.from({ length: 5 }, (_, i) => `jusho code ${i + 1}`);
    jushoCenterFields.forEach((name) => {
      try { form.getTextField(name).setAlignment(TextAlignment.Center); } catch {}
    });

    // Center-align VIN last 4 digits (template 1)
    const vinCenterFields1 = [
      'vin 4th last number',
      'vin 3rd last number',
      'vin 2nd last number',
      'vin 1st last number',
    ];
    vinCenterFields1.forEach((name) => {
      try { form.getTextField(name).setAlignment(TextAlignment.Center); } catch {}
    });

    // Field removed in template 1: 'cumpany name in katakana'
    // Keep Kanji name and address
    form.getTextField('companyy name in kanji').setText(companyData.name_kanji || '');
    form.getTextField('company address').setText(companyData.address_japanese || '');
    // Field removed in template 1: 'company phone number or personal'

    const jushoCode = companyData.juso_code || '';
    for (let i = 0; i < 5; i++) {
      form.getTextField(`jusho code ${i + 1}`).setText(jushoCode[i] || ' ');
    }

    const vin = exportData.vin || exportData.chassis_number || '';
    const vinLast4 = vin.slice(-4).padStart(4, ' ');
    form.getTextField('vin 4th last number').setText(vinLast4[0]);
    form.getTextField('vin 3rd last number').setText(vinLast4[1]);
    form.getTextField('vin 2nd last number').setText(vinLast4[2]);
    form.getTextField('vin 1st last number').setText(vinLast4[3]);

    const parsedPlate = parseJapanesePlate(exportData.plate_number || '');
    if (parsedPlate) {
      const city = parsedPlate.city || '';
      for (let i = 0; i < 4; i++) {
        form.getTextField(`number plate city ${i + 1} letter`).setText(city[i] || ' ');
      }
      const plateClass = parsedPlate.class || '';
      const hiragana = parsedPlate.hiragana || '';
      const mainNumber = parsedPlate.number || '';
      const allChars = (plateClass + hiragana + mainNumber).split('');
      const fieldNames = [
        'number plate 1 number', 'number plate 2 number', 'number plate 3 number',
        'number plate hiragana letter', 'number plate 4 number', 'number plate 5 number',
        'number plate 6 number', 'number plate 7 number',
      ];
      for (let i = 0; i < fieldNames.length; i++) {
        form.getTextField(fieldNames[i]).setText(allChars[i] || ' ');
      }
    }

    form.getFields().forEach(field => {
      try {
        form.getTextField(field.getName()).updateAppearances(customFont);
      } catch (e) { /* Ignore */ }
    });
    form.flatten();
    return pdfDoc;
  };

  const generateDoc2 = async (fontBytes: ArrayBuffer) => {
    if (!exportData || !companyData) throw new Error("Data not fully loaded.");

    const templateBytes = await fetch('/templates/2.pdf').then(res => res.arrayBuffer());
    const pdfDoc = await PDFDocument.load(templateBytes);
    pdfDoc.registerFontkit(fontkit);
    const customFont = await pdfDoc.embedFont(fontBytes);
    const form = pdfDoc.getForm();

    // Center-align license plate character fields for template 2
    const plateCenterFields2 = [
      ...Array.from({ length: 4 }, (_, i) => `number plate city ${i + 1} letter`),
      'Tnumber plate 1 number',
      'number plate 2 number',
      'number plate 3 number',
      'number plate hiragana letter',
      'number plate 4 number',
      'number plate 5 number',
      'number plate 6 number',
      'number plate 7 number',
    ];
    plateCenterFields2.forEach((name) => {
      try { form.getTextField(name).setAlignment(TextAlignment.Center); } catch {}
    });

    // Center-align VIN last 4 digits (template 2)
    const vinCenterFields2 = [
      'vin 4th last number',
      'vin 3rd last number',
      'vin 2nd last number',
      'vin ist last number',
    ];
    vinCenterFields2.forEach((name) => {
      try { form.getTextField(name).setAlignment(TextAlignment.Center); } catch {}
    });

    // Center-align Reiwa date digit fields (template 2)
    const dateCenterFields2 = [
      'whst year in japnases rewia=R',
      'year example R 07 so here is 0',
      'year example R 07 so here is 7',
      'month example 09 so 0 is here',
      'month example 09 so 9 is here',
      'day example 14 so 1 is here',
      'day example 14 so 4is here',
    ];
    dateCenterFields2.forEach((name) => {
      try { form.getTextField(name).setAlignment(TextAlignment.Center); } catch {}
    });

    // Field removed in template 2: 'cumpany name in katakana'
    // Keep Kanji name and address
    form.getTextField('companyy name in kanji').setText(companyData.name_kanji || '');
    form.getTextField('company address').setText(companyData.address_japanese || '');
    // Field removed in template 2: 'company phone number or personal'

    const vin = exportData.vin || exportData.chassis_number || '';
    const vinLast4 = vin.slice(-4).padStart(4, ' ');
    form.getTextField('vin 4th last number').setText(vinLast4[0]);
    form.getTextField('vin 3rd last number').setText(vinLast4[1]);
    form.getTextField('vin 2nd last number').setText(vinLast4[2]);
    form.getTextField('vin ist last number').setText(vinLast4[3]);

    const parsedPlate = parseJapanesePlate(exportData.plate_number || '');
    if (parsedPlate) {
      const city = parsedPlate.city || '';
      for (let i = 0; i < 4; i++) {
        form.getTextField(`number plate city ${i + 1} letter`).setText(city[i] || ' ');
      }
      const plateClass = parsedPlate.class || '';
      const hiragana = parsedPlate.hiragana || '';
      const mainNumber = parsedPlate.number || '';
      const allChars = (plateClass + hiragana + mainNumber).split('');
      const fieldNames = [
        'Tnumber plate 1 number', 'number plate 2 number', 'number plate 3 number',
        'number plate hiragana letter', 'number plate 4 number', 'number plate 5 number',
        'number plate 6 number', 'number plate 7 number',
      ];
      for (let i = 0; i < fieldNames.length; i++) {
        form.getTextField(fieldNames[i]).setText(allChars[i] || ' ');
      }
    }

    const dateToUse = exportData.export_date ? new Date(exportData.export_date) : new Date();
    const reiwaYear = dateToUse.getFullYear() - 2018;
    const yearStr = reiwaYear.toString().padStart(2, '0');
    const monthStr = (dateToUse.getMonth() + 1).toString().padStart(2, '0');
    const dayStr = dateToUse.getDate().toString().padStart(2, '0');

    form.getTextField('whst year in japnases rewia=R').setText('R');
    form.getTextField('year example R 07 so here is 0').setText(yearStr[0]);
    form.getTextField('year example R 07 so here is 7').setText(yearStr[1]);
    form.getTextField('month example 09 so 0 is here').setText(monthStr[0]);
    form.getTextField('month example 09 so 9 is here').setText(monthStr[1]);
    form.getTextField('day example 14 so 1 is here').setText(dayStr[0]);
    form.getTextField('day example 14 so 4is here').setText(dayStr[1]);

    form.getFields().forEach(field => {
      try {
        form.getTextField(field.getName()).updateAppearances(customFont);
      } catch (e) { /* Ignore */ }
    });
    form.flatten();
    return pdfDoc;
  };

  const generateDoc3 = async (fontBytes: ArrayBuffer) => {
    if (!exportData || !companyData) throw new Error("Data not fully loaded.");

    const templateBytes = await fetch('/templates/3.pdf').then(res => res.arrayBuffer());
    const pdfDoc = await PDFDocument.load(templateBytes);
    pdfDoc.registerFontkit(fontkit);
    const customFont = await pdfDoc.embedFont(fontBytes);
    const form = pdfDoc.getForm();

    form.getTextField('company name in furigana').setText(companyData.name_katakana || '');
    form.getTextField('comapnay anme in kanji').setText(companyData.name_kanji || '');
    form.getTextField('company address').setText(companyData.address_japanese || '');
    form.getTextField('phone number like (050) 5540 - 2026 or (070) 9114 -6677').setText(companyData.phone || '');

    const parsedPlate = parseJapanesePlate(exportData.plate_number || '');
    if (parsedPlate) {
      form.getTextField('number plate city formate example 品川').setText(parsedPlate.city || '');
      const fullPlate = `${parsedPlate.class || ''} ${parsedPlate.hiragana || ''} ${parsedPlate.number || ''}`.trim();
      form.getTextField('number platfr in the formate 500よ1234').setText(fullPlate);
    }

    form.getFields().forEach(field => {
      try {
        form.getTextField(field.getName()).updateAppearances(customFont);
      } catch (e) { /* Ignore */ }
    });
    form.flatten();
    return pdfDoc;
  };

  const handleGenerateMergedPdf = async () => {
    if (!exportData || !companyData) {
      alert("Cannot generate PDF: Data not fully loaded.");
      return;
    }
    setIsGenerating(true);

    try {
      const fontBytes = await fetch('/japnese font/NotoSansJP-VariableFont_wght.ttf').then(res => res.arrayBuffer());
      
      const [doc1, doc2, doc3] = await Promise.all([
        generateDoc1(fontBytes),
        generateDoc2(fontBytes),
        generateDoc3(fontBytes),
      ]);

      const mergedPdf = await PDFDocument.create();

      const doc1Pages = await mergedPdf.copyPages(doc1, doc1.getPageIndices());
      doc1Pages.forEach(page => mergedPdf.addPage(page));

      const doc2Pages = await mergedPdf.copyPages(doc2, doc2.getPageIndices());
      doc2Pages.forEach(page => mergedPdf.addPage(page));

      const doc3Pages = await mergedPdf.copyPages(doc3, doc3.getPageIndices());
      doc3Pages.forEach(page => mergedPdf.addPage(page));

      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const filename = `${exportData.vin || exportData.request_number}.pdf`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

    } catch (e) {
      console.error("Failed to generate merged PDF:", e);
      alert(`Failed to generate merged PDF: ${(e as Error).message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!exportRequestId) return;

      try {
        const { data: exportRequestData, error: exportError } = await supabase
          .from('export_requests')
          .select('*')
          .eq('id', exportRequestId)
          .single();

        if (exportError) {
          console.error('Error fetching export data:', exportError);
          return;
        }

        setExportData(exportRequestData);

        if (exportRequestData.company_id) {
          const { data: companyInfo, error: companyError } = await supabase
            .from('companies')
            .select('name_english, name_katakana, name_kanji, address_japanese, phone, juso_code')
            .eq('id', exportRequestData.company_id)
            .single();

          if (companyError) {
            console.error('Error fetching company data:', companyError);
          } else {
            setCompanyData(companyInfo);
          }
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [exportRequestId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">データを読み込み中... / Loading data...</p>
        </div>
      </div>
    );
  }

  if (!exportData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">データが見つかりません / Data not found</p>
          <Button onClick={() => navigate(-1)}>戻る / Back</Button>
        </div>
      </div>
    );
  }

  const chassisLast4 = exportData.chassis_number 
    ? exportData.chassis_number.slice(-4)
    : exportData.vin?.slice(-4) || 'N/A';

  const formatPlateNumber = (plateNumber: string) => {
    if (!plateNumber) return 'N/A';
    const match = plateNumber.match(/^(.+?)(\d{3})([あ-ゞ])(\d{4})$/);
    if (match) {
      const [, location, classification, hiragana, serial] = match;
      return `${location} ${classification} ${hiragana} ${serial}`;
    }
    return plateNumber;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-4 mb-8">
          <Button onClick={() => navigate(-1)} variant="outline" size="sm" className="rounded-lg">
            <ArrowLeft className="w-4 h-4 mr-2" />
            戻る / Back
          </Button>
          <Button onClick={handleGenerateMergedPdf} disabled={isGenerating} size="sm" className="rounded-lg">
            {isGenerating ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            すべてダウンロード / Download All
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              輸出証明書情報 / Export Certificate Information
            </h1>
            <p className="text-muted-foreground">
              Request Number: {exportData.request_number}
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="w-5 h-5 text-primary" />
                <span>会社情報 / Company Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">会社名（英語） / Company Name (English)</label>
                  <p className="text-lg font-medium">{companyData?.name_english || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">会社名（カタカナ） / Company Name (Katakana)</label>
                  <p className="text-lg font-medium">{companyData?.name_katakana || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">会社名（漢字） / Company Name (Kanji)</label>
                  <p className="text-lg font-medium">{companyData?.name_kanji || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">住所コード / Jusho Code</label>
                  <p className="text-xl font-mono text-primary bg-muted p-2 rounded border">{companyData?.juso_code || 'N/A'}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">住所 / Address</label>
                  <p className="text-lg">{companyData?.address_japanese || 'N/A'}</p>
                </div>
                {companyData?.phone && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">電話番号 / Phone</label>
                    <p className="text-lg">{companyData.phone}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Car className="w-5 h-5 text-primary" />
                <span>車両情報 / Vehicle Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ナンバープレート / License Plate</label>
                  <p className="text-xl font-bold text-primary">{formatPlateNumber(exportData.plate_number || '')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">シャシー番号（下4桁） / Chassis Number (Last 4)</label>
                  <p className="text-xl font-bold text-primary">{chassisLast4}</p>
                </div>
                {exportData.vehicle_make && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">メーカー / Make</label>
                    <p className="text-lg">{exportData.vehicle_make}</p>
                  </div>
                )}
                {exportData.vehicle_model && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">車種 / Model</label>
                    <p className="text-lg">{exportData.vehicle_model}</p>
                  </div>
                )}
                {exportData.vehicle_year && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">年式 / Year</label>
                    <p className="text-lg">{exportData.vehicle_year}</p>
                  </div>
                )}
                {exportData.vehicle_color && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">色 / Color</label>
                    <p className="text-lg">{exportData.vehicle_color}</p>
                  </div>
                )}
                {exportData.vin && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">VIN / シャシー番号</label>
                    <p className="text-sm font-mono bg-muted p-2 rounded">{exportData.vin}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-primary" />
                <span>輸出情報 / Export Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">作成日 / Created Date</label>
                  <p className="text-lg">{toReiwaFormat(new Date(exportData.created_at))}</p>
                </div>
                {exportData.export_date && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">輸出日 / Export Date</label>
                    <p className="text-lg">{toReiwaFormat(new Date(exportData.export_date))}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {(exportData.owner_name_japanese || exportData.owner_name_english) && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>所有者情報 / Owner Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  {exportData.owner_name_japanese && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">所有者名（日本語） / Owner Name (Japanese)</label>
                      <p className="text-lg">{exportData.owner_name_japanese}</p>
                    </div>
                  )}
                  {exportData.owner_name_english && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">所有者名（英語） / Owner Name (English)</label>
                      <p className="text-lg">{exportData.owner_name_english}</p>
                    </div>
                  )}
                  {exportData.owner_address_japanese && (
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-muted-foreground">住所 / Address</label>
                      <p className="text-lg">{exportData.owner_address_japanese}</p>
                    </div>
                  )}
                  {exportData.owner_phone && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">電話番号 / Phone</label>
                      <p className="text-lg">{exportData.owner_phone}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExportResults;
