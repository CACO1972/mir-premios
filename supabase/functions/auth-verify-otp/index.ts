import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface VerifyRequest {
  rut: string;
  otp: string;
}

// Format RUT consistently
function formatRut(rut: string): string {
  const clean = rut.replace(/[.-]/g, "").toUpperCase();
  const body = clean.slice(0, -1);
  const verifier = clean.slice(-1);
  return `${body}-${verifier}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: VerifyRequest = await req.json();
    console.log(`OTP verification for RUT: ${body.rut?.substring(0, 4)}***`);

    if (!body.rut || !body.otp) {
      return new Response(
        JSON.stringify({ error: "RUT and OTP are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (body.otp.length !== 6 || !/^\d+$/.test(body.otp)) {
      return new Response(
        JSON.stringify({ error: "Invalid OTP format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const formattedRut = formatRut(body.rut);

    // Find lead by RUT
    const { data: lead, error: leadError } = await supabase
      .from("funnel_leads")
      .select("id, email, nombre, telefono, notifications_sent")
      .eq("rut", formattedRut)
      .single();

    if (leadError || !lead) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check OTP in notifications_sent
    const notifications = lead.notifications_sent as Array<{
      type: string;
      code: string;
      expires_at: string;
    }> || [];

    const otpEntry = notifications
      .filter((n) => n.type === "otp")
      .sort((a, b) => new Date(b.expires_at).getTime() - new Date(a.expires_at).getTime())[0];

    if (!otpEntry) {
      return new Response(
        JSON.stringify({ error: "No pending OTP found. Please request a new code." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if OTP is expired
    if (new Date(otpEntry.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "OTP expired. Please request a new code." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify OTP
    if (otpEntry.code !== body.otp) {
      return new Response(
        JSON.stringify({ error: "Invalid OTP" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // OTP is valid - create or get Supabase Auth user
    let authUser;
    
    // Check if user exists in auth.users by email
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === lead.email);

    if (existingUser) {
      // Generate magic link / session for existing user
      const { data: magicLinkData, error: magicError } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: lead.email,
      });

      if (magicError) {
        console.error("Magic link error:", magicError);
      }

      authUser = existingUser;
    } else {
      // Create new user
      const tempPassword = crypto.randomUUID();
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: lead.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          nombre: lead.nombre,
          rut: formattedRut,
          telefono: lead.telefono,
        },
      });

      if (createError) {
        console.error("User creation error:", createError);
        return new Response(
          JSON.stringify({ error: "Failed to create user session" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      authUser = newUser.user;
    }

    // Generate session token
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: lead.email,
    });

    if (sessionError) {
      console.error("Session generation error:", sessionError);
    }

    // Clear used OTP
    const updatedNotifications = notifications.filter(
      (n) => !(n.type === "otp" && n.code === body.otp)
    );
    
    await supabase
      .from("funnel_leads")
      .update({ notifications_sent: updatedNotifications })
      .eq("id", lead.id);

    console.log(`OTP verified successfully for lead ${lead.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Verificación exitosa",
        user: {
          id: authUser?.id,
          email: lead.email,
          nombre: lead.nombre,
          rut: formattedRut,
        },
        session_url: sessionData?.properties?.action_link,
        lead_id: lead.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Auth verify-otp error:", errorMessage);
    return new Response(
      JSON.stringify({ error: "Internal server error", message: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
