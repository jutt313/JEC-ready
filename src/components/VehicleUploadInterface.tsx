import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CheckCircle, AlertCircle, Loader2, Upload, FileText, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import JapaneseDatePicker from '@/components/JapaneseDatePicker';
import { PDFDocument, TextAlignment } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
// Helper: wrap text into multiple lines to fit PDF fields better
const wrapText = (text: string, maxPerLine: number, maxLines: number) => {
  if (!text) return '';
  const t = text.replace(/\s+/g, ' ').trim();
  const words = t.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const w of words) {
    if ((current + (current ? ' ' : '') + w).length <= maxPerLine) {
      current = current ? current + ' ' + w : w;
    } else {
      if (current) lines.push(current);
      current = w;
      if (lines.length >= maxLines - 1) break;
    }
  }
  if (lines.length < maxLines && current) lines.push(current);
  const consumed = lines.join(' ').length;
  if (consumed < t.length && lines.length) {
    const rest = t.slice(consumed).trim();
    if (rest) {
      lines[lines.length - 1] = (lines[lines.length - 1] + ' ' + rest).trim();
    }
  }
  return lines.join('\n');
};
// PDF.js for converting first PDF page to image for OCR (Vite-friendly ESM imports)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface UploadedFile {
  file: File;
  id: string;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  progress: number;
  exportRequestId?: string;
  extractedData?: {
    plateNumber: string | null;
    vin: string | null;
  };
  error?: string;
  selectedExportDate?: Date;
}

// Data interfaces moved from ExportResults
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

interface VehicleUploadInterfaceProps {
  companyId: string;
}

// Helper function moved from ExportResults
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

