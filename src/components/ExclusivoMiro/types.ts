export interface ServiceModule {
  id: string;
  routeKey: string;
  name: string;
  tagline?: string;
  fadeText: string;
  modalCopy: string;
  disclaimer?: string;
}

export const exclusivoModules: ServiceModule[] = [
  {
    id: 'implant-one',
    routeKey: 'implants',
    name: 'Implant One',
    fadeText: 'Diagnóstico, planificación y ejecución en un solo flujo. Carga inmediata solo si es técnicamente y biológicamente viable.',
    modalCopy: 'Implant One integra 25 años de experiencia clínica con planificación digital e IA. Si la carga inmediata no es recomendable, el paciente igual sale con una solución provisional estética y funcional.',
    disclaimer: 'La carga inmediata está sujeta a viabilidad clínica y biológica de cada caso.',
  },
  {
    id: 'revive-face-smile',
    routeKey: 'dentofacial',
    name: 'Revive FACE.SMILE™',
    tagline: 'Recupera. Repara. Rejuvenece.',
    fadeText: 'No diseñamos solo dientes: diseñamos el rostro completo. IA dentofacial analiza proporciones faciales y dentales.',
    modalCopy: 'Integra estética dental y facial con análisis IA para un plan único, natural y medible.',
  },
  {
    id: 'align',
    routeKey: 'ortho',
    name: 'ALIGN',
    fadeText: 'Alineadores u ortodoncia convencional según lo que tu caso realmente necesita. Plan medible, estético y personalizado.',
    modalCopy: 'Priorizamos biología, estética facial y estabilidad a largo plazo.',
  },
  {
    id: 'zero-caries',
    routeKey: 'caries',
    name: 'ZERO CARIES',
    fadeText: 'Detectamos y tratamos caries antes de que duelan. Diagnóstico asistido por IA y enfoque regenerativo con Curodont.',
    modalCopy: 'Intervención temprana y mínimamente invasiva cuando el caso lo permite.',
  },
];

export const routeKeyToModule: Record<string, ServiceModule> = exclusivoModules.reduce(
  (acc, module) => ({ ...acc, [module.routeKey]: module }),
  {}
);