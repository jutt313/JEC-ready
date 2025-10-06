
import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    const { ocrText, exportRequestId } = await req.json();

    console.log(`🤖 [AI] Starting AI extraction for export request: ${exportRequestId}`);
    console.log(`📊 [AI] OCR text length: ${ocrText?.length || 0} characters`);
    console.log(`📝 [AI] Full OCR text to analyze:\n${ocrText}`);

    if (!ocrText || !exportRequestId) {
      console.error('❌ [AI] Missing required parameters:', { 
        hasOcrText: !!ocrText, 
        hasExportRequestId: !!exportRequestId 
      });
      return new Response(
        JSON.stringify({ error: 'Missing ocrText or exportRequestId' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`🧠 [AI] Calling OpenAI for intelligent extraction...`);

    // Enhanced prompt for better accuracy with hiragana and alphanumeric plates
    const systemPrompt = `You are an expert at extracting vehicle data from Japanese 車検証 (Shakensho - Vehicle Inspection Certificate) OCR text.

CRITICAL EXTRACTION RULES:
1. Find EXACTLY these two fields with 100% accuracy:
   - 自動車登録番号 (Vehicle Registration Number) - MUST include hiragana character
   - 車台番号 (Chassis Number/VIN)

2. Vehicle Registration Number Format:
   - Pattern: [City Kanji] + [2-4 alphanumeric characters] + [Hiragana character] + [1-4 digits]
   - Examples: 
     * "福岡 302 ほ 3281" (numbers only)
     * "福岡 30B ほ 3281" (numbers + letters)
     * "東京 A12 あ 1234" (letters + numbers)
     * "大阪 1A2 い 5678" (mixed alphanumeric)
   - Look for: 登録番号, 自動車登録番号, ナンバー
   - The hiragana character is CRITICAL - look for characters like: あ, い, う, え, お, か, き, く, け, こ, さ, し, す, せ, そ, た, ち, つ, て, と, な, に, ぬ, ね, の, は, ひ, ふ, へ, ほ, ま, み, む, め, も, や, ゆ, よ, ら, り, る, れ, ろ, わ, ゐ, ゑ, を, ん
   - Must include spaces between components: "福岡 30B ほ 3281"
   - IMPORTANT: The middle part can contain BOTH numbers AND letters (A-Z, 0-9)

3. Chassis Number/VIN Format:
   - Pattern: Letters and numbers, may contain hyphens
   - Example: "A201A-0072465" or "JH4DC54856S123456" or "RU3-1367330"
   - Look for: 車台番号, シャシ番号, VIN, 車体番号
   - Extract exactly as written

4. Return ONLY valid JSON:
   {"plateNumber": "value or null", "vin": "value or null"}

5. If you cannot find a field with 100% confidence, use null
6. Do NOT guess or approximate - only extract what you can clearly identify`;

    // Call OpenAI API to extract vehicle data
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: 'Extract the vehicle registration number and chassis number from this OCR text from a Japanese vehicle inspection certificate:\n\nFULL OCR TEXT:\n' + ocrText + '\n\nIMPORTANT: Make sure the license plate includes the hiragana character between the alphanumeric part and the final numbers. The middle part can contain both letters and numbers like "30B" or "A12".\nReturn only the JSON response with the extracted data.'
          }
        ],
        temperature: 0,
        max_tokens: 200
      }),
    });

    console.log(`📡 [AI] OpenAI API response status: ${openaiResponse.status}`);

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('❌ [AI] OpenAI API Error:', errorText);
      throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorText}`);
    }

    const openaiData = await openaiResponse.json();
    console.log('📄 [AI] OpenAI API full response:', JSON.stringify(openaiData, null, 2));

    const extractedContent = openaiData.choices?.[0]?.message?.content || '';
    console.log(`🎯 [AI] Raw extracted content: "${extractedContent}"`);

    let extractedData;
    try {
      extractedData = JSON.parse(extractedContent);
      console.log('✅ [AI] Parsed extracted data:', JSON.stringify(extractedData, null, 2));
    } catch (parseError) {
      console.error('❌ [AI] Error parsing OpenAI response:', parseError);
      console.error('❌ [AI] Raw content that failed to parse:', extractedContent);
      throw new Error('Failed to parse AI response as JSON');
    }

    // Validate the extracted data structure
    if (typeof extractedData !== 'object' || 
        (!extractedData.hasOwnProperty('plateNumber') || !extractedData.hasOwnProperty('vin'))) {
      console.error('❌ [AI] Invalid extracted data structure:', extractedData);
      throw new Error('AI response does not contain required fields');
    }

    console.log(`🎯 [AI] Final extracted data:`, {
      plateNumber: extractedData.plateNumber,
      vin: extractedData.vin
    });

    // Initialize Supabase client
    console.log(`💾 [AI] Updating database with extracted data...`);
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Update export request with extracted data using valid status
    const { error: updateError } = await supabaseClient
      .from('export_requests')
      .update({
        ai_extracted_data: extractedData,
        plate_number: extractedData.plateNumber,
        vin: extractedData.vin,
        chassis_number: extractedData.vin,
        status: 'completed',
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', exportRequestId);

    if (updateError) {
      console.error('❌ [AI] Error updating export request:', updateError);
      throw new Error(`Database update error: ${updateError.message}`);
    }

    console.log(`✅ [AI] AI extraction completed successfully for export request: ${exportRequestId}`);
    console.log(`🎯 [AI] Successfully extracted:`, {
      plateNumber: extractedData.plateNumber,
      vin: extractedData.vin
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        extractedData,
        exportRequestId 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('💥 [AI] Critical error in extract-vehicle-data function:', error);
    console.error('🔍 [AI] Error stack:', (error as Error).stack);
    
    // Try to update status to error in database
    try {
      console.log(`🔄 [AI] Attempting to update status to failed...`);
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      const { exportRequestId } = await req.json().catch(() => ({}));
      if (exportRequestId) {
        await supabaseClient
          .from('export_requests')
          .update({
            status: 'failed',
            processing_errors: { error: (error as Error).message, timestamp: new Date().toISOString() },
            updated_at: new Date().toISOString()
          })
          .eq('id', exportRequestId);
        console.log(`💾 [AI] Updated status to failed for export request: ${exportRequestId}`);
      }
    } catch (dbError) {
      console.error('❌ [AI] Error updating database with error status:', dbError);
    }

    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});