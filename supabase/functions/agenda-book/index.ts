import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface BookingRequest {
  lead_id: string;
  date: string;
  time: string;
  ruta_sugerida?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const dentalinkToken = Deno.env.get("DENTALINK_API_TOKEN");
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: BookingRequest = await req.json();
    console.log(`Booking appointment for lead: ${body.lead_id}, date: ${body.date}, time: ${body.time}`);

    if (!body.lead_id || !body.date || !body.time) {
      return new Response(
        JSON.stringify({ error: "lead_id, date, and time are required" }),
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

    // Validate lead has paid
    if (lead.stage !== "PAID" && lead.payment_status !== "approved") {
      return new Response(
        JSON.stringify({ error: "Payment required before scheduling" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const appointmentDateTime = `${body.date}T${body.time}:00`;
    let dentalinkAppointmentId: string | null = null;

    // Create appointment in Dentalink if configured
    if (dentalinkToken && lead.dentalink_patient_id) {
      try {
        const dentalinkResponse = await fetch(
          "https://api.dentalink.healthatom.com/api/v1/citas",
          {
            method: "POST",
            headers: {
              "Authorization": `Token ${dentalinkToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              paciente_id: lead.dentalink_patient_id,
              fecha: body.date,
              hora_inicio: body.time,
              duracion: 60, // 60 minutes
              motivo: `Evaluación Premium - ${lead.ia_ruta_sugerida || "General"}`,
              estado: "confirmada",
            }),
          }
        );

        if (dentalinkResponse.ok) {
          const dentalinkData = await dentalinkResponse.json();
          dentalinkAppointmentId = dentalinkData.data?.id || null;
          console.log(`Dentalink appointment created: ${dentalinkAppointmentId}`);
        } else {
          console.error("Dentalink booking failed:", await dentalinkResponse.text());
        }
      } catch (dentalinkError) {
        console.error("Dentalink booking error (non-blocking):", dentalinkError);
      }
    }

    // Update lead with appointment info
    const { error: updateError } = await supabase
      .from("funnel_leads")
      .update({
        stage: "SCHEDULED",
        cita_agendada_at: appointmentDateTime,
        dentalink_appointment_id: dentalinkAppointmentId,
      })
      .eq("id", body.lead_id);

    if (updateError) {
      console.error("Error updating lead:", updateError);
      throw updateError;
    }

    // Update evaluacion if linked
    if (lead.evaluacion_id) {
      await supabase
        .from("evaluaciones")
        .update({
          estado_evaluacion: "cita_agendada",
          cita_agendada_at: appointmentDateTime,
        })
        .eq("id", lead.evaluacion_id);
    }

    // Send confirmation via WhatsApp
    const whatsappToken = Deno.env.get("WHATSAPP_CLOUD_API_TOKEN");
    const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");

    if (whatsappToken && phoneNumberId && lead.telefono) {
      try {
        const phone = lead.telefono.replace(/\D/g, "");
        const phoneWithCode = phone.startsWith("56") ? phone : `56${phone}`;

        const appointmentDate = new Date(appointmentDateTime);
        const formattedDate = appointmentDate.toLocaleDateString("es-CL", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        const formattedTime = appointmentDate.toLocaleTimeString("es-CL", {
          hour: "2-digit",
          minute: "2-digit",
        });

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
              body: `¡Cita confirmada! 📅\n\nHola ${lead.nombre},\n\nTu Evaluación Premium Miró está agendada para:\n\n📆 ${formattedDate}\n🕐 ${formattedTime}\n📍 Clínica Miró\n\nRecuerda traer:\n• Documento de identidad\n• Radiografías previas (si las tienes)\n\n¿Necesitas reagendar? Responde este mensaje.\n\nClínica Miró`,
            },
          }),
        });
        console.log(`WhatsApp confirmation sent to ${phoneWithCode}`);
      } catch (waError) {
        console.error("WhatsApp confirmation error (non-blocking):", waError);
      }
    }

    console.log(`Appointment booked for lead ${body.lead_id}: ${appointmentDateTime}`);

    return new Response(
      JSON.stringify({
        success: true,
        lead_id: body.lead_id,
        stage: "SCHEDULED",
        appointment: {
          date: body.date,
          time: body.time,
          datetime: appointmentDateTime,
          dentalink_id: dentalinkAppointmentId,
        },
        confirmation: "Tu cita ha sido agendada. Recibirás un recordatorio por WhatsApp.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Agenda book error:", errorMessage);
    return new Response(
      JSON.stringify({ error: "Internal server error", message: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
