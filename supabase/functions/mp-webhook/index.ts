import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!accessToken) {
      console.error("MERCADO_PAGO_ACCESS_TOKEN not configured");
      return new Response("OK", { status: 200 });
    }

    const body = await req.json();
    console.log("MP Webhook received:", JSON.stringify(body));

    // Handle payment notification
    if (body.type === "payment" && body.data?.id) {
      const paymentId = body.data.id;
      
      // Get payment details from Mercado Pago
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      });

      if (!mpResponse.ok) {
        console.error("Failed to fetch payment details");
        return new Response("OK", { status: 200 });
      }

      const payment = await mpResponse.json();
      console.log("Payment details:", JSON.stringify(payment));

      const evaluationId = payment.external_reference;
      if (!evaluationId) {
        console.log("No external_reference found, skipping");
        return new Response("OK", { status: 200 });
      }

      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Map MP status to our status
      let paymentStatus: string;
      let estadoEvaluacion: string;

      switch (payment.status) {
        case "approved":
          paymentStatus = "approved";
          estadoEvaluacion = "pago_completado";
          break;
        case "pending":
        case "in_process":
          paymentStatus = "pending";
          estadoEvaluacion = "pago_pendiente";
          break;
        case "rejected":
        case "cancelled":
          paymentStatus = "rejected";
          estadoEvaluacion = "pago_pendiente";
          break;
        case "refunded":
        case "charged_back":
          paymentStatus = "refunded";
          estadoEvaluacion = "cancelada";
          break;
        default:
          paymentStatus = "pending";
          estadoEvaluacion = "pago_pendiente";
      }

      // Update evaluation
      const { error } = await supabase
        .from("evaluaciones")
        .update({
          payment_status: paymentStatus,
          payment_id: String(paymentId),
          monto_pagado: payment.transaction_amount,
          estado_evaluacion: estadoEvaluacion,
        })
        .eq("id", evaluationId);

      if (error) {
        console.error("Error updating evaluation:", error);
      } else {
        console.log(`Evaluation ${evaluationId} updated: ${paymentStatus}`);
      }
    }

    return new Response("OK", { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error("Webhook error:", error);
    // Always return 200 to avoid MP retries for handled errors
    return new Response("OK", { status: 200 });
  }
});
