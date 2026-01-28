import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, FileText, MoreHorizontal, Eye, Pencil, Trash2, Download } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useQuotes, useDeleteQuote, useUpdateQuoteStatus } from '@/hooks/useQuotes';
import { useExportQuote } from '@/hooks/useExportQuote';
import { QuoteStatusBadge } from '@/components/quotes/QuoteStatusBadge';
import { QuoteStatusSelect } from '@/components/quotes/QuoteStatusSelect';
import { toast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import type { Quote, QuoteStatus } from '@/types/database';

export default function Quotes() {
  const navigate = useNavigate();
  const { data: quotes = [], isLoading } = useQuotes();
  const deleteQuote = useDeleteQuote();
  const updateStatus = useUpdateQuoteStatus();
  const { exportQuote, isExporting } = useExportQuote();
  const [search, setSearch] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; quote: Quote | null }>({
    open: false,
    quote: null,
  });

  const filteredQuotes = quotes.filter(quote => 
    quote.quote_number.toString().includes(search) ||
    quote.client?.company_name.toLowerCase().includes(search.toLowerCase())
  );

  const handleStatusChange = async (quoteId: string, status: QuoteStatus) => {
    try {
      await updateStatus.mutateAsync({ id: quoteId, status });
      toast({ title: 'Stato aggiornato' });
    } catch (error) {
      toast({ title: 'Errore', description: 'Impossibile aggiornare lo stato', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.quote) return;
    
    try {
      await deleteQuote.mutateAsync(deleteDialog.quote.id);
      toast({ title: 'Preventivo eliminato' });
      setDeleteDialog({ open: false, quote: null });
    } catch (error) {
      toast({ title: 'Errore', description: 'Impossibile eliminare il preventivo', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Preventivi</h1>
          <p className="text-muted-foreground">Gestisci tutti i tuoi preventivi</p>
        </div>
        <Button asChild className="gradient-primary border-0">
          <Link to="/quotes/new">
            <Plus className="w-4 h-4 mr-2" />
            Nuovo Preventivo
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Cerca per numero o cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Caricamento...</div>
      ) : filteredQuotes.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              {search ? 'Nessun preventivo trovato' : 'Nessun preventivo ancora'}
            </p>
            {!search && (
              <Button asChild className="mt-4" variant="outline">
                <Link to="/quotes/new">Crea il primo preventivo</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N°</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="text-right">Importo</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotes.map((quote) => (
                  <TableRow 
                    key={quote.id} 
                    className="cursor-pointer hover:bg-accent/50"
                    onClick={() => navigate(`/quotes/${quote.id}`)}
                  >
                    <TableCell className="font-medium">
                      #{quote.quote_number}
                    </TableCell>
                    <TableCell>
                      {quote.client?.company_name || 'N/D'}
                    </TableCell>
                    <TableCell>
                      {format(new Date(quote.quote_date), 'dd MMM yyyy', { locale: it })}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <QuoteStatusSelect 
                        value={quote.status}
                        onValueChange={(status) => handleStatusChange(quote.id, status)}
                      />
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(Number(quote.total_amount))}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/quotes/${quote.id}`}>
                              <Eye className="w-4 h-4 mr-2" />
                              Visualizza
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={`/quotes/${quote.id}/edit`}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Modifica
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => exportQuote(quote.id)}>
                            <Download className="w-4 h-4 mr-2" />
                            Esporta Word
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => setDeleteDialog({ open: true, quote })}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Elimina
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare questo preventivo?</AlertDialogTitle>
            <AlertDialogDescription>
              Il preventivo #{deleteDialog.quote?.quote_number} verrà eliminato definitivamente. 
              Questa azione è irreversibile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
