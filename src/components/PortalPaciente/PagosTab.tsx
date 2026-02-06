import { motion } from 'framer-motion';
import { CreditCard, CheckCircle2, Clock, XCircle, Receipt, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Pago {
  id: string;
  payment_status: string | null;
  monto_pagado: number | null;
  paid_at: string | null;
  checkout_url: string | null;
  ia_ruta_sugerida: string | null;
  created_at: string;
}

interface PagosTabProps {
  pagos: Pago[];
  isLoading: boolean;
}

const getPaymentStatusConfig = (status: string | null) => {
  const configs: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode; color: string }> = {
    'approved': { label: 'Aprobado', variant: 'default', icon: <CheckCircle2 className="h-4 w-4" />, color: 'text-green-500' },
    'pending': { label: 'Pendiente', variant: 'outline', icon: <Clock className="h-4 w-4" />, color: 'text-yellow-500' },
    'rejected': { label: 'Rechazado', variant: 'destructive', icon: <XCircle className="h-4 w-4" />, color: 'text-destructive' },
    'refunded': { label: 'Reembolsado', variant: 'secondary', icon: <Receipt className="h-4 w-4" />, color: 'text-blue-500' },
  };
  return configs[status || 'pending'] || configs['pending'];
};

const getRutaLabel = (ruta: string | null) => {
  if (!ruta) return 'Evaluación General';
  const labels: Record<string, string> = {
    'implantes': 'Evaluación Implant One',
    'ortodoncia': 'Evaluación OrtoPro',
    'caries': 'Evaluación Cero Caries',
    'bruxismo': 'Evaluación Bruxismo-Sueño',
    'estetica': 'Evaluación Estética Dental',
    'dentofacial': 'Evaluación Revive FACE.SMILE™'
  };
  return labels[ruta] || 'Evaluación General';
};

const formatCurrency = (amount: number | null) => {
  if (!amount) return '-';
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0
  }).format(amount);
};

const PagosTab = ({ pagos, isLoading }: PagosTabProps) => {
  const totalPagado = pagos
    .filter(p => p.payment_status === 'approved')
    .reduce((sum, p) => sum + (p.monto_pagado || 0), 0);

  const pagosPendientes = pagos.filter(p => p.payment_status === 'pending');

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <CardHeader className="pb-2">
              <CardDescription className="text-green-600">Total pagado</CardDescription>
              <CardTitle className="text-3xl text-green-600">
                {formatCurrency(totalPagado)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {pagos.filter(p => p.payment_status === 'approved').length} pago(s) confirmado(s)
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className={pagosPendientes.length > 0 
            ? "bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20"
            : ""
          }>
            <CardHeader className="pb-2">
              <CardDescription className={pagosPendientes.length > 0 ? "text-yellow-600" : ""}>
                Pagos pendientes
              </CardDescription>
              <CardTitle className={`text-3xl ${pagosPendientes.length > 0 ? "text-yellow-600" : ""}`}>
                {pagosPendientes.length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pagosPendientes.length > 0 ? (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="border-yellow-500/50 text-yellow-600 hover:bg-yellow-500/10"
                  onClick={() => {
                    const pendingWithUrl = pagosPendientes.find(p => p.checkout_url);
                    if (pendingWithUrl?.checkout_url) {
                      window.open(pendingWithUrl.checkout_url, '_blank');
                    }
                  }}
                >
                  Completar pago
                  <ExternalLink className="ml-2 h-3 w-3" />
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">Sin pagos pendientes</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Payment History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-gold" />
              Historial de pagos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pagos.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No hay pagos registrados</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Concepto</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagos.map((pago) => {
                    const statusConfig = getPaymentStatusConfig(pago.payment_status);
                    return (
                      <TableRow key={pago.id}>
                        <TableCell className="font-medium">
                          {getRutaLabel(pago.ia_ruta_sugerida)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {pago.paid_at 
                            ? new Date(pago.paid_at).toLocaleDateString('es-CL')
                            : new Date(pago.created_at).toLocaleDateString('es-CL')
                          }
                        </TableCell>
                        <TableCell>{formatCurrency(pago.monto_pagado)}</TableCell>
                        <TableCell>
                          <Badge variant={statusConfig.variant} className="flex items-center gap-1 w-fit">
                            {statusConfig.icon}
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default PagosTab;
