import { Link } from 'react-router-dom';
import { FileText, Users, TrendingUp, Clock, Plus, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuotes } from '@/hooks/useQuotes';
import { useClients } from '@/hooks/useClients';
import { QuoteStatusBadge } from '@/components/quotes/QuoteStatusBadge';
import { formatCurrency } from '@/lib/utils';

export default function Dashboard() {
  const { data: quotes = [], isLoading: quotesLoading } = useQuotes();
  const { data: clients = [], isLoading: clientsLoading } = useClients();

  const totalQuotes = quotes.length;
  const totalClients = clients.length;
  const acceptedQuotes = quotes.filter(q => q.status === 'accettato');
  const pendingQuotes = quotes.filter(q => ['bozza', 'da_controllare', 'da_confermare', 'inviato'].includes(q.status));
  
  const totalAcceptedValue = acceptedQuotes.reduce((sum, q) => sum + Number(q.total_amount), 0);
  const recentQuotes = quotes.slice(0, 5);

  const stats = [
    { 
      name: 'Preventivi Totali', 
      value: totalQuotes, 
      icon: FileText,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    { 
      name: 'Clienti', 
      value: totalClients, 
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    { 
      name: 'Valore Accettati', 
      value: formatCurrency(totalAcceptedValue), 
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    { 
      name: 'In Attesa', 
      value: pendingQuotes.length, 
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
    },
  ];

  const isLoading = quotesLoading || clientsLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Panoramica del tuo sistema preventivi</p>
        </div>
        <Button asChild className="gradient-primary border-0">
          <Link to="/quotes/new">
            <Plus className="w-4 h-4 mr-2" />
            Nuovo Preventivo
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.name}</p>
                  <p className="text-2xl font-bold text-foreground">
                    {isLoading ? '...' : stat.value}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Quotes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Preventivi Recenti</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/quotes" className="text-primary">
              Vedi tutti
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Caricamento...</div>
          ) : recentQuotes.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Nessun preventivo ancora</p>
              <Button asChild className="mt-4" variant="outline">
                <Link to="/quotes/new">Crea il primo preventivo</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentQuotes.map((quote) => (
                <Link 
                  key={quote.id}
                  to={`/quotes/${quote.id}`}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        Preventivo #{quote.quote_number}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {quote.client?.company_name || 'Cliente non trovato'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <QuoteStatusBadge status={quote.status} />
                    <span className="font-semibold text-foreground">
                      {formatCurrency(Number(quote.total_amount))}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
