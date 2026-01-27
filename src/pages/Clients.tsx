import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Building2, Mail, Phone, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { useClients, useDeleteClient, useClientQuotesCount } from '@/hooks/useClients';
import { toast } from '@/hooks/use-toast';
import type { Client } from '@/types/database';

function DeleteClientDialog({ 
  client, 
  open, 
  onOpenChange 
}: { 
  client: Client | null; 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  const { data: quotesCount = 0 } = useClientQuotesCount(client?.id ?? '');
  const deleteClient = useDeleteClient();

  const handleDelete = async () => {
    if (!client) return;
    
    try {
      await deleteClient.mutateAsync(client.id);
      toast({ title: 'Cliente eliminato', description: `${client.company_name} è stato eliminato` });
      onOpenChange(false);
    } catch (error: any) {
      if (error.message?.includes('violates foreign key constraint')) {
        toast({ 
          title: 'Impossibile eliminare', 
          description: 'Questo cliente ha preventivi associati. Elimina prima i preventivi.',
          variant: 'destructive'
        });
      } else {
        toast({ title: 'Errore', description: 'Impossibile eliminare il cliente', variant: 'destructive' });
      }
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminare {client?.company_name}?</AlertDialogTitle>
          <AlertDialogDescription>
            {quotesCount > 0 ? (
              <span className="text-destructive font-medium">
                Attenzione: questo cliente ha {quotesCount} preventivi associati. 
                Non sarà possibile eliminarlo finché non vengono rimossi i preventivi.
              </span>
            ) : (
              'Questa azione è irreversibile. Il cliente verrà eliminato definitivamente.'
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annulla</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete}
            disabled={quotesCount > 0}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Elimina
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function Clients() {
  const { data: clients = [], isLoading } = useClients();
  const [search, setSearch] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; client: Client | null }>({
    open: false,
    client: null,
  });

  const filteredClients = clients.filter(client => 
    client.company_name.toLowerCase().includes(search.toLowerCase()) ||
    client.email?.toLowerCase().includes(search.toLowerCase()) ||
    client.vat_number?.includes(search)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clienti</h1>
          <p className="text-muted-foreground">Gestisci la tua anagrafica clienti</p>
        </div>
        <Button asChild className="gradient-primary border-0">
          <Link to="/clients/new">
            <Plus className="w-4 h-4 mr-2" />
            Nuovo Cliente
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Cerca per nome, email o P.IVA..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Clients Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Caricamento...</div>
      ) : filteredClients.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              {search ? 'Nessun cliente trovato' : 'Nessun cliente ancora'}
            </p>
            {!search && (
              <Button asChild className="mt-4" variant="outline">
                <Link to="/clients/new">Aggiungi il primo cliente</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <Card key={client.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{client.company_name}</CardTitle>
                      {client.contact_person && (
                        <p className="text-sm text-muted-foreground">{client.contact_person}</p>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={`/clients/${client.id}/edit`}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Modifica
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => setDeleteDialog({ open: true, client })}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Elimina
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {client.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{client.email}</span>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    <span>{client.phone}</span>
                  </div>
                )}
                {client.city && (
                  <p className="text-sm text-muted-foreground">
                    {client.city}{client.province ? ` (${client.province})` : ''}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <DeleteClientDialog 
        client={deleteDialog.client}
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
      />
    </div>
  );
}
