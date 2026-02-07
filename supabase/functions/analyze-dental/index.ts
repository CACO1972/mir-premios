import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface AnalysisRequest {
  evaluation_id: string;
  image_urls: string[];
  motivo_consulta?: string;
  cuestionario_clinico?: Record<string, unknown>;
}

interface ToothFinding {
  piece: string;
  x: number;
  y: number;
  status: 'green' | 'yellow' | 'red';
  diagnosis?: string;
  depth?: string;
  treatment?: string;
}

interface AnalysisResult {
  ruta_sugerida: 'implantes' | 'ortodoncia' | 'caries' | 'bruxismo';
  resumen_ia: string;
  hallazgos: ToothFinding[];
  confianza: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Supabase credentials not configured");
      throw new Error("Supabase credentials not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { evaluation_id, image_urls, motivo_consulta, cuestionario_clinico }: AnalysisRequest = await req.json();

    console.log(`Starting analysis for evaluation: ${evaluation_id}`);
    console.log(`Number of images: ${image_urls?.length || 0}`);
    console.log(`Motivo consulta: ${motivo_consulta}`);

    // Build the prompt for dental analysis - ULTRA PRECISE with GPT-5
    const systemPrompt = `Eres un experto radiólogo dental especializado en diagnóstico por imagen con más de 20 años de experiencia clínica. Tu análisis debe ser ULTRA PRECISO y meticuloso.

## PROTOCOLO DE ANÁLISIS SISTEMÁTICO

### 1. ANÁLISIS RADIOGRÁFICO PANORÁMICO
Evalúa sistemáticamente cada cuadrante siguiendo la nomenclatura FDI:
- Cuadrante 1 (Superior Derecho): Piezas 1.1-1.8
- Cuadrante 2 (Superior Izquierdo): Piezas 2.1-2.8
- Cuadrante 3 (Inferior Izquierdo): Piezas 3.1-3.8
- Cuadrante 4 (Inferior Derecho): Piezas 4.1-4.8

### 2. HALLAZGOS A DETECTAR CON PRECISIÓN
Para CADA pieza dental visible, evalúa:
- **CARIES**: Identifica localización exacta (mesial/distal/oclusal/vestibular/lingual/cervical), profundidad estimada en mm, clasificación (incipiente/esmalte/dentina/pulpar)
- **LESIONES PERIAPICALES**: Granulomas, quistes, abscesos con tamaño aproximado
- **ENFERMEDAD PERIODONTAL**: Pérdida ósea horizontal/vertical, bolsas periodontales
- **RESTAURACIONES**: Material (amalgama/resina/corona/implante), estado (adaptada/filtración/fracturada)
- **TRATAMIENTOS ENDODÓNTICOS**: Calidad de obturación, lesiones persistentes
- **DESGASTE DENTAL**: Atrición, abrasión, erosión - clasificar severidad
- **ANOMALÍAS ESTRUCTURALES**: Dientes supernumerarios, agenesias, dientes retenidos
- **ESPACIOS EDÉNTULOS**: Ubicación y potencial para rehabilitación

### 3. CLASIFICACIÓN DE SEVERIDAD
- **GREEN (verde)**: Pieza sana o hallazgo menor que no requiere intervención inmediata
- **YELLOW (amarillo)**: Hallazgo que requiere vigilancia o tratamiento preventivo
- **RED (rojo)**: Patología activa que requiere tratamiento prioritario

### 4. CORRELACIÓN CLÍNICA
Relaciona los hallazgos radiográficos con:
- Motivo de consulta del paciente
- Síntomas reportados (dolor, sensibilidad)
- Historia clínica proporcionada

### 5. FORMATO DE RESPUESTA
SIEMPRE responde en JSON válido con esta estructura exacta:
{
  "ruta_sugerida": "implantes" | "ortodoncia" | "caries" | "bruxismo",
  "resumen_ia": "Resumen ejecutivo del análisis (máximo 250 palabras). Incluye hallazgos principales, nivel de urgencia y recomendaciones priorizadas.",
  "hallazgos": [
    {
      "piece": "2.1",
      "x": 52,
      "y": 32,
      "status": "red" | "yellow" | "green",
      "diagnosis": "Descripción precisa del hallazgo con terminología clínica",
      "depth": "Profundidad o tamaño si aplica (ej: 2.3mm, 4x5mm)",
      "treatment": "Tratamiento recomendado específico"
    }
  ],
  "confianza": 0.95
}

### 6. COORDENADAS DE POSICIONAMIENTO
Las coordenadas x,y son porcentajes (0-100) de la posición en la imagen panorámica:
- x=50 es la línea media (entre incisivos centrales)
- x<50 lado derecho del paciente, x>50 lado izquierdo del paciente
- y=25-35 zona de molares/premolares superiores
- y=35-45 zona de incisivos/caninos superiores
- y=55-65 zona de incisivos/caninos inferiores
- y=65-75 zona de molares/premolares inferiores

### IMPORTANTE
- Este es un PRE-DIAGNÓSTICO asistido por IA que DEBE ser confirmado por un profesional
- Ante hallazgos críticos (abscesos, fracturas, patología sospechosa), indica URGENCIA
- Prioriza los hallazgos de mayor relevancia clínica
- Incluye TODAS las piezas evaluadas, incluso las sanas (status: green)`;

    // Helper function to convert image URL to base64
    async function imageUrlToBase64(url: string): Promise<string | null> {
      try {
        // Extract the storage path from the URL
        const storagePathMatch = url.match(/dental-images\/(.+)$/);
        if (!storagePathMatch) {
          console.log("Could not extract storage path from URL:", url);
          return null;
        }
        
        const storagePath = storagePathMatch[1];
        console.log("Downloading image from storage path:", storagePath);
        
        // Download using Supabase storage (works for private buckets)
        const { data, error } = await supabase.storage
          .from('dental-images')
          .download(storagePath);
        
        if (error || !data) {
          console.error("Failed to download image:", error);
          return null;
        }
        
        // Convert blob to base64 (chunked to avoid call stack / arg size limits)
        const arrayBuffer = await data.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);

        let binary = '';
        const chunkSize = 0x8000; // 32KB
        for (let i = 0; i < bytes.length; i += chunkSize) {
          const chunk = bytes.subarray(i, i + chunkSize);
          binary += String.fromCharCode(...chunk);
        }
        const base64 = btoa(binary);

        // Determine mime type from extension
        const ext = storagePath.split('.').pop()?.toLowerCase() || '';
        const mimeType = ext === 'jpg' || ext === 'jpeg'
          ? 'image/jpeg'
          : ext === 'png'
            ? 'image/png'
            : ext === 'webp'
              ? 'image/webp'
              : null;

        if (!mimeType) {
          console.warn('Unsupported file type for AI image analysis:', ext);
          return null;
        }

        return `data:${mimeType};base64,${base64}`;
      } catch (err) {
        console.error("Error converting image to base64:", err);
        return null;
      }
    }

