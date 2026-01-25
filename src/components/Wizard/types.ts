export type RouteType = 'paciente_nuevo' | 'paciente_antiguo' | 'segunda_opinion' | 'internacional';
export type RutaSugerida = 'implantes' | 'ortodoncia' | 'caries' | 'bruxismo';
export type PaymentStatus = 'pending' | 'approved' | 'rejected' | 'refunded';
export type EstadoEvaluacion = 'iniciada' | 'cuestionario_completado' | 'ia_analizada' | 'pago_pendiente' | 'pago_completado' | 'cita_agendada' | 'completada' | 'cancelada';

export interface EvaluacionData {
  id?: string;
  nombre: string;
  email: string;
  telefono?: string;
  rut?: string;
  fecha_nacimiento?: string;
  tipo_ruta: RouteType;
  ruta_sugerida?: RutaSugerida;
  motivo_consulta?: string;
  cuestionario_clinico?: Record<string, unknown>;
  imagenes_urls?: string[];
  analisis_ia?: Record<string, unknown>;
  resumen_ia?: string;
  payment_status: PaymentStatus;
  payment_id?: string;
  monto_pagado?: number;
  estado_evaluacion: EstadoEvaluacion;
  dentalink_patient_id?: string;
}

export interface WizardState {
  currentStep: number;
  routeType: RouteType | null;
  evaluationId: string | null;
  evaluacionData: Partial<EvaluacionData>;
  rutaSugerida: RutaSugerida | null;
  resumenIA: string | null;
  isLoading: boolean;
  error: string | null;
}

export const initialWizardState: WizardState = {
  currentStep: 0,
  routeType: null,
  evaluationId: null,
  evaluacionData: {},
  rutaSugerida: null,
  resumenIA: null,
  isLoading: false,
  error: null
};

export const rutaExplanations: Record<RutaSugerida, { title: string; description: string; features: string[] }> = {
  implantes: {
    title: 'Implant One',
    description: 'Diagnóstico, planificación y ejecución integrados con predicción de encía y hueso.',
    features: ['Planificación digital con IA', 'Predicción de resultado estético', 'Carga inmediata cuando es viable']
  },
  ortodoncia: {
    title: 'OrtoPro',
    description: 'Plan ortodóncico con índice de estabilidad A/B/C para predecir retención.',
    features: ['Análisis facial 3D', 'Simulación de resultado', 'Índice de estabilidad personalizado']
  },
  caries: {
    title: 'Cero Caries',
    description: 'Detección temprana y tratamiento sin taladro cuando es posible.',
    features: ['Diagnóstico IA de caries incipientes', 'Tratamiento con Curodont', 'Enfoque regenerativo']
  },
  bruxismo: {
    title: 'Bruxismo-Sueño',
    description: 'Evaluación integral del bruxismo y su relación con el sueño.',
    features: ['Análisis de desgaste dental', 'Evaluación de patrones de sueño', 'Plan de protección personalizado']
  }
};
