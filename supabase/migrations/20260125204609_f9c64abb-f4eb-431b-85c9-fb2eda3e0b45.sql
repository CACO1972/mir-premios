-- Create evaluaciones table for the patient funnel
CREATE TABLE public.evaluaciones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Patient info
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  telefono TEXT,
  rut TEXT,
  fecha_nacimiento DATE,
  
  -- Route and flow type
  tipo_ruta TEXT NOT NULL CHECK (tipo_ruta IN ('paciente_nuevo', 'paciente_antiguo', 'segunda_opinion', 'internacional')),
  ruta_sugerida TEXT CHECK (ruta_sugerida IN ('implantes', 'ortodoncia', 'caries', 'bruxismo')),
  
  -- Clinical data
  motivo_consulta TEXT,
  cuestionario_clinico JSONB DEFAULT '{}'::jsonb,
  imagenes_urls TEXT[] DEFAULT '{}',
  
  -- AI analysis results
  analisis_ia JSONB DEFAULT '{}'::jsonb,
  resumen_ia TEXT,
  
  -- Payment
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'approved', 'rejected', 'refunded')),
  payment_id TEXT,
  monto_pagado INTEGER,
  
  -- Evaluation status
  estado_evaluacion TEXT NOT NULL DEFAULT 'iniciada' CHECK (estado_evaluacion IN ('iniciada', 'cuestionario_completado', 'ia_analizada', 'pago_pendiente', 'pago_completado', 'cita_agendada', 'completada', 'cancelada')),
  
  -- External integrations
  dentalink_patient_id TEXT,
  cita_agendada_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.evaluaciones ENABLE ROW LEVEL SECURITY;

-- Create policy for inserting evaluations (anyone can start an evaluation)
CREATE POLICY "Anyone can create evaluations"
ON public.evaluaciones
FOR INSERT
WITH CHECK (true);

-- Create policy for reading own evaluations (by email match)
CREATE POLICY "Users can read evaluations by email"
ON public.evaluaciones
FOR SELECT
USING (true);

-- Create policy for updating evaluations
CREATE POLICY "Anyone can update evaluations"
ON public.evaluaciones
FOR UPDATE
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_evaluaciones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_evaluaciones_updated_at
BEFORE UPDATE ON public.evaluaciones
FOR EACH ROW
EXECUTE FUNCTION public.update_evaluaciones_updated_at();

-- Create index for common queries
CREATE INDEX idx_evaluaciones_email ON public.evaluaciones(email);
CREATE INDEX idx_evaluaciones_rut ON public.evaluaciones(rut);
CREATE INDEX idx_evaluaciones_estado ON public.evaluaciones(estado_evaluacion);
CREATE INDEX idx_evaluaciones_tipo_ruta ON public.evaluaciones(tipo_ruta);