import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export function useExportQuote() {
  const [isExporting, setIsExporting] = useState(false);

  const exportQuote = async (quoteId: string, format: 'docx' | 'pdf' = 'docx') => {
    setIsExporting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('export-quote', {
        body: { quoteId, format },
      });

      if (error) {
        throw error;
      }

      // Convert the response to blob and download
      const blob = new Blob([data], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
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
