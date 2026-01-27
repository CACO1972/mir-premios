import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentRequest {
  evaluation_id: string;
  amount: number;
  description: string;
  payer_email: string;
  payer_name: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!accessToken) {
      console.error("MERCADO_PAGO_ACCESS_TOKEN not configured");
      return new Response(
        JSON.stringify({ error: "Payment service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { evaluation_id, amount, description, payer_email, payer_name }: PaymentRequest = await req.json();

    if (!evaluation_id || !amount || !payer_email) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: evaluation_id, amount, payer_email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Creating MP preference for evaluation ${evaluation_id}, amount: ${amount} CLP`);

    // Get base URL for redirects
    const origin = req.headers.get("origin") || "https://lvmlnxvvytonfwqqkwuz.supabase.co";
    
    // Create Mercado Pago preference
    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [
          {
            id: evaluation_id,
            title: description || "Evaluación Premium Miró",
            quantity: 1,
            unit_price: amount,
            currency_id: "CLP",
          },
        ],
        payer: {
          email: payer_email,
          name: payer_name || "Paciente",
        },
        back_urls: {
          success: `${origin}/?payment=success&evaluation_id=${evaluation_id}`,
          failure: `${origin}/?payment=failure&evaluation_id=${evaluation_id}`,
          pending: `${origin}/?payment=pending&evaluation_id=${evaluation_id}`,
        },
        auto_return: "approved",
        external_reference: evaluation_id,
        notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mp-webhook`,
        statement_descriptor: "MIRO DENTAL",
        expires: true,
        expiration_date_from: new Date().toISOString(),
        expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      }),
    });

    if (!mpResponse.ok) {
      const errorData = await mpResponse.text();
      console.error("Mercado Pago API error:", errorData);
      return new Response(
        JSON.stringify({ error: "Failed to create payment preference", details: errorData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const mpData = await mpResponse.json();
    console.log(`MP preference created: ${mpData.id}`);

    // Update evaluation with preference ID
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase
      .from("evaluaciones")
      .update({ 
        estado_evaluacion: "pago_pendiente",
        payment_id: mpData.id 
      })
      .eq("id", evaluation_id);

    return new Response(
      JSON.stringify({
        preference_id: mpData.id,
        init_point: mpData.init_point,
        sandbox_init_point: mpData.sandbox_init_point,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error creating MP preference:", errorMessage);
    return new Response(
      JSON.stringify({ error: "Internal server error", message: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
