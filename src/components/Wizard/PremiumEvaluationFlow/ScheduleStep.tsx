import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface TimeSlot {
  date: string;
  times: string[];
}

interface ScheduleStepProps {
  evaluationId: string;
  patientId: string | null;
  isProcessing: boolean;
  onSchedule: (date: string, time: string) => void;
}

const ScheduleStep = ({
  evaluationId,
  patientId,
  isProcessing,
  onSchedule,
}: ScheduleStepProps) => {
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  useEffect(() => {
    fetchAvailableSlots();
  }, []);

  const fetchAvailableSlots = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('dentalink-integration', {
        body: {
          action: 'get-available-slots',
          evaluation_id: evaluationId,
        },
      });

      if (error) throw error;

      if (data?.slots) {
        setAvailableSlots(data.slots);
      }
    } catch (err) {
      console.error('Error fetching slots:', err);
      // Fallback to mock slots if API fails
      const today = new Date();
      const mockSlots: TimeSlot[] = [];
      for (let i = 1; i <= 5; i++) {
        const date = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
        if (date.getDay() !== 0 && date.getDay() !== 6) {
          mockSlots.push({
            date: date.toISOString().split('T')[0],
            times: ['10:00', '11:00', '15:00', '16:00'],
          });
        }
      }
      setAvailableSlots(mockSlots);
    } finally {
      setLoadingSlots(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
  };

  const handleConfirm = () => {
    if (selectedDate && selectedTime) {
      onSchedule(selectedDate, selectedTime);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gold/10 flex items-center justify-center">
          <Calendar className="w-8 h-8 text-gold" />
        </div>
        <h3 className="font-serif text-xl text-foreground mb-2">Agenda tu Cita</h3>
        <p className="text-cream-muted">
          Selecciona el día y hora que más te acomode
        </p>
      </div>

      {loadingSlots ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 text-gold animate-spin" />
        </div>
      ) : (
        <>
          {/* Date selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Fecha</label>
            <div className="grid grid-cols-3 gap-2">
              {availableSlots.map((slot) => (
                <button
                  key={slot.date}
                  onClick={() => {
                    setSelectedDate(slot.date);
                    setSelectedTime(null);
                  }}
                  className={`p-3 border rounded-lg transition-colors text-sm ${
                    selectedDate === slot.date
                      ? 'border-gold bg-gold/10 text-gold'
                      : 'border-border hover:border-gold/50 hover:bg-gold/5 text-foreground'
                  }`}
                >
                  {formatDate(slot.date)}
                </button>
              ))}
            </div>
          </div>

          {/* Time selection */}
          {selectedDate && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <label className="text-sm font-medium text-foreground">Hora</label>
              <div className="grid grid-cols-4 gap-2">
                {availableSlots
                  .find((s) => s.date === selectedDate)
                  ?.times.map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`p-3 border rounded-lg transition-colors text-sm ${
                        selectedTime === time
                          ? 'border-gold bg-gold/10 text-gold'
                          : 'border-border hover:border-gold/50 hover:bg-gold/5 text-foreground'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
              </div>
            </motion.div>
          )}

          {/* Selection summary */}
          {selectedDate && selectedTime && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-secondary/50 rounded-lg p-4"
            >
              <div className="flex items-center gap-2 text-foreground">
                <CheckCircle className="w-5 h-5 text-accent" />
                <span>
                  {formatDate(selectedDate)} a las {selectedTime}
                </span>
              </div>
            </motion.div>
          )}
        </>
      )}

      <Button
        onClick={handleConfirm}
        disabled={isProcessing || !selectedDate || !selectedTime}
        className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90 h-12"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Confirmando cita...
          </>
        ) : (
          <>
            <Calendar className="w-4 h-4 mr-2" />
            Confirmar Cita
          </>
        )}
      </Button>
    </motion.div>
  );
};

export default ScheduleStep;
