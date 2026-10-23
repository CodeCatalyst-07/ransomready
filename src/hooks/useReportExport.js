import { useEffect, useRef, useState } from 'react';
import { buildReportHtml } from '../utils/reportHtml.js';

export default function useReportExport({ assessment, result, scan }) {
  const [exporting, setExporting] = useState(false);
  const [status, setStatus] = useState({ text: '', error: false });
  const busy = useRef(false);
  const mounted = useRef(false);
  const dismissStatus = () => setStatus({ text: '', error: false });

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (!status.text || status.error) return;
    const timer = setTimeout(() => setStatus({ text: '', error: false }), 8000);
    return () => clearTimeout(timer);
  }, [status]);

  async function exportReport() {
    // The ref blocks a second click before React renders the disabled button.
    if (busy.current || !assessment || !result) return;
    busy.current = true;
    setExporting(true);
    dismissStatus();
    try {
      const generatedAt = new Date().toISOString();
      const html = buildReportHtml({ assessment, result, scan, generatedAt });
      const response = await window.api.exportReportPdf({
        html, suggestedName: `RansomReady-Report-${assessment.organisationName}-${generatedAt.slice(0, 10)}.pdf`,
      });
      if (!response?.ok) throw new Error(response?.error || 'Could not export the report.');
      if (!response.data.cancelled && mounted.current) {
        setStatus({ text: `Report saved to ${response.data.filePath}`, error: false });
      }
    } catch (error) {
      if (mounted.current) setStatus({ text: error.message || 'Could not export the report.', error: true });
    } finally {
      busy.current = false;
      if (mounted.current) setExporting(false);
    }
  }

  return { exporting, status, exportReport, dismissStatus };
}
