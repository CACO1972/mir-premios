import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const DENTALINK_API_URL = 'https://api.dentalink.healthatom.com/api/v1';

interface CreatePatientRequest {
  evaluation_id: string;
  nombre: string;
  email: string;
  telefono?: string;
  rut?: string;
  fecha_nacimiento?: string;
}

interface ScheduleAppointmentRequest {
  evaluation_id: string;
  patient_id: string;
  date: string; // ISO format
  time: string; // HH:mm format
  duration_minutes?: number;
  professional_id?: string;
  branch_id?: string;
  service_id?: string;
  notes?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const DENTALINK_API_TOKEN = Deno.env.get('DENTALINK_API_TOKEN');
    if (!DENTALINK_API_TOKEN) {
      throw new Error('DENTALINK_API_TOKEN not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const action = url.pathname.split('/').pop();

    const headers = {
      'Authorization': `Token ${DENTALINK_API_TOKEN}`,
      'Content-Type': 'application/json',
    };

    // Action: Create Patient
    if (action === 'create-patient' || url.pathname.endsWith('dentalink-integration')) {
      const body = await req.json() as { action?: string; rut?: string } & CreatePatientRequest & ScheduleAppointmentRequest;
      
      // Action: Search Patient by RUT
      if (body.action === 'search-by-rut' && body.rut) {
        console.log('Searching Dentalink for RUT:', body.rut);
        
        // Normalize RUT to format without dots, with hyphen
        const cleanRut = body.rut.replace(/[.-]/g, '').toUpperCase();
        const normalizedRut = cleanRut.length > 1 
          ? `${cleanRut.slice(0, -1)}-${cleanRut.slice(-1)}`
          : cleanRut;
        
        const searchResponse = await fetch(
          `${DENTALINK_API_URL}/pacientes?rut=${encodeURIComponent(normalizedRut)}`,
          { method: 'GET', headers }
        );
        
        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          if (searchData.data && searchData.data.length > 0) {
            const patient = searchData.data[0];
            return new Response(JSON.stringify({
              success: true,
              found: true,
              patient: {
                id: patient.id,
                nombre: patient.nombre,
                apellidos: patient.apellidos,
                email: patient.email,
                telefono: patient.telefono,
                rut: normalizedRut,
              },
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
        
        return new Response(JSON.stringify({
          success: true,
          found: false,
          message: 'Paciente no encontrado en Dentalink',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (body.action === 'create-patient' || action === 'create-patient') {
        console.log('Creating patient in Dentalink:', body.nombre);
        
        // Split nombre into first name and last name
        const nameParts = body.nombre.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const patientData: Record<string, unknown> = {
          nombre: firstName,
          apellidos: lastName || firstName, // Dentalink requires apellidos (plural)
          email: body.email,
        };

        if (body.telefono) {
          patientData.telefono = body.telefono;
        }

        if (body.rut) {
          patientData.rut = body.rut;
        }

        if (body.fecha_nacimiento) {
          patientData.fecha_nacimiento = body.fecha_nacimiento;
        }

        console.log('Sending to Dentalink:', JSON.stringify(patientData));

        const response = await fetch(`${DENTALINK_API_URL}/pacientes`, {
          method: 'POST',
          headers,
          body: JSON.stringify(patientData),
        });

        const responseText = await response.text();
        console.log('Dentalink response status:', response.status);
        console.log('Dentalink response:', responseText);

        if (!response.ok) {
          // Check if patient already exists (search by email or RUT)
          if (response.status === 400 || response.status === 409) {
            console.log('Patient may already exist, searching...');
            
            const searchParams = body.rut 
              ? `?rut=${encodeURIComponent(body.rut)}`
              : `?email=${encodeURIComponent(body.email)}`;
            
            const searchResponse = await fetch(`${DENTALINK_API_URL}/pacientes${searchParams}`, {
              method: 'GET',
              headers,
            });

            if (searchResponse.ok) {
              const searchData = await searchResponse.json();
              if (searchData.data && searchData.data.length > 0) {
                const existingPatient = searchData.data[0];
                console.log('Found existing patient:', existingPatient.id);
                
                // Update evaluation with existing patient ID
                await supabase
                  .from('evaluaciones')
                  .update({ dentalink_patient_id: existingPatient.id.toString() })
                  .eq('id', body.evaluation_id);

                return new Response(JSON.stringify({
                  success: true,
                  patient_id: existingPatient.id,
                  existing: true,
                  message: 'Paciente existente encontrado',
                }), {
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
              }
            }
          }
          
          throw new Error(`Dentalink API error: ${response.status} - ${responseText}`);
        }

        const data = await JSON.parse(responseText);
        const patientId = data.data?.id || data.id;

        console.log('Patient created with ID:', patientId);

        // Update evaluation with patient ID
        await supabase
          .from('evaluaciones')
          .update({ dentalink_patient_id: patientId.toString() })
          .eq('id', body.evaluation_id);

        return new Response(JSON.stringify({
          success: true,
          patient_id: patientId,
          existing: false,
          message: 'Paciente creado exitosamente',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Action: Schedule Appointment
      if (body.action === 'schedule-appointment') {
        console.log('Scheduling appointment for patient:', body.patient_id);

        // Get a dentist/professional ID and branch ID if not provided
        let professionalId = body.professional_id;
        let branchId = body.branch_id;
        
        if (!professionalId || !branchId) {
          console.log('Fetching available dentists...');
          try {
            // Try /dentistas endpoint first (required for id_dentista field)
            const profResponse = await fetch(`${DENTALINK_API_URL}/dentistas`, {
              method: 'GET',
              headers,
            });
            const profResponseText = await profResponse.text();
            console.log('Dentistas response:', profResponse.status);
            
            if (profResponse.ok) {
              const profData = JSON.parse(profResponseText);
              if (profData.data && profData.data.length > 0) {
                // Find first enabled dentist (habilitado = 1)
                const enabledDentist = profData.data.find((d: { habilitado: number }) => d.habilitado === 1) || profData.data[0];
                professionalId = professionalId || enabledDentist.id.toString();
                branchId = branchId || enabledDentist.id_sucursal?.toString() || '1';
                console.log('Using dentist ID:', professionalId, 'Branch ID:', branchId);
              } else {
                console.log('No dentists found in response');
              }
            }
          } catch (err) {
            console.log('Could not fetch dentists:', err);
          }
        }

        // If still no professional ID, the appointment will fail - Dentalink requires id_dentista
        if (!professionalId) {
          console.log('WARNING: No professional ID available. Dentalink requires id_dentista for appointments.');
          return new Response(JSON.stringify({
            success: false,
            error: 'No se pudo obtener un profesional disponible para agendar la cita. Por favor, contacte a la clínica directamente.',
            requires_manual_scheduling: true,
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const appointmentData: Record<string, unknown> = {
          id_paciente: parseInt(body.patient_id),
          id_dentista: parseInt(professionalId),
          id_sucursal: parseInt(branchId || '1'),
          fecha: body.date, // YYYY-MM-DD
          hora_inicio: body.time, // HH:mm
          duracion: body.duration_minutes || 60,
        };

        if (body.service_id) {
          appointmentData.id_tratamiento = parseInt(body.service_id);
        }

        if (body.notes) {
          appointmentData.notas = body.notes;
        }

        console.log('Sending appointment to Dentalink:', JSON.stringify(appointmentData));

        const response = await fetch(`${DENTALINK_API_URL}/citas`, {
          method: 'POST',
          headers,
          body: JSON.stringify(appointmentData),
        });

        const responseText = await response.text();
        console.log('Dentalink appointment response:', response.status, responseText);

        if (!response.ok) {
          throw new Error(`Dentalink appointment error: ${response.status} - ${responseText}`);
        }

        const data = JSON.parse(responseText);
        const appointmentId = data.data?.id || data.id;

        // Update evaluation with appointment status
        await supabase
          .from('evaluaciones')
          .update({ 
            estado_evaluacion: 'cita_agendada',
            cita_agendada_at: new Date().toISOString(),
          })
          .eq('id', body.evaluation_id);

        return new Response(JSON.stringify({
          success: true,
          appointment_id: appointmentId,
          message: 'Cita agendada exitosamente',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Action: Get Available Slots
      if (body.action === 'get-available-slots') {
        console.log('Fetching available appointment slots');

        const today = new Date();
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        const startDate = today.toISOString().split('T')[0];
        const endDate = nextWeek.toISOString().split('T')[0];

        const response = await fetch(
          `${DENTALINK_API_URL}/agenda/disponibilidad?fecha_inicio=${startDate}&fecha_fin=${endDate}`,
          {
            method: 'GET',
            headers,
          }
        );

        if (!response.ok) {
          // If no availability endpoint, return mock slots
          console.log('Availability endpoint not available, returning sample slots');
          
          const mockSlots = [];
          for (let i = 1; i <= 5; i++) {
            const date = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
            if (date.getDay() !== 0 && date.getDay() !== 6) { // Skip weekends
              mockSlots.push({
                date: date.toISOString().split('T')[0],
                times: ['10:00', '11:00', '15:00', '16:00'],
              });
            }
          }

          return new Response(JSON.stringify({
            success: true,
            slots: mockSlots,
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const data = await response.json();
        
        return new Response(JSON.stringify({
          success: true,
          slots: data.data || [],
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({
      error: 'Invalid action',
      message: 'Use action: create-patient, schedule-appointment, or get-available-slots',
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Dentalink integration error:', error);
    return new Response(JSON.stringify({
      error: errorMessage,
      success: false,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
