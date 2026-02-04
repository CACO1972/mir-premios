import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CheckoutRequest {
  lead_id: string;
  tipo_evaluacion?: "premium" | "premium_plus";
  return_url?: string;
}

const PRECIOS = {
  premium: 49000, // CLP
  premium_plus: 65000, // CLP
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const mpAccessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: CheckoutRequest = await req.json();
    console.log(`Creating premium checkout for lead: ${body.lead_id}`);

    if (!body.lead_id) {
      return new Response(
        JSON.stringify({ error: "lead_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get lead data
    const { data: lead, error: leadError } = await supabase
      .from("funnel_leads")
      .select("*")
      .eq("id", body.lead_id)
      .single();

    if (leadError || !lead) {
      return new Response(
        JSON.stringify({ error: "Lead not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate stage transition
    if (lead.stage !== "IA_DONE" && lead.stage !== "LEAD") {
      console.warn(`Lead ${body.lead_id} in unexpected stage: ${lead.stage}`);
    }

    const tipoEvaluacion = body.tipo_evaluacion || "premium";
    const monto = PRECIOS[tipoEvaluacion];
    const description = tipoEvaluacion === "premium_plus" 
      ? "Evaluación Premium Plus Clínica Miró" 
      : "Evaluación Premium Clínica Miró";

    if (!mpAccessToken) {
      // Return mock checkout for development
      const mockCheckoutUrl = `${body.return_url || supabaseUrl}?payment=pending&lead_id=${body.lead_id}`;
      
      await supabase
        .from("funnel_leads")
        .update({
          stage: "CHECKOUT_CREATED",
          checkout_url: mockCheckoutUrl,
          checkout_created_at: new Date().toISOString(),
        })
        .eq("id", body.lead_id);

      return new Response(
        JSON.stringify({
          success: true,
          checkout_url: mockCheckoutUrl,
          amount: monto,
          description,
          mode: "development",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get base URL for redirects
    const origin = body.return_url || req.headers.get("origin") || "https://lvmlnxvvytonfwqqkwuz.lovable.app";
    
    // Create Mercado Pago preference
    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${mpAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [
          {
            id: body.lead_id,
            title: description,
            quantity: 1,
            unit_price: monto,
            currency_id: "CLP",
          },
        ],
        payer: {
          email: lead.email,
          name: lead.nombre,
        },
        back_urls: {
          success: `${origin}/?payment=success&lead_id=${body.lead_id}`,
          failure: `${origin}/?payment=failure&lead_id=${body.lead_id}`,
          pending: `${origin}/?payment=pending&lead_id=${body.lead_id}`,
        },
        auto_return: "approved",
        external_reference: body.lead_id,
        notification_url: `${supabaseUrl}/functions/v1/webhooks-payment`,
        statement_descriptor: "MIRO DENTAL",
        expires: true,
        expiration_date_from: new Date().toISOString(),
        expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
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

    // Update lead with checkout info
    await supabase
      .from("funnel_leads")
      .update({
        stage: "CHECKOUT_CREATED",
        checkout_url: mpData.init_point,
        checkout_created_at: new Date().toISOString(),
        payment_id: mpData.id,
      })
      .eq("id", body.lead_id);

    // Update evaluacion if linked
    if (lead.evaluacion_id) {
      await supabase
        .from("evaluaciones")
        .update({
          estado_evaluacion: "pago_pendiente",
          payment_id: mpData.id,
        })
        .eq("id", lead.evaluacion_id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        checkout_url: mpData.init_point,
        sandbox_url: mpData.sandbox_init_point,
        preference_id: mpData.id,
        amount: monto,
        description,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Premium checkout error:", errorMessage);
    return new Response(
      JSON.stringify({ error: "Internal server error", message: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
