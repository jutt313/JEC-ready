import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GOOGLE_VISION_API_KEY = Deno.env.get('GOOGLE_VISION_API_KEY');
    if (!GOOGLE_VISION_API_KEY) {
      throw new Error('GOOGLE_VISION_API_KEY is not set');
    }

    const { imageBase64, exportRequestId } = await req.json();

    console.log(`🚀 [OCR] Starting OCR processing for export request: ${exportRequestId}`);
    console.log(`📊 [OCR] Image data length: ${imageBase64?.length || 0} characters`);

    if (!imageBase64 || !exportRequestId) {
      console.error('❌ [OCR] Missing required parameters:', { 
        hasImageBase64: !!imageBase64, 
        hasExportRequestId: !!exportRequestId 
      });
      return new Response(
        JSON.stringify({ error: 'Missing imageBase64 or exportRequestId' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`🔍 [OCR] Calling Google Vision API...`);

    // Helpers
    const hasHiragana = (t: string) => /[\u3040-\u309F]/u.test(t);
    // Strict: evaluate per-line so we don't match across unrelated lines
    const hasPlatePattern = (t: string) => {
      const lineRe = /^(?:[\u4e00-\u9faf\u3040-\u309f\u30a0-\u30ff]+)\s+[0-9A-Z]{1,4}\s+[\u3040-\u309F]\s+\d{1,4}$/u;
      return t
        .split(/\r?\n/)
        .map((l) => l.trim().replace(/\s+/g, ' '))
        .some((line) => lineRe.test(line));
    };
    async function runOCR(featureType: 'TEXT_DETECTION' | 'DOCUMENT_TEXT_DETECTION') {
      const resp = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requests: [
              {
                image: { content: imageBase64 },
                features: [ { type: featureType, maxResults: 1 } ],
                imageContext: { languageHints: ['ja', 'ja-Hira', 'ja-Jpan'] }
              }
            ]
          })
        }
      );
      return resp;
    }

    // Up to 3 attempts: 1) TEXT, 2) DOCUMENT, 3) DOCUMENT again
    let attempts = 0;
    let extractedText = '';
    let bestText = '';
    const tryOrder: ('TEXT_DETECTION'|'DOCUMENT_TEXT_DETECTION')[] = ['TEXT_DETECTION','DOCUMENT_TEXT_DETECTION','DOCUMENT_TEXT_DETECTION'];

    for (const feature of tryOrder) {
      attempts++;
      console.log(`📡 [OCR] Attempt ${attempts} with ${feature}...`);
      const resp = await runOCR(feature);
      console.log(`📡 [OCR] Attempt ${attempts} status: ${resp.status}`);
      if (!resp.ok) {
        const txt = await resp.text();
        console.warn(`⚠️ [OCR] Attempt ${attempts} failed:`, txt);
        continue;
      }
      const data = await resp.json();
      console.log(`📄 [OCR] Attempt ${attempts} response:`, JSON.stringify(data, null, 2));
      extractedText = data.responses?.[0]?.fullTextAnnotation?.text || '';
      console.log(`📝 [OCR] Attempt ${attempts} text length: ${extractedText.length}`);
      console.log('📝 [OCR] Attempt text:\n', extractedText);

      // Track best by presence of strict plate match + hiragana + length
      const score = (txt: string) => (hasPlatePattern(txt) ? 3 : 0) + (hasHiragana(txt) ? 1 : 0) + Math.min(txt.length / 1000, 1);
      const currentScore = score(extractedText);
      const bestScore = score(bestText);
      if (currentScore > bestScore) bestText = extractedText;

      if (hasPlatePattern(extractedText)) {
        console.log('✅ [OCR] Plate pattern detected. Stopping retries.');
        break;
      }
    }

    // Choose best text if current didn't match
    if (!hasPlatePattern(extractedText)) {
      extractedText = bestText;
    }
    
    if (!extractedText) {
      console.log('⚠️ [OCR] No text extracted from image');
      return new Response(
        JSON.stringify({ error: 'No text found in image' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // If after retries we still don't have a recognizable plate, ask for clearer image
    const plateRegex = /[\u4e00-\u9faf\u3040-\u309f\u30a0-\u30ff]+\s+[0-9A-Z]{1,4}\s+[\u3040-\u309F]\s+\d{1,4}/;
    const plateOk = plateRegex.test(extractedText);

    // Initialize Supabase client
    console.log(`💾 [OCR] Updating database with OCR results...`);
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (!plateOk) {
      console.log('❌ [OCR] Plate pattern not detected after multiple attempts. Asking for clearer image.');
      // Update status to failed with processing error
      await supabaseClient
        .from('export_requests')
        .update({
          ocr_raw_text: extractedText,
          status: 'failed',
          processing_errors: { reason: 'plate_not_detected', note: 'Please upload a clearer image.' },
          updated_at: new Date().toISOString()
        })
        .eq('id', exportRequestId);

      return new Response(
        JSON.stringify({ error: 'License plate not fully detected. Please upload a clearer image.' }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Update export request with OCR text using valid status
      const { error: updateError } = await supabaseClient
        .from('export_requests')
        .update({
          ocr_raw_text: extractedText,
          status: 'processing', // Using valid status value
          updated_at: new Date().toISOString()
        })
        .eq('id', exportRequestId);

      if (updateError) {
        console.error('❌ [OCR] Error updating export request:', updateError);
        throw new Error(`Database update error: ${updateError.message}`);
      }

      console.log(`✅ [OCR] OCR completed successfully for export request: ${exportRequestId}`);
      console.log(`📊 [OCR] Final extracted text length: ${extractedText.length} characters`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          extractedText,
          exportRequestId,
          textLength: extractedText.length
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

  } catch (error) {
    console.error('💥 [OCR] Critical error in google-vision-ocr function:', error);
    console.error('💥 [OCR] Error stack:', (error as Error).stack);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
