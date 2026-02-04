-- Create enum type for funnel stages
CREATE TYPE funnel_stage AS ENUM ('LEAD', 'IA_DONE', 'CHECKOUT_CREATED', 'PAID', 'SCHEDULED', 'COMPLETED', 'CANCELLED');

-- Create funnel_leads table
CREATE TABLE public.funnel_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Contact info
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  telefono TEXT,
  rut TEXT,
  
  -- Lead source and context
  origen TEXT DEFAULT 'web',
  motivo_consulta TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  
  -- Funnel state
  stage funnel_stage NOT NULL DEFAULT 'LEAD',
  stage_changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- IA analysis results
  ia_scan_completed_at TIMESTAMP WITH TIME ZONE,
  ia_ruta_sugerida TEXT,
  ia_resumen TEXT,
  ia_hallazgos JSONB DEFAULT '[]'::jsonb,
  
  -- Payment info
  checkout_url TEXT,
  checkout_created_at TIMESTAMP WITH TIME ZONE,
  payment_id TEXT,
  payment_status TEXT DEFAULT 'pending',
  monto_pagado INTEGER,
  paid_at TIMESTAMP WITH TIME ZONE,
  
  -- Scheduling
  cita_agendada_at TIMESTAMP WITH TIME ZONE,
  dentalink_patient_id TEXT,
  dentalink_appointment_id TEXT,
  
  -- Linked evaluation (optional, for backwards compatibility)
  evaluacion_id UUID REFERENCES public.evaluaciones(id),
  
  -- Notification tracking
  last_notification_sent_at TIMESTAMP WITH TIME ZONE,
  notifications_sent JSONB DEFAULT '[]'::jsonb
);

-- Enable RLS
ALTER TABLE public.funnel_leads ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can create leads" 
ON public.funnel_leads 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Service role can do everything" 
ON public.funnel_leads 
FOR ALL 
USING (true);

CREATE POLICY "Users can read their own leads by email" 
ON public.funnel_leads 
FOR SELECT 
USING (true);

-- Create indexes for common queries
CREATE INDEX idx_funnel_leads_email ON public.funnel_leads(email);
CREATE INDEX idx_funnel_leads_stage ON public.funnel_leads(stage);
CREATE INDEX idx_funnel_leads_created_at ON public.funnel_leads(created_at DESC);
CREATE INDEX idx_funnel_leads_rut ON public.funnel_leads(rut) WHERE rut IS NOT NULL;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_funnel_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for updated_at
CREATE TRIGGER update_funnel_leads_updated_at
BEFORE UPDATE ON public.funnel_leads
FOR EACH ROW
EXECUTE FUNCTION public.update_funnel_leads_updated_at();

-- Function to handle stage transitions
CREATE OR REPLACE FUNCTION public.handle_funnel_stage_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if stage actually changed
  IF OLD.stage IS DISTINCT FROM NEW.stage THEN
    NEW.stage_changed_at = now();
    
    -- Set timestamps based on new stage
    CASE NEW.stage
      WHEN 'IA_DONE' THEN
        NEW.ia_scan_completed_at = COALESCE(NEW.ia_scan_completed_at, now());
      WHEN 'CHECKOUT_CREATED' THEN
        NEW.checkout_created_at = COALESCE(NEW.checkout_created_at, now());
      WHEN 'PAID' THEN
        NEW.paid_at = COALESCE(NEW.paid_at, now());
      WHEN 'SCHEDULED' THEN
        NEW.cita_agendada_at = COALESCE(NEW.cita_agendada_at, now());
      ELSE
        -- No special handling for other stages
    END CASE;
    
    -- Log stage transition in notifications_sent
    NEW.notifications_sent = COALESCE(NEW.notifications_sent, '[]'::jsonb) || 
      jsonb_build_object(
        'type', 'stage_change',
        'from_stage', OLD.stage,
        'to_stage', NEW.stage,
        'timestamp', now()
      );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for stage changes
CREATE TRIGGER handle_funnel_stage_change
BEFORE UPDATE ON public.funnel_leads
FOR EACH ROW
EXECUTE FUNCTION public.handle_funnel_stage_change();

-- Function to validate stage transitions (optional, prevents invalid transitions)
CREATE OR REPLACE FUNCTION public.validate_funnel_stage_transition()
RETURNS TRIGGER AS $$
DECLARE
  valid_transitions JSONB := '{
    "LEAD": ["IA_DONE", "CANCELLED"],
    "IA_DONE": ["CHECKOUT_CREATED", "CANCELLED"],
    "CHECKOUT_CREATED": ["PAID", "CANCELLED"],
    "PAID": ["SCHEDULED", "CANCELLED"],
    "SCHEDULED": ["COMPLETED", "CANCELLED"],
    "COMPLETED": [],
    "CANCELLED": []
  }'::jsonb;
  allowed_next_stages JSONB;
BEGIN
  -- Skip validation for new records
  IF TG_OP = 'INSERT' THEN
    RETURN NEW;
  END IF;
  
  -- Skip if stage hasn't changed
  IF OLD.stage = NEW.stage THEN
    RETURN NEW;
  END IF;
  
  -- Get allowed transitions for current stage
  allowed_next_stages := valid_transitions->OLD.stage::text;
  
  -- Check if transition is valid
  IF NOT (allowed_next_stages ? NEW.stage::text) THEN
    RAISE EXCEPTION 'Invalid stage transition from % to %', OLD.stage, NEW.stage;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for validation (runs before stage change handler)
CREATE TRIGGER validate_funnel_stage_transition
BEFORE UPDATE ON public.funnel_leads
FOR EACH ROW
EXECUTE FUNCTION public.validate_funnel_stage_transition();

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.funnel_leads;