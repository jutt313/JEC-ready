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
    
    // Call Google Vision API
    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: imageBase64
              },
              features: [
                {
                  type: 'TEXT_DETECTION',
                  maxResults: 1
                }
              ]
            }
          ]
        })
      }
    );

    console.log(`📡 [OCR] Google Vision API response status: ${visionResponse.status}`);

    if (!visionResponse.ok) {
      const errorText = await visionResponse.text();
      console.error('❌ [OCR] Google Vision API Error:', errorText);
      throw new Error(`Google Vision API error: ${visionResponse.status} - ${errorText}`);
    }

    const visionData = await visionResponse.json();
    console.log('📄 [OCR] Google Vision API full response:', JSON.stringify(visionData, null, 2));

    const extractedText = visionData.responses?.[0]?.fullTextAnnotation?.text || '';
    console.log(`📝 [OCR] Extracted text length: ${extractedText.length} characters`);
    console.log(`📝 [OCR] First 500 characters of extracted text:`, extractedText.substring(0, 500));
    
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

    // Initialize Supabase client
    console.log(`💾 [OCR] Updating database with OCR results...`);
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

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