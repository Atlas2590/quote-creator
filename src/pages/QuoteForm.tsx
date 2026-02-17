import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useClients } from '@/hooks/useClients';
import { 
  useQuote, 
  useQuoteItems, 
  useCreateQuote, 
  useUpdateQuote,
  useCreateQuoteItem,
  useUpdateQuoteItem,
  useDeleteQuoteItem
} from '@/hooks/useQuotes';
import { toast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';

const quoteItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, 'Descrizione obbligatoria'),
  item_notes: z.string().optional(),
  quantity: z.coerce.number().min(0.01, 'Quantità richiesta'),
  unit_price: z.coerce.number().min(0, 'Prezzo non valido'),
});

const quoteSchema = z.object({
  client_id: z.string().min(1, 'Seleziona un cliente'),
  quote_date: z.string().min(1, 'Data obbligatoria'),
  validity_days: z.coerce.number().min(1).max(365),
  notes: z.string().optional(),
  items: z.array(quoteItemSchema).min(1, 'Aggiungi almeno un articolo'),
});

type QuoteFormData = z.infer<typeof quoteSchema>;

export default function QuoteForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  
  const { data: clients = [] } = useClients();
  const { data: existingQuote, isLoading: quoteLoading } = useQuote(id);
  const { data: existingItems = [], isLoading: itemsLoading } = useQuoteItems(id);
  
  const createQuote = useCreateQuote();
  const updateQuote = useUpdateQuote();
  const createItem = useCreateQuoteItem();
  const updateItem = useUpdateQuoteItem();
  const deleteItem = useDeleteQuoteItem();

  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<QuoteFormData>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      client_id: '',
      quote_date: format(new Date(), 'yyyy-MM-dd'),
      validity_days: 30,
      notes: '',
      items: [{ description: '', item_notes: '', quantity: 1, unit_price: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  useEffect(() => {
    if (existingQuote && existingItems) {
      form.reset({
        client_id: existingQuote.client_id,
        quote_date: existingQuote.quote_date,
        validity_days: existingQuote.validity_days ?? 30,
        notes: existingQuote.notes ?? '',
        items: existingItems.length > 0 
           ? existingItems.map(item => ({
               id: item.id,
               description: item.description,
               item_notes: item.item_notes || '',
               quantity: Number(item.quantity),
               unit_price: Number(item.unit_price),
             }))
           : [{ description: '', item_notes: '', quantity: 1, unit_price: 0 }],
      });
    }
  }, [existingQuote, existingItems, form]);

  const watchedItems = form.watch('items');
  const total = watchedItems.reduce((sum, item) => {
    return sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
  }, 0);

  const onSubmit = async (data: QuoteFormData) => {
    setIsSaving(true);
    try {
      let quoteId = id;

      if (isEditing && id) {
        await updateQuote.mutateAsync({
          id,
          client_id: data.client_id,
          quote_date: data.quote_date,
          validity_days: data.validity_days,
          notes: data.notes || null,
        });

        // Handle items: delete removed, update existing, create new
        const existingIds = existingItems.map(i => i.id);
        const currentIds = data.items.filter(i => i.id).map(i => i.id!);
        
        // Delete removed items
        for (const existingId of existingIds) {
          if (!currentIds.includes(existingId)) {
            await deleteItem.mutateAsync({ id: existingId, quote_id: id });
          }
        }

        // Update or create items
        for (let i = 0; i < data.items.length; i++) {
          const item = data.items[i];
          if (item.id) {
            await updateItem.mutateAsync({
              id: item.id,
              quote_id: id,
              description: item.description,
              item_notes: item.item_notes || '',
              quantity: item.quantity,
              unit_price: item.unit_price,
              sort_order: i,
            });
          } else {
            await createItem.mutateAsync({
              quote_id: id,
              description: item.description,
              item_notes: item.item_notes || '',
              quantity: item.quantity,
              unit_price: item.unit_price,
              sort_order: i,
            });
          }
        }

        toast({ title: 'Preventivo aggiornato' });
      } else {
        const newQuote = await createQuote.mutateAsync({
          client_id: data.client_id,
          quote_date: data.quote_date,
          validity_days: data.validity_days,
          notes: data.notes || undefined,
        });
        quoteId = newQuote.id;

        // Create items
        for (let i = 0; i < data.items.length; i++) {
          const item = data.items[i];
          await createItem.mutateAsync({
            quote_id: newQuote.id,
            description: item.description,
            item_notes: item.item_notes || '',
            quantity: item.quantity,
            unit_price: item.unit_price,
            sort_order: i,
          });
        }

        toast({ title: 'Preventivo creato', description: `Preventivo #${newQuote.quote_number}` });
      }

      navigate(`/quotes/${quoteId}`);
    } catch (error) {
      toast({ title: 'Errore', description: 'Impossibile salvare il preventivo', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditing && (quoteLoading || itemsLoading)) {
    return <div className="text-center py-12 text-muted-foreground">Caricamento...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/quotes')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isEditing ? `Modifica Preventivo #${existingQuote?.quote_number}` : 'Nuovo Preventivo'}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? 'Modifica i dettagli del preventivo' : 'Compila i dettagli del preventivo'}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informazioni Generali</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="client_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona cliente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.company_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="quote_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Preventivo *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="validity_days"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Validità (giorni)</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} max={365} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Note aggiuntive..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Articoli</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ description: '', item_notes: '', quantity: 1, unit_price: 0 })}
              >
                <Plus className="w-4 h-4 mr-2" />
                Aggiungi
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-3 items-start p-4 rounded-lg border border-border bg-muted/30">
                  <div className="flex-1 space-y-3">
                    <FormField
                      control={form.control}
                      name={`items.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="sr-only">Descrizione</FormLabel>
                          <FormControl>
                            <Input placeholder="Descrizione articolo (es. PC Acer Aspire)" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`items.${index}.item_notes`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-muted-foreground">Note / Dettagli</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Dettagli aggiuntivi (es. Processore i7, RAM 16GB, SSD 512GB...)" 
                              className="min-h-[60px] text-sm"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-muted-foreground">Quantità</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" min="0.01" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`items.${index}.unit_price`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-muted-foreground">Prezzo Unit. (€)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" min="0" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 pt-1">
                    <span className="text-sm font-semibold text-foreground">
                      {formatCurrency((Number(watchedItems[index]?.quantity) || 0) * (Number(watchedItems[index]?.unit_price) || 0))}
                    </span>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {form.formState.errors.items?.root && (
                <p className="text-sm text-destructive">{form.formState.errors.items.root.message}</p>
              )}

              <div className="flex justify-end pt-4 border-t border-border">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Totale</p>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(total)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate('/quotes')}>
              Annulla
            </Button>
            <Button type="submit" className="gradient-primary border-0" disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Salvataggio...' : isEditing ? 'Salva Modifiche' : 'Crea Preventivo'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