const VehicleUploadInterface: React.FC<VehicleUploadInterfaceProps> = ({ companyId }) => {
  const navigate = useNavigate();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [globalExportDate, setGlobalExportDate] = useState<Date | undefined>(undefined);
  const [useGlobalDate, setUseGlobalDate] = useState(true);
  const [isDownloading, setIsDownloading] = useState(new Set<string>());

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      status: 'uploading',
      progress: 0
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    const processingPromises = newFiles.map(uploadedFile =>
      processFile(uploadedFile).catch(error => {
        console.error(`Error processing file ${uploadedFile.file.name}:`, error);
        updateFileStatus(uploadedFile.id, 'failed', 0, undefined, { error: error.message });
      })
    );

    await Promise.all(processingPromises);
  }, [companyId]);

  // PDF Generation Logic
  const generateDoc1 = async (fontBytes: ArrayBuffer, exportData: ExportData, companyData: CompanyData) => {
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
    form.getTextField('companyy name in kanji').setText(wrapText(companyData.name_kanji || '', 14, 2));
    form.getTextField('company address').setText(wrapText(companyData.address_japanese || '', 21, 3));
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

  const generateDoc2 = async (fontBytes: ArrayBuffer, exportData: ExportData, companyData: CompanyData) => {
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
    form.getTextField('companyy name in kanji').setText(wrapText(companyData.name_kanji || '', 14, 2));
    form.getTextField('company address').setText(wrapText(companyData.address_japanese || '', 21, 3));
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

  const generateDoc3 = async (fontBytes: ArrayBuffer, exportData: ExportData, companyData: CompanyData) => {
    const templateBytes = await fetch('/templates/3.pdf').then(res => res.arrayBuffer());
    const pdfDoc = await PDFDocument.load(templateBytes);
    pdfDoc.registerFontkit(fontkit);
    const customFont = await pdfDoc.embedFont(fontBytes);
    const form = pdfDoc.getForm();

    form.getTextField('company name in furigana').setText(wrapText(companyData.name_katakana || '', 14, 2));
    form.getTextField('comapnay anme in kanji').setText(wrapText(companyData.name_kanji || '', 14, 2));
    form.getTextField('company address').setText(wrapText(companyData.address_japanese || '', 21, 3));
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

  const handleDownloadSinglePdf = async (file: UploadedFile) => {
    if (!file.exportRequestId) {
      toast({ title: "Error", description: "Export request ID not found.", variant: "destructive" });
      return;
    }

    setIsDownloading(prev => new Set(prev).add(file.id));

    try {
      // 1. Fetch data for this specific file
      const { data: exportData, error: exportError } = await supabase
        .from('export_requests')
        .select('*')
        .eq('id', file.exportRequestId)
        .single();

      if (exportError) throw new Error(`Failed to fetch export data: ${exportError.message}`);

      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('name_english, name_katakana, name_kanji, address_japanese, phone, juso_code')
        .eq('id', exportData.company_id)
        .single();

      if (companyError) throw new Error(`Failed to fetch company data: ${companyError.message}`);

      // 2. Generate merged PDF
      const fontBytes = await fetch('/japnese font/NotoSansJP-VariableFont_wght.ttf').then(res => res.arrayBuffer());
      
      const [doc1, doc2, doc3] = await Promise.all([
        generateDoc1(fontBytes, exportData, companyData),
        generateDoc2(fontBytes, exportData, companyData),
        generateDoc3(fontBytes, exportData, companyData),
      ]);

      const mergedPdf = await PDFDocument.create();
      
      const [doc1Page] = await mergedPdf.copyPages(doc1, [0]);
      mergedPdf.addPage(doc1Page);
      const [doc2Page] = await mergedPdf.copyPages(doc2, [0]);
      mergedPdf.addPage(doc2Page);
      const [doc3Page] = await mergedPdf.copyPages(doc3, [0]);
      mergedPdf.addPage(doc3Page);

      const pdfBytes = await mergedPdf.save();

      // 3. Trigger download
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${exportData.vin || exportData.request_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

    } catch (e) {
      console.error("Failed to generate PDF:", e);
      toast({ title: "PDF Generation Failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setIsDownloading(prev => {
        const newSet = new Set(prev);
        newSet.delete(file.id);
        return newSet;
      });
    }
  };

  const updateFileStatus = (
    fileId: string, 
    status: UploadedFile['status'], 
    progress: number,
    exportRequestId?: string,
    updates?: Partial<UploadedFile>
  ) => {
    setUploadedFiles(prev => prev.map(file => 
      file.id === fileId 
        ? { ...file, status, progress, exportRequestId, ...updates }
        : file
    ));
  };

  const processFile = async (uploadedFile: UploadedFile) => {
    console.log(`Starting processing for: ${uploadedFile.file.name}`);
    
    try {
      // Step 1: Create export request
      console.log(`Step 1: Creating export request...`);
      updateFileStatus(uploadedFile.id, 'uploading', 20);
      
      const { data: exportRequest, error: createError } = await supabase
        .from('export_requests')
        .insert({
          company_id: companyId,
          status: 'pending',
          request_number: `JEC-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
        })
        .select()
        .single();

      if (createError) {
        console.error(`Failed to create export request:`, createError);
        throw new Error(`Failed to create export request: ${createError.message}`);
      }

      console.log(`Export request created with ID: ${exportRequest.id}`);
      updateFileStatus(uploadedFile.id, 'uploading', 40, exportRequest.id);

      // Step 2: Upload file to storage
      console.log(`Step 2: Uploading file to storage...`);
      const fileName = `${companyId}/${exportRequest.id}/${uploadedFile.file.name}`;
      console.log(`Storage path: ${fileName}`);
      
      const { error: uploadError } = await supabase.storage
        .from('vehicle-documents')
        .upload(fileName, uploadedFile.file);

      if (uploadError) {
        console.error(`Failed to upload file:`, uploadError);
        throw new Error(`Failed to upload file: ${uploadError.message}`);
      }

      console.log(`File uploaded successfully to storage`);

      // Step 3: Update export request with image URL
      console.log(`Step 3: Updating database with image URL...`);
      const { data: urlData } = supabase.storage
        .from('vehicle-documents')
        .getPublicUrl(fileName);

      console.log(`Public URL generated: ${urlData.publicUrl}`);

      const { error: updateError } = await supabase
        .from('export_requests')
        .update({
          original_image_url: urlData.publicUrl,
          status: 'processing'
        })
        .eq('id', exportRequest.id);

      if (updateError) {
        console.error(`Failed to update export request:`, updateError);
        throw new Error(`Failed to update export request: ${updateError.message}`);
      }

      console.log(`Database updated with image URL`);
      updateFileStatus(uploadedFile.id, 'processing', 60);

      // Step 4: Convert file to base64 for OCR
      console.log(`Step 4: Converting file to base64...`);
      let base64Data = '';
      if (uploadedFile.file.type === 'application/pdf') {
        // Verify magic header to ensure it's a real PDF; some files may be images mislabeled as PDF
        const header = new Uint8Array(await uploadedFile.file.slice(0, 5).arrayBuffer());
        const isRealPdf = header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 && header[3] === 0x46 && header[4] === 0x2D; // %PDF-

        if (isRealPdf) {
          console.log('Detected real PDF. Rendering first page to image for OCR...');
          try {
            base64Data = await pdfFirstPageToPngBase64(uploadedFile.file);
            console.log(`PDF first page rendered to image. Base64 length: ${base64Data.length} characters`);
          } catch (e) {
            console.error('Failed to render PDF to image:', e);
            throw new Error('Failed to process PDF for OCR. Please ensure the PDF is not encrypted or corrupted.');
          }
        } else {
          console.warn('File has .pdf extension but is not a valid PDF. Treating as image for OCR.');
          base64Data = await fileToBase64(uploadedFile.file);
          console.log(`Base64 conversion complete (non-PDF masquerade), length: ${base64Data.length} characters`);
        }
      } else {
        base64Data = await fileToBase64(uploadedFile.file);
        console.log(`Base64 conversion complete, length: ${base64Data.length} characters`);
      }

      // Step 5: Call Google Vision OCR (with client-side retries if kana missing)
      console.log(`Step 5: Calling Google Vision OCR...`);
      const hasPlatePattern = (t: string) => {
        const normalize = (s: string) =>
          s
            .replace(/[０-９]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0xFF10 + 0x30))
            .replace(/[・・‐‑‒–—―ー・\.\-]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .toUpperCase();
        const lineRe = /([\u4e00-\u9faf\u3040-\u309f\u30a0-\u30ff]+)\s+([0-9A-Z]{1,4})\s+([\u3040-\u309F])\s+([0-9]{1,4})/u;
        return t.split(/\r?\n/).some((raw) => lineRe.test(normalize(raw)));
      };

      let ocrText = '';
      let attempts = 0;
      let lastOcrError: any = null;
      while (attempts < 3) {
        attempts++;
        console.log(`OCR attempt ${attempts}...`);
        const ocrResponse = await supabase.functions.invoke('google-vision-ocr', {
          body: {
            imageBase64: base64Data,
            exportRequestId: exportRequest.id
          }
        });
        console.log(`OCR Response:`, ocrResponse);
        if (ocrResponse.error) {
          lastOcrError = ocrResponse.error;
          console.error(`OCR failed (attempt ${attempts}):`, ocrResponse.error);
          // Stop retrying if server returned non-2xx (e.g., 400/422)
          break;
        } else {
          ocrText = ocrResponse.data?.extractedText || '';
          console.log(`OCR completed, extracted text length: ${ocrText.length}`);
          if (ocrText) console.log('OCR Full Text:\n', ocrText);
          if (hasPlatePattern(ocrText)) {
            console.log('Kana plate pattern detected on client. Proceeding.');
            break;
          } else {
            console.warn('Kana plate pattern not detected on client. Retrying OCR if attempts remain...');
          }
        }
        if (attempts < 3) await new Promise((r) => setTimeout(r, 400));
      }

      if (lastOcrError) {
        const msg = lastOcrError.message || 'OCR failed.';
        updateFileStatus(uploadedFile.id, 'failed', 0, undefined, { error: msg });
        toast({ title: 'OCR Failed', description: msg, variant: 'destructive' });
        return;
      }

      if (!ocrText || !hasPlatePattern(ocrText)) {
        updateFileStatus(uploadedFile.id, 'failed', 0, undefined, { error: 'Plate kana not detected. Please upload a clearer image.' });
        toast({ title: 'OCR Failed', description: 'License plate kana not detected. Please upload a clearer image.', variant: 'destructive' });
        return;
      }

      updateFileStatus(uploadedFile.id, 'processing', 80);

      // Step 6: Call AI extraction
      console.log(`Step 6: Calling AI extraction...`);
      const extractionResponse = await supabase.functions.invoke('extract-vehicle-data', {
        body: {
          ocrText: ocrText,
          exportRequestId: exportRequest.id
        }
      });

      console.log(`AI Extraction Response:`, extractionResponse);

      if (extractionResponse.error) {
        console.error(`AI extraction failed:`, extractionResponse.error);
        throw new Error(`AI extraction failed: ${extractionResponse.error.message}`);
      }

      // Handle structured 200 error from function
      if (extractionResponse.data && extractionResponse.data.success === false) {
        const msg = extractionResponse.data.error || 'AI extraction failed.';
        console.error('AI extraction reported failure:', msg);
        updateFileStatus(uploadedFile.id, 'failed', 0, undefined, { error: msg });
        toast({ title: 'AI Extraction Failed', description: msg, variant: 'destructive' });
        return;
      }

      console.log(`AI extraction completed successfully!`);
      console.log(`Final extracted data:`, extractionResponse.data.extractedData);

      // Data extraction completed successfully!
      updateFileStatus(
        uploadedFile.id, 
        'completed', 
        100, 
        exportRequest.id,
        { extractedData: extractionResponse.data.extractedData }
      );

      console.log(`Processing completed successfully for: ${uploadedFile.file.name}`);
      toast({
        title: "処理完了 / Processing Complete",
        description: `${uploadedFile.file.name} の処理が完了しました / Processing completed for ${uploadedFile.file.name}`,
      });

    } catch (error) {
      console.error(`Error in processFile for ${uploadedFile.file.name}:`, error);
      updateFileStatus(uploadedFile.id, 'failed', 0, undefined, { error: error.message });
      toast({
        title: "エラー / Error",
        description: `${uploadedFile.file.name} の処理中にエラーが発生しました / Error processing ${uploadedFile.file.name}`,
        variant: "destructive"
      });
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    console.log(`Converting file to base64: ${file.name} (${file.size} bytes)`);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        console.log(`Conversion complete, base64 length: ${base64.length} characters`);
        resolve(base64);
      };
      reader.onerror = error => {
        console.error(`Conversion failed:`, error);
        reject(error);
      };
    });
  };

  // Convert first page of a PDF to PNG base64 (without data URL prefix)
  const pdfFirstPageToPngBase64 = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: ctx as CanvasRenderingContext2D, viewport }).promise;
    // Use JPEG to improve Vision compatibility and reduce payload size
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    return dataUrl.split(',')[1];
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'],
      'application/pdf': ['.pdf']
    },
    multiple: true
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'processing':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <Upload className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '処理完了 / Completed';
      case 'failed':
        return '処理失敗 / Failed';
      case 'processing':
        return '処理中 / Processing';
      default:
        return '待機中 / Waiting';
    }
  };

  const updateFileExportDate = (fileId: string, date: Date | undefined) => {
    setUploadedFiles(prev => prev.map(file => 
      file.id === fileId 
        ? { ...file, selectedExportDate: date }
        : file
    ));
  };

  const handleDownloadAllPdfs = async () => {
    const completedFiles = uploadedFiles.filter(file => file.status === 'completed');
    
    if (completedFiles.length === 0) {
      toast({ title: "Error", description: "No completed files to download.", variant: "destructive" });
      return;
    }

    const hasValidDates = completedFiles.every(file => (useGlobalDate ? globalExportDate : file.selectedExportDate) !== undefined);
    if (!hasValidDates) {
      toast({ title: "Error", description: "Please select an export date for all completed files.", variant: "destructive" });
      return;
    }

    toast({ title: "Bulk Download Started", description: `Preparing to download ${completedFiles.length} PDFs.` });

    for (const file of completedFiles) {
      const selectedDate = useGlobalDate ? globalExportDate : file.selectedExportDate;
      if (file.exportRequestId && selectedDate) {
        try {
          // First, update the export_date in the database
          await supabase
            .from('export_requests')
            .update({ export_date: selectedDate.toISOString().split('T')[0] })
            .eq('id', file.exportRequestId);
          
          // Now, trigger the download for this file
          await handleDownloadSinglePdf(file);

          // Optional: add a small delay to prevent browser blocking
          await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
          toast({ title: `Download Failed for ${file.file.name}`, description: (error as Error).message, variant: "destructive" });
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card className="shadow-lg border-0 bg-card/95 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl">
            車検証アップロード / Upload Vehicle Inspection Certificates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${
              isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">
              {isDragActive 
                ? 'ファイルをドロップしてください / Drop files here'
                : '車検証をドラッグ＆ドロップまたはクリック / Drag & drop or click to upload'
              }
            </h3>
            <p className="text-sm text-muted-foreground">
              複数のファイルを同時にアップロード可能 / Multiple files can be uploaded simultaneously
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              対応形式: PNG, JPG, JPEG, GIF, BMP, WEBP, PDF / Supported: PNG, JPG, JPEG, GIF, BMP, WEBP, PDF
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Export Date and PDF Generation */}
      {uploadedFiles.some(file => file.status === 'completed') && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">
              輸出日設定 / Export Date Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4 mb-4">
              <Button
                variant={useGlobalDate ? "default" : "outline"}
                size="sm"
                onClick={() => setUseGlobalDate(true)}
              >
                全体設定 / Global Date
              </Button>
              <Button
                variant={!useGlobalDate ? "default" : "outline"}
                size="sm"
                onClick={() => setUseGlobalDate(false)}
              >
                個別設定 / Individual Dates
              </Button>
            </div>

            {useGlobalDate && (
              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium text-foreground">
                  輸出予定日 / Planned Export Date
                </label>
                <JapaneseDatePicker
                  value={globalExportDate}
                  onChange={setGlobalExportDate}
                  placeholder="輸出日を選択 / Select export date"
                />
              </div>
            )}
            
            <div className="flex justify-end items-center space-x-4">
              <Button 
                onClick={handleDownloadAllPdfs}
                className="bg-primary hover:bg-primary/90"
                disabled={
                  isDownloading.size > 0 ||
                  !uploadedFiles.some(f => f.status === 'completed') ||
                  (useGlobalDate 
                    ? !globalExportDate 
                    : uploadedFiles.filter(f => f.status === 'completed').some(f => !f.selectedExportDate))
                }
              >
                {isDownloading.size > 0 ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                証明書をすべてダウンロード / Download All Certificates
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing Results */}
      {uploadedFiles.length > 0 && (
        <Card className="shadow-lg border-0 bg-card/95 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl">
              処理結果 / Processing Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(file.status)}
                    <div>
                      <p className="font-medium">{file.file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {getStatusText(file.status)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    {(file.file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>

                {file.status === 'processing' && (
                  <Progress value={file.progress} className="w-full" />
                )}

                {file.error && (
                  <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    エラー / Error: {file.error}
                  </div>
                )}

                {file.extractedData && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-green-800 mb-2">
                          抽出されたデータ / Extracted Data
                        </h4>
                        <div className="space-y-1 text-sm">
                          <p>
                            <span className="font-medium">ナンバープレート / License Plate:</span>{' '}
                            {file.extractedData.plateNumber || 'N/A'}
                          </p>
                          <p>
                            <span className="font-medium">車台番号 / Chassis Number:</span>{' '}
                            {file.extractedData.vin || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <Button 
                        size="sm"
                        onClick={() => handleDownloadSinglePdf(file)}
                        disabled={isDownloading.has(file.id)}
                      >
                        {isDownloading.has(file.id) ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4 mr-2" />
                        )}
                        PDFをダウンロード
                      </Button>
                    </div>

                    {/* Individual Date Picker */}
                    {!useGlobalDate && (
                      <div className="mt-4">
                        <label className="text-sm font-medium text-foreground mb-2 block">
                          輸出予定日 / Export Date
                        </label>
                        <JapaneseDatePicker
                          value={file.selectedExportDate}
                          onChange={(date) => updateFileExportDate(file.id, date)}
                          placeholder="輸出日を選択 / Select export date"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VehicleUploadInterface;
