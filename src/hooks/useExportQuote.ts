import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export function useExportQuote() {
  const [isExporting, setIsExporting] = useState(false);

  const exportQuote = async (quoteId: string, format: 'docx' | 'pdf' = 'docx') => {
    setIsExporting(true);
    
    try {
      // Use fetch directly for binary response handling
      const response = await fetch(`${SUPABASE_URL}/functions/v1/export-quote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ quoteId, format }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Export failed');
      }

      // Get the binary data as ArrayBuffer
      const arrayBuffer = await response.arrayBuffer();
      
      // Create blob from ArrayBuffer
      const blob = new Blob([arrayBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      // Extract filename from Content-Disposition header if available
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `preventivo_${quoteId}.docx`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) {
          filename = match[1];
        }
      }
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
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