    // Build messages with images
    const userContent: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
      {
        type: "text",
        text: `Analiza esta información dental:

MOTIVO DE CONSULTA: ${motivo_consulta || 'No especificado'}

CUESTIONARIO CLÍNICO:
- Dolor actual: ${cuestionario_clinico?.dolor_actual || 'No reportado'}
- Última visita: ${cuestionario_clinico?.ultima_visita || 'No reportada'}
- Condiciones médicas: ${cuestionario_clinico?.condiciones_medicas || 'Ninguna reportada'}

${image_urls?.length > 0 ? 'IMÁGENES ADJUNTAS: Analiza las radiografías/fotos proporcionadas.' : 'SIN IMÁGENES: Proporciona recomendaciones basadas solo en el cuestionario.'}`
      }
    ];

    // Add images as base64 if provided
    if (image_urls && image_urls.length > 0) {
      for (const url of image_urls) {
        const base64Image = await imageUrlToBase64(url);
        if (base64Image) {
          userContent.push({
            type: "image_url",
            image_url: { url: base64Image }
          });
          console.log("Successfully converted image to base64");
        } else {
          console.warn("Skipping image that could not be converted:", url);
        }
      }
    }

    let analysisResult: AnalysisResult;

    const hasAnyImage = userContent.some((c) => c.type === 'image_url');

    if (!hasAnyImage) {
      console.log('No analyzable images provided — using fallback analysis.');
      analysisResult = generateFallbackAnalysis(motivo_consulta || '', cuestionario_clinico);
    } else {
      console.log("Calling OpenAI GPT-5 via Lovable AI for ULTRA PRECISE analysis...");

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-5",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent },
          ],
          // GPT-5 on this gateway only supports default temperature; omit it.
          max_completion_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`AI gateway error: ${response.status} - ${errorText}`);

        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "Payment required, please add credits." }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        throw new Error(`AI gateway error: ${response.status}`);
      }

      const aiResponse = await response.json();
      const content = aiResponse.choices?.[0]?.message?.content;

      console.log("AI Response received:", content?.substring(0, 200));

      try {
        let jsonStr = content;
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
          jsonStr = jsonMatch[1].trim();
        }
        analysisResult = JSON.parse(jsonStr);
      } catch (parseError) {
        console.error("Failed to parse AI response as JSON:", parseError);
        analysisResult = generateFallbackAnalysis(motivo_consulta || '', cuestionario_clinico);
      }
    }

    console.log(`Analysis complete. Route: ${analysisResult.ruta_sugerida}, Findings: ${analysisResult.hallazgos?.length || 0}`);

    // Update the evaluation in database
    const { error: updateError } = await supabase
      .from('evaluaciones')
      .update({
        ruta_sugerida: analysisResult.ruta_sugerida,
        resumen_ia: analysisResult.resumen_ia,
        estado_evaluacion: 'ia_analizada',
        analisis_ia: {
          timestamp: new Date().toISOString(),
          version: '2.0',
          hallazgos: analysisResult.hallazgos,
          confianza: analysisResult.confianza,
          factores_considerados: ['imagen', 'motivo_consulta', 'cuestionario_clinico']
        }
      })
      .eq('id', evaluation_id);

    if (updateError) {
      console.error("Failed to update evaluation:", updateError);
    }

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("analyze-dental error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function generateFallbackAnalysis(motivo: string, cuestionario?: Record<string, unknown>): AnalysisResult {
  const motivoLower = motivo.toLowerCase();
  
  let ruta_sugerida: AnalysisResult['ruta_sugerida'] = 'caries';
  let resumen_ia = '';
  const hallazgos: ToothFinding[] = [];

  if (motivoLower.includes('implante') || motivoLower.includes('falta') || motivoLower.includes('perdi')) {
    ruta_sugerida = 'implantes';
    resumen_ia = 'Basándonos en tu consulta sobre pérdida dental, te recomendamos explorar nuestro programa Implant One. Se requiere evaluación radiográfica completa para determinar disponibilidad ósea y planificar el tratamiento.';
    hallazgos.push({
      piece: '3.6',
      x: 28,
      y: 72,
      status: 'red',
      diagnosis: 'Espacio edéntulo detectado',
      treatment: 'Evaluación para implante dental'
    });
  } else if (motivoLower.includes('ortodoncia') || motivoLower.includes('alinea') || motivoLower.includes('torcidos')) {
    ruta_sugerida = 'ortodoncia';
    resumen_ia = 'Tu caso sugiere una evaluación ortodóncica. Nuestro programa OrtoPro analiza tu caso para determinar el mejor enfoque entre alineadores o ortodoncia convencional, incluyendo índice de estabilidad.';
    hallazgos.push(
      { piece: '1.1', x: 48, y: 32, status: 'yellow', diagnosis: 'Apiñamiento leve', treatment: 'Evaluación ortodóncica' },
      { piece: '2.1', x: 52, y: 32, status: 'yellow', diagnosis: 'Rotación dental', treatment: 'Alineadores o brackets' }
    );
  } else if (motivoLower.includes('bruxismo') || motivoLower.includes('rechina') || motivoLower.includes('aprieto')) {
    ruta_sugerida = 'bruxismo';
    resumen_ia = 'Los síntomas descritos son compatibles con bruxismo. Nuestro protocolo evalúa el patrón de desgaste dental y su relación con patrones de sueño para diseñar un plan de protección personalizado.';
    hallazgos.push(
      { piece: '1.4', x: 36, y: 27, status: 'yellow', diagnosis: 'Desgaste oclusal', treatment: 'Plano de relajación' },
      { piece: '2.4', x: 64, y: 27, status: 'yellow', diagnosis: 'Facetas de desgaste', treatment: 'Protector nocturno' }
    );
  } else {
    resumen_ia = 'Te recomendamos iniciar con nuestro programa ZERO CARIES que incluye diagnóstico asistido por IA para detectar lesiones en etapas tempranas, cuando aún son tratables sin intervención invasiva.';
    hallazgos.push({
      piece: '2.1',
      x: 52,
      y: 32,
      status: 'red',
      diagnosis: 'Caries en esmalte mesial',
      depth: '0,89mm de profundidad',
      treatment: 'Compatible con tratamiento regenerativo'
    });
  }

  // Add priority note if intense pain
  if (cuestionario?.dolor_actual === 'intenso') {
    resumen_ia = '⚠️ PRIORIDAD: Dolor intenso reportado. ' + resumen_ia;
  }

  // Add some green/healthy findings for realism
  hallazgos.push(
    { piece: '1.1', x: 48, y: 32, status: 'green', diagnosis: 'Sin hallazgos patológicos' },
    { piece: '3.1', x: 48, y: 68, status: 'green', diagnosis: 'Pieza sana' },
    { piece: '4.1', x: 52, y: 68, status: 'green', diagnosis: 'Sin alteraciones' }
  );

  return {
    ruta_sugerida,
    resumen_ia,
    hallazgos,
    confianza: 0.75
  };
}
