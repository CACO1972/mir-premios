import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
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
    console.log("Payment webhook received:", JSON.stringify(body));

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

      const leadId = payment.external_reference;
      if (!leadId) {
        console.log("No external_reference (lead_id) found, skipping");
        return new Response("OK", { status: 200 });
      }

      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Map MP status to our status
      let paymentStatus: string;
      let newStage: string;

      switch (payment.status) {
        case "approved":
          paymentStatus = "approved";
          newStage = "PAID";
          break;
        case "pending":
        case "in_process":
          paymentStatus = "pending";
          newStage = "CHECKOUT_CREATED";
          break;
        case "rejected":
        case "cancelled":
          paymentStatus = "rejected";
          newStage = "CHECKOUT_CREATED";
          break;
        case "refunded":
        case "charged_back":
          paymentStatus = "refunded";
          newStage = "CANCELLED";
          break;
        default:
          paymentStatus = "pending";
          newStage = "CHECKOUT_CREATED";
      }

      // Get current lead to check evaluacion_id
      const { data: lead } = await supabase
        .from("funnel_leads")
        .select("evaluacion_id")
        .eq("id", leadId)
        .single();

      // Update funnel_leads
      const { error: leadError } = await supabase
        .from("funnel_leads")
        .update({
          payment_status: paymentStatus,
          payment_id: String(paymentId),
          monto_pagado: payment.transaction_amount,
          stage: newStage,
          paid_at: paymentStatus === "approved" ? new Date().toISOString() : null,
        })
        .eq("id", leadId);

      if (leadError) {
        console.error("Error updating funnel_leads:", leadError);
      } else {
        console.log(`Lead ${leadId} updated: stage=${newStage}, status=${paymentStatus}`);
      }

      // Update evaluaciones if linked
      if (lead?.evaluacion_id) {
        const estadoEvaluacion = paymentStatus === "approved" ? "pago_completado" : 
                                  paymentStatus === "refunded" ? "cancelada" : "pago_pendiente";

        const { error: evalError } = await supabase
          .from("evaluaciones")
          .update({
            payment_status: paymentStatus,
            payment_id: String(paymentId),
            monto_pagado: payment.transaction_amount,
            estado_evaluacion: estadoEvaluacion,
          })
          .eq("id", lead.evaluacion_id);

        if (evalError) {
          console.error("Error updating evaluaciones:", evalError);
        }
      }

      // Send WhatsApp notification if payment approved
      if (paymentStatus === "approved") {
        const whatsappToken = Deno.env.get("WHATSAPP_CLOUD_API_TOKEN");
        const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
        
        if (whatsappToken && phoneNumberId && lead) {
          try {
            // Get lead phone
            const { data: fullLead } = await supabase
              .from("funnel_leads")
              .select("telefono, nombre")
              .eq("id", leadId)
              .single();

            if (fullLead?.telefono) {
              const phone = fullLead.telefono.replace(/\D/g, "");
              const phoneWithCode = phone.startsWith("56") ? phone : `56${phone}`;

              await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${whatsappToken}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  messaging_product: "whatsapp",
                  to: phoneWithCode,
                  type: "text",
                  text: {
                    body: `¡Hola ${fullLead.nombre}! 🎉\n\nTu pago de la Evaluación Premium Miró ha sido confirmado.\n\nEl siguiente paso es agendar tu cita. Te enviaremos un enlace para seleccionar el horario que más te acomode.\n\nClínica Miró`,
                  },
                }),
              });
              console.log(`WhatsApp notification sent to ${phoneWithCode}`);
            }
          } catch (waError) {
            console.error("WhatsApp notification error (non-blocking):", waError);
          }
        }
      }
    }

    return new Response("OK", { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error("Webhook error:", error);
    return new Response("OK", { status: 200 });
  }
});
