import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface UploadRequest {
  lead_id: string;
  images: Array<{
    name: string;
    type: string;
    base64: string;
  }>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: UploadRequest = await req.json();
    console.log(`Processing upload for lead: ${body.lead_id}, images: ${body.images?.length || 0}`);

    if (!body.lead_id || !body.images || body.images.length === 0) {
      return new Response(
        JSON.stringify({ error: "lead_id and images are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify lead exists
    const { data: lead, error: leadError } = await supabase
      .from("funnel_leads")
      .select("id, evaluacion_id")
      .eq("id", body.lead_id)
      .single();

    if (leadError || !lead) {
      return new Response(
        JSON.stringify({ error: "Lead not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const uploadedUrls: string[] = [];

    // Upload each image to storage
    for (const image of body.images) {
      const fileName = `${body.lead_id}/${Date.now()}-${image.name}`;
      
      // Convert base64 to Uint8Array
      const base64Data = image.base64.replace(/^data:image\/\w+;base64,/, "");
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("dental-images")
        .upload(fileName, bytes, {
          contentType: image.type || "image/jpeg",
          upsert: true,
        });

      if (uploadError) {
        console.error(`Error uploading ${image.name}:`, uploadError);
        continue;
      }

      // Get public URL (or signed URL for private bucket)
      const { data: urlData } = await supabase.storage
        .from("dental-images")
        .createSignedUrl(fileName, 60 * 60 * 24 * 7); // 7 days

      if (urlData?.signedUrl) {
        uploadedUrls.push(urlData.signedUrl);
        console.log(`Uploaded: ${fileName}`);
      }
    }

    // Update lead with image count info
    await supabase
      .from("funnel_leads")
      .update({
        notifications_sent: supabase.rpc("jsonb_build_object", {
          type: "images_uploaded",
          count: uploadedUrls.length,
          timestamp: new Date().toISOString(),
        }),
      })
      .eq("id", body.lead_id);

    // Update evaluacion if linked
    if (lead.evaluacion_id) {
      await supabase
        .from("evaluaciones")
        .update({ imagenes_urls: uploadedUrls })
        .eq("id", lead.evaluacion_id);
    }

    console.log(`Upload complete: ${uploadedUrls.length} images for lead ${body.lead_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        uploaded_count: uploadedUrls.length,
        image_urls: uploadedUrls,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Upload intake error:", errorMessage);
    return new Response(
      JSON.stringify({ error: "Internal server error", message: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
