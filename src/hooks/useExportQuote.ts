import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

export function useExportQuote() {
  const [isExporting, setIsExporting] = useState(false);

  const exportQuote = async (quoteId: string) => {
    setIsExporting(true);
    
    try {
      const blob = await api.export.quote(quoteId);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `preventivo_${quoteId}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({ title: 'Export completato', description: 'Il documento è stato scaricato.' });
    } catch (error: any) {
      console.error('Export error:', error);
      toast({ 
        title: 'Errore export', 
        description: error.message || 'Impossibile esportare il preventivo', 
        variant: 'destructive' 
      });
    } finally {
      setIsExporting(false);
    }
  };

  return { exportQuote, isExporting };
}
