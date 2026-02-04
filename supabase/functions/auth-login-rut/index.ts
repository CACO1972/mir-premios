import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface LoginRequest {
  rut: string;
  email?: string;
}

// Validate Chilean RUT format
function validateRut(rut: string): boolean {
  const cleanRut = rut.replace(/[.-]/g, "").toUpperCase();
  if (cleanRut.length < 8 || cleanRut.length > 9) return false;

  const body = cleanRut.slice(0, -1);
  const verifier = cleanRut.slice(-1);

  let sum = 0;
  let multiplier = 2;

  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const expectedVerifier = 11 - (sum % 11);
  const calculatedVerifier =
    expectedVerifier === 11 ? "0" : expectedVerifier === 10 ? "K" : String(expectedVerifier);

  return verifier === calculatedVerifier;
}

// Format RUT consistently
function formatRut(rut: string): string {
  const clean = rut.replace(/[.-]/g, "").toUpperCase();
  const body = clean.slice(0, -1);
  const verifier = clean.slice(-1);
  return `${body}-${verifier}`;
}

// Generate 6-digit OTP
function generateOTP(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: LoginRequest = await req.json();
    console.log(`Login attempt with RUT: ${body.rut?.substring(0, 4)}***`);

    if (!body.rut) {
      return new Response(
        JSON.stringify({ error: "RUT is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate RUT format
    if (!validateRut(body.rut)) {
      return new Response(
        JSON.stringify({ error: "Invalid RUT format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const formattedRut = formatRut(body.rut);

    // Find user/lead by RUT
    const { data: lead } = await supabase
      .from("funnel_leads")
      .select("id, email, nombre, telefono")
      .eq("rut", formattedRut)
      .single();

    if (!lead) {
      // Check evaluaciones table
      const { data: evaluacion } = await supabase
        .from("evaluaciones")
        .select("id, email, nombre, telefono")
        .eq("rut", formattedRut)
        .single();

      if (!evaluacion) {
        return new Response(
          JSON.stringify({ 
            error: "RUT not found",
            message: "No encontramos un registro con este RUT. ¿Es paciente nuevo?",
            is_new_patient: true 
          }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const userEmail = lead?.email || body.email;
    if (!userEmail) {
      return new Response(
        JSON.stringify({ 
          error: "Email required",
          message: "Por favor ingrese su email para recibir el código de verificación" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in a simple way (in production, use a dedicated table or Redis)
    // For now, we'll store it in the lead's notifications_sent field temporarily
    const otpData = {
      type: "otp",
      code: otp,
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString(),
    };

    if (lead) {
      // Get current notifications and append new OTP
      const { data: currentLead } = await supabase
        .from("funnel_leads")
        .select("notifications_sent")
        .eq("id", lead.id)
        .single();
      
      const currentNotifications = (currentLead?.notifications_sent as unknown[]) || [];
      const updatedNotifications = [...currentNotifications, otpData];

      await supabase
        .from("funnel_leads")
        .update({ notifications_sent: updatedNotifications })
        .eq("id", lead.id);
    }

    // Send OTP via email (using Supabase's built-in email or custom provider)
    // For now, log it (in production, integrate with email service)
    console.log(`OTP for ${userEmail}: ${otp} (expires: ${expiresAt.toISOString()})`);

    // Try to send via WhatsApp if phone is available
    const whatsappToken = Deno.env.get("WHATSAPP_CLOUD_API_TOKEN");
    const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
    const userPhone = lead?.telefono;

    if (whatsappToken && phoneNumberId && userPhone) {
      try {
        const phone = userPhone.replace(/\D/g, "");
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
              body: `🔐 Tu código de verificación Clínica Miró es: ${otp}\n\nEste código expira en 10 minutos.\n\nSi no solicitaste este código, ignora este mensaje.`,
            },
          }),
        });
        console.log(`OTP sent via WhatsApp to ${phoneWithCode}`);
      } catch (waError) {
        console.error("WhatsApp OTP error (non-blocking):", waError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Código de verificación enviado",
        email_masked: userEmail.replace(/(.{2})(.*)(@.*)/, "$1***$3"),
        phone_masked: userPhone ? `***${userPhone.slice(-4)}` : null,
        expires_in_seconds: 600,
        rut: formattedRut,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Auth login-rut error:", errorMessage);
    return new Response(
      JSON.stringify({ error: "Internal server error", message: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
