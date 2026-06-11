import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function downloadElementAsPDF(el, filename) {
  const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
  const img = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pw = pdf.internal.pageSize.getWidth();
  const ph = (canvas.height * pw) / canvas.width;
  pdf.addImage(img, 'PNG', 0, 0, pw, Math.min(ph, pdf.internal.pageSize.getHeight()));
  pdf.save(filename);
}
