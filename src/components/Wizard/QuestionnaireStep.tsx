import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import type { RouteType, EvaluacionData } from './types';

interface QuestionnaireStepProps {
  routeType: RouteType;
  onComplete: (evaluationId: string, data: Partial<EvaluacionData>) => void;
  onError: (error: string) => void;
}

const QuestionnaireStep = ({ routeType, onComplete, onError }: QuestionnaireStepProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    motivo_consulta: '',
    dolor_actual: '',
    ultima_visita: '',
    condiciones_medicas: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const evaluacionData: Partial<EvaluacionData> = {
        nombre: formData.nombre,
        email: formData.email,
        telefono: formData.telefono || undefined,
        tipo_ruta: routeType,
        motivo_consulta: formData.motivo_consulta,
        cuestionario_clinico: {
          dolor_actual: formData.dolor_actual,
          ultima_visita: formData.ultima_visita,
          condiciones_medicas: formData.condiciones_medicas
        },
        payment_status: 'pending',
        estado_evaluacion: 'iniciada'
      };

      const { data, error } = await supabase
        .from('evaluaciones')
        .insert([{
          nombre: evaluacionData.nombre!,
          email: evaluacionData.email!,
          telefono: evaluacionData.telefono,
          tipo_ruta: evaluacionData.tipo_ruta!,
          motivo_consulta: evaluacionData.motivo_consulta,
          cuestionario_clinico: evaluacionData.cuestionario_clinico,
          payment_status: 'pending' as const,
          estado_evaluacion: 'iniciada' as const
        }])
        .select('id')
        .single();

      if (error) throw error;

      // Update estado to cuestionario_completado
      await supabase
        .from('evaluaciones')
        .update({ estado_evaluacion: 'cuestionario_completado' })
        .eq('id', data.id);

      onComplete(data.id, evaluacionData);
    } catch (err) {
      console.error('Error creating evaluation:', err);
      onError('Error al guardar el cuestionario. Por favor, intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-2xl mx-auto"
    >
      <div className="text-center mb-8">
        <span className="inline-block px-4 py-1.5 bg-gold/10 border border-gold/30 rounded-full text-gold text-sm font-medium mb-4">
          Paso 1 de 4
        </span>
        <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-2">
          Cuéntanos sobre ti
        </h2>
        <p className="text-cream-muted">
          Esta información nos ayudará a preparar tu evaluación
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre completo *</Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Tu nombre"
              required
              className="bg-card border-border"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="tu@email.com"
              required
              className="bg-card border-border"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="telefono">Teléfono (opcional)</Label>
          <Input
            id="telefono"
            type="tel"
            value={formData.telefono}
            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
            placeholder="+56 9 1234 5678"
            className="bg-card border-border"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="motivo">¿Cuál es el motivo principal de tu consulta? *</Label>
          <Textarea
            id="motivo"
            value={formData.motivo_consulta}
            onChange={(e) => setFormData({ ...formData, motivo_consulta: e.target.value })}
            placeholder="Describe brevemente qué te gustaría evaluar o resolver..."
            required
            className="bg-card border-border min-h-[100px]"
          />
        </div>

        <div className="space-y-3">
          <Label>¿Tienes dolor actualmente?</Label>
          <RadioGroup
            value={formData.dolor_actual}
            onValueChange={(value) => setFormData({ ...formData, dolor_actual: value })}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="dolor-no" />
              <Label htmlFor="dolor-no" className="cursor-pointer">No</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="leve" id="dolor-leve" />
              <Label htmlFor="dolor-leve" className="cursor-pointer">Leve</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="moderado" id="dolor-moderado" />
              <Label htmlFor="dolor-moderado" className="cursor-pointer">Moderado</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="intenso" id="dolor-intenso" />
              <Label htmlFor="dolor-intenso" className="cursor-pointer">Intenso</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-3">
          <Label>¿Cuándo fue tu última visita al dentista?</Label>
          <RadioGroup
            value={formData.ultima_visita}
            onValueChange={(value) => setFormData({ ...formData, ultima_visita: value })}
            className="flex flex-wrap gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="menos_6_meses" id="visita-6" />
              <Label htmlFor="visita-6" className="cursor-pointer">Menos de 6 meses</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="6_12_meses" id="visita-12" />
              <Label htmlFor="visita-12" className="cursor-pointer">6-12 meses</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="mas_1_ano" id="visita-1" />
              <Label htmlFor="visita-1" className="cursor-pointer">Más de 1 año</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="condiciones">Condiciones médicas relevantes (opcional)</Label>
          <Textarea
            id="condiciones"
            value={formData.condiciones_medicas}
            onChange={(e) => setFormData({ ...formData, condiciones_medicas: e.target.value })}
            placeholder="Ej: diabetes, hipertensión, medicamentos actuales..."
            className="bg-card border-border"
          />
        </div>

        {/* Image upload placeholder */}
        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
          <Upload className="w-8 h-8 text-cream-muted mx-auto mb-2" />
          <p className="text-cream-muted text-sm">
            Sube fotos de tu boca o radiografías (opcional)
          </p>
          <p className="text-muted-foreground text-xs mt-1">
            JPG, PNG o PDF hasta 10MB
          </p>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90 h-12"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              Continuar
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </form>
    </motion.div>
  );
};

export default QuestionnaireStep;
