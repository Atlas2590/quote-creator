import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save } from 'lucide-react';
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
import { useClient, useCreateClient, useUpdateClient } from '@/hooks/useClients';
import { toast } from '@/hooks/use-toast';

const clientSchema = z.object({
  company_name: z.string().min(1, 'Ragione sociale obbligatoria').max(200),
  address: z.string().max(300).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  postal_code: z.string().max(10).optional().nullable(),
  province: z.string().max(5).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  vat_number: z.string().max(20).optional().nullable(),
  fiscal_code: z.string().max(20).optional().nullable(),
  email: z.string().email('Email non valida').max(255).optional().nullable().or(z.literal('')),
  phone: z.string().max(30).optional().nullable(),
  contact_person: z.string().max(100).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

type ClientFormData = z.infer<typeof clientSchema>;

export default function ClientForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  
  const { data: existingClient, isLoading } = useClient(id);
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      company_name: '',
      address: '',
      city: '',
      postal_code: '',
      province: '',
      country: 'Italia',
      vat_number: '',
      fiscal_code: '',
      email: '',
      phone: '',
      contact_person: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (existingClient) {
      form.reset({
        company_name: existingClient.company_name,
        address: existingClient.address ?? '',
        city: existingClient.city ?? '',
        postal_code: existingClient.postal_code ?? '',
        province: existingClient.province ?? '',
        country: existingClient.country ?? 'Italia',
        vat_number: existingClient.vat_number ?? '',
        fiscal_code: existingClient.fiscal_code ?? '',
        email: existingClient.email ?? '',
        phone: existingClient.phone ?? '',
        contact_person: existingClient.contact_person ?? '',
        notes: existingClient.notes ?? '',
      });
    }
  }, [existingClient, form]);

  const onSubmit = async (data: ClientFormData) => {
    try {
      const cleanData = {
        company_name: data.company_name,
        email: data.email || null,
        address: data.address || null,
        city: data.city || null,
        postal_code: data.postal_code || null,
        province: data.province || null,
        country: data.country || null,
        vat_number: data.vat_number || null,
        fiscal_code: data.fiscal_code || null,
        phone: data.phone || null,
        contact_person: data.contact_person || null,
        notes: data.notes || null,
      };

      if (isEditing && id) {
        await updateClient.mutateAsync({ id, ...cleanData });
        toast({ title: 'Cliente aggiornato', description: 'Le modifiche sono state salvate' });
      } else {
        await createClient.mutateAsync(cleanData);
        toast({ title: 'Cliente creato', description: 'Il nuovo cliente è stato aggiunto' });
      }
      navigate('/clients');
    } catch (error) {
      toast({ title: 'Errore', description: 'Impossibile salvare il cliente', variant: 'destructive' });
    }
  };

  if (isEditing && isLoading) {
    return <div className="text-center py-12 text-muted-foreground">Caricamento...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/clients')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isEditing ? 'Modifica Cliente' : 'Nuovo Cliente'}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? 'Modifica i dati del cliente' : 'Inserisci i dati del nuovo cliente'}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dati Azienda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="company_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ragione Sociale *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome azienda" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="vat_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Partita IVA</FormLabel>
                      <FormControl>
                        <Input placeholder="IT12345678901" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fiscal_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Codice Fiscale</FormLabel>
                      <FormControl>
                        <Input placeholder="Codice fiscale" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Indirizzo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Indirizzo</FormLabel>
                    <FormControl>
                      <Input placeholder="Via, numero civico" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Città</FormLabel>
                      <FormControl>
                        <Input placeholder="Città" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="postal_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CAP</FormLabel>
                      <FormControl>
                        <Input placeholder="00000" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="province"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provincia</FormLabel>
                      <FormControl>
                        <Input placeholder="MI" maxLength={2} {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contatti</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="contact_person"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Referente</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome e cognome" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@azienda.it" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefono</FormLabel>
                      <FormControl>
                        <Input placeholder="+39 02 1234567" {...field} value={field.value ?? ''} />
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
                      <Textarea 
                        placeholder="Note aggiuntive sul cliente..." 
                        {...field} 
                        value={field.value ?? ''} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate('/clients')}>
              Annulla
            </Button>
            <Button type="submit" className="gradient-primary border-0">
              <Save className="w-4 h-4 mr-2" />
              {isEditing ? 'Salva Modifiche' : 'Crea Cliente'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
