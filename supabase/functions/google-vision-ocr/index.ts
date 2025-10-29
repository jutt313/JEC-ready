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
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') ?? '';
    const GOOGLE_VISION_API_KEY = Deno.env.get('GOOGLE_VISION_API_KEY') ?? '';

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

    // Try Google Vision first (images:annotate), then fallback to OpenAI if needed
    let extractedText = '';

    async function runGoogleVision(): Promise<string> {
      if (!GOOGLE_VISION_API_KEY) return '';
      console.log(`🔍 [OCR] Calling Google Vision (images:annotate)...`);
      const resp = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [
            {
              image: { content: imageBase64 },
              features: [{ type: 'TEXT_DETECTION', maxResults: 1 }],
              imageContext: { languageHints: ['ja', 'ja-Hira', 'ja-Jpan'] }
            }
          ]
        })
      });
      console.log(`📡 [OCR] Google Vision status: ${resp.status}`);
      if (!resp.ok) {
        const txt = await resp.text();
        console.warn('⚠️ [OCR] Google Vision error:', txt);
        return '';
      }
      const data = await resp.json();
      console.log('📄 [OCR] Google Vision response (truncated):', JSON.stringify({ keys: Object.keys(data || {}) }, null, 2));
      const img = data?.responses?.[0];
      const text = img?.fullTextAnnotation?.text || img?.textAnnotations?.[0]?.description || '';
      return text || '';
    }

    async function runOpenAIVision(): Promise<string> {
      if (!OPENAI_API_KEY) return '';
      console.log(`🔍 [OCR] Calling OpenAI Vision API...`);
      const openaiResp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You perform OCR. Return only the full text content from the image, preserving line breaks. No commentary.' },
            {
              role: 'user',
              content: [
                { type: 'text', text: 'Extract all readable text. Return only the text.' },
                { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
              ]
            }
          ],
          temperature: 0,
          max_tokens: 4000
        })
      });
      console.log(`📡 [OCR] OpenAI status: ${openaiResp.status}`);
      if (!openaiResp.ok) {
        const errText = await openaiResp.text();
        console.warn('⚠️ [OCR] OpenAI Vision error:', errText);
        return '';
      }
      const openaiData = await openaiResp.json();
      console.log('📄 [OCR] OpenAI response meta:', JSON.stringify({ id: openaiData.id, model: openaiData.model }, null, 2));
      const text = openaiData?.choices?.[0]?.message?.content || '';
      return text || '';
    }

    // 1) Google Vision first
    extractedText = await runGoogleVision();
    // 2) Fallback to OpenAI if Vision returns nothing
    if (!extractedText) {
      extractedText = await runOpenAIVision();
    }
    console.log(`📝 [OCR] Extracted text length: ${extractedText.length} characters`);
    console.log('📝 [OCR] Full extracted text:\n', extractedText);
    
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

    // Optional plate check (relaxed)
    const plateRegex = /[\u4e00-\u9faf\u3040-\u309f\u30a0-\u30ff]+\s+[0-9A-Z]{1,4}\s+[\u3040-\u309F]\s+\d{1,4}/;
    const plateOk = plateRegex.test(extractedText.replace(/[０-９]/g, (d: string) => String.fromCharCode(d.charCodeAt(0) - 0xFF10 + 0x30)));

    // Initialize Supabase client
    console.log(`💾 [OCR] Updating database with OCR results...`);
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (!plateOk) {
      console.warn('⚠️ [OCR] Plate pattern not detected; continuing with extracted text.');
    }

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
