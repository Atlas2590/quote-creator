import { Link, useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { ArrowLeft, Pencil, Download, Building2, Calendar, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useQuote, useQuoteItems, useUpdateQuoteStatus } from '@/hooks/useQuotes';
import { QuoteStatusSelect } from '@/components/quotes/QuoteStatusSelect';
import { toast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import type { QuoteStatus } from '@/types/database';

export default function QuoteDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: quote, isLoading } = useQuote(id);
  const { data: items = [] } = useQuoteItems(id);
  const updateStatus = useUpdateQuoteStatus();

  const handleStatusChange = async (status: QuoteStatus) => {
    if (!id) return;
    try {
      await updateStatus.mutateAsync({ id, status });
      toast({ title: 'Stato aggiornato' });
    } catch (error) {
      toast({ title: 'Errore', description: 'Impossibile aggiornare lo stato', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return <div className="text-center py-12 text-muted-foreground">Caricamento...</div>;
  }

  if (!quote) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Preventivo non trovato</p>
        <Button asChild className="mt-4" variant="outline">
          <Link to="/quotes">Torna ai preventivi</Link>
        </Button>
      </div>
    );
  }

  const validUntil = quote.validity_days 
    ? new Date(new Date(quote.quote_date).getTime() + quote.validity_days * 24 * 60 * 60 * 1000)
    : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/quotes')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Preventivo #{quote.quote_number}
            </h1>
            <p className="text-muted-foreground">
              Creato il {format(new Date(quote.created_at), 'dd MMMM yyyy', { locale: it })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <QuoteStatusSelect value={quote.status} onValueChange={handleStatusChange} />
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Esporta
          </Button>
          <Button asChild className="gradient-primary border-0">
            <Link to={`/quotes/${id}/edit`}>
              <Pencil className="w-4 h-4 mr-2" />
              Modifica
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>Articoli</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrizione</TableHead>
                    <TableHead className="text-right">Qtà</TableHead>
                    <TableHead className="text-right">Prezzo Unit.</TableHead>
                    <TableHead className="text-right">Totale</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(Number(item.unit_price))}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(Number(item.quantity) * Number(item.unit_price))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <Separator className="my-4" />
              
              <div className="flex justify-end">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Totale Preventivo</p>
                  <p className="text-3xl font-bold text-foreground">
                    {formatCurrency(Number(quote.total_amount))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {quote.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Note</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{quote.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Client info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-semibold text-foreground">{quote.client?.company_name}</p>
              {quote.client?.address && (
                <p className="text-sm text-muted-foreground">{quote.client.address}</p>
              )}
              {quote.client?.city && (
                <p className="text-sm text-muted-foreground">
                  {quote.client.postal_code} {quote.client.city} 
                  {quote.client.province && ` (${quote.client.province})`}
                </p>
              )}
              {quote.client?.vat_number && (
                <p className="text-sm text-muted-foreground">P.IVA: {quote.client.vat_number}</p>
              )}
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Data preventivo</span>
                <span className="text-sm font-medium">
                  {format(new Date(quote.quote_date), 'dd/MM/yyyy')}
                </span>
              </div>
              {validUntil && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Valido fino al</span>
                  <span className="text-sm font-medium">
                    {format(validUntil, 'dd/MM/yyyy')}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Validità</span>
                <span className="text-sm font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {quote.validity_days} giorni
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
