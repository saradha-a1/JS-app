import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface EstimationPDFData {
  id: string; date: string;
  fromName: string; toName: string;
  fromLocation: string; toLocation: string;
  items: { description: string; qty: number; value: string | number }[];
}

const RED: [number, number, number] = [217, 36, 28];
const DARK: [number, number, number] = [30, 58, 95];
const LIGHT_RED: [number, number, number] = [255, 240, 240];
const ALT_ROW: [number, number, number] = [255, 250, 250];

const TERMS = [
  '1. Payment method, at Loading Point 90 %, at Unloading point 10 %',
  '2. PLEASE NOTE THAT THE ABOVE QUOTATION HAS was prepared keeping in view our basic standard of packing with the best packing materials as the type of packing will be fit to our discretion.',
  '3. The carrier or their agent shall be exempted from any loss or damage through accident, pilferage, fire, rain, collision, and any other road or river hazard. We therefore recommend that goods be insured covering all risks. No individual policy / Receipt from insurance co. will be given.',
  '4. If you want to take extra goods apart from those mentioned in the goods list you are welcome. However, we charge extra money for such items.',
  '5. After local shifting corrugated box should be return back on the same day. If the customer is sending the boxes next day, we charge a certain amount.',
  '6. Please be advised that the lorry transportation charges which quoted are based on the present prevailing rates and will be charged on actual at the time of transportation. Octroi charges, Sales tax if applicable will be charged extra as per actual in advance.',
  '7. All payments in favour of JS PACKERS AND MOVERS',
];

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src; img.crossOrigin = 'Anonymous';
    img.onload = () => resolve(img); img.onerror = () => reject(new Error('fail'));
  });

const drawHeader = (doc: jsPDF, pw: number, ph: number, m: number, title: string, id: string, date: string, logoImg: HTMLImageElement | null) => {
  // Top red bar
  doc.setFillColor(...RED);
  doc.rect(0, 0, pw, 15, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(title, m, 10);
  doc.setFontSize(10);
  doc.text(id, pw / 2, 10, { align: 'center' });
  doc.text(date, pw - m, 10, { align: 'right' });

  // Logo — larger to match order
  if (logoImg) doc.addImage(logoImg, 'PNG', m, 17, 30, 24);

  // Company name — large bold
  doc.setTextColor(...DARK);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('JS PACKERS AND MOVERS', m + 34, 32);

  // ADDRESS label + address below logo
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('ADDRESS', m, 50);
  doc.setFont('helvetica', 'normal');
  doc.text(': #17, Sathiya Nagar, West Saram', m + 22, 50);
  doc.text('Pondicherry 605 013.', m + 24, 56);

  // Divider
  doc.setDrawColor(220, 220, 220);
  doc.line(m, 63, pw - m, 63);

  // Right column at 62% to avoid overlap with large company name
  const rx = pw * 0.62;
  let ry = 32;
  [['GST/TIN NO', ': 34BGZPV3876M1Z2'], ['CONTACT', ': 9629679328'], ['E-MAIL', ': jspackersnmovers@gmail.com'], ['WEB', ': www.jspackers.com']].forEach(([l, v]) => {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.text(l, rx, ry);
    doc.setFont('helvetica', 'normal'); doc.text(v, rx + 25, ry);
    ry += 8;
  });

  // Footer bar
  doc.setFillColor(...RED);
  doc.rect(0, ph - 12, pw, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Thanks for doing business with us.', pw / 2, ph - 5, { align: 'center' });
};

const drawWatermark = (doc: jsPDF, pw: number, ph: number, wmImg: HTMLImageElement | null) => {
  if (!wmImg) return;
  try {
    const canvas = document.createElement('canvas');
    const size = 500;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    ctx.globalAlpha = 0.09;
    ctx.translate(size / 2, size / 2);
    ctx.rotate(-12 * Math.PI / 180);
    ctx.drawImage(wmImg, -size / 2, -size / 2, size, size);
    const wmSize = 120;
    doc.addImage(canvas.toDataURL('image/png'), 'PNG', pw / 2 - wmSize / 2, ph / 2 - wmSize / 2, wmSize, wmSize);
  } catch { /* skip */ }
};


const drawTermsAndSignature = (doc: jsPDF, pw: number, ph: number, m: number, startY: number, id: string, date: string, logoImg: HTMLImageElement | null, wmImg: HTMLImageElement | null) => {
  let y = startY;
  const maxW = pw - m * 2;

  let footerMode = false;
  if (y + 80 > ph - 40) {
    doc.addPage();
    drawHeader(doc, pw, ph, m, 'Estimation', id, date, logoImg);
    drawWatermark(doc, pw, ph, wmImg);
    y = ph - 115;
    footerMode = true;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text('TERMS & CONDITIONS', m, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(60, 60, 60);
  TERMS.forEach(term => {
    const lines = doc.splitTextToSize(term, maxW);
    if (!footerMode && y + lines.length * 3.5 > ph - 50) {
      doc.addPage();
      drawHeader(doc, pw, ph, m, 'Estimation', id, date, logoImg);
      drawWatermark(doc, pw, ph, wmImg);
      y = 70;
    }
    doc.text(lines, m, y);
    y += lines.length * 3.5 + 1;
  });

  y += 8;
  if (!footerMode && y + 20 > ph - 30) {
    doc.addPage();
    drawHeader(doc, pw, ph, m, 'Estimation', id, date, logoImg);
    drawWatermark(doc, pw, ph, wmImg);
    y = 70;
  }

  doc.setDrawColor(220, 220, 220);
  doc.line(m, y, pw - m, y);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  doc.text('For JS Packers and Movers', pw - m, y, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Authorised Signature', pw - m, y + 6, { align: 'right' });
};

export const generateEstimationPDF = async (data: EstimationPDFData, action: 'view' | 'save' = 'save') => {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.width;
  const ph = doc.internal.pageSize.height;
  const m = 14;

  let logoImg: HTMLImageElement | null = null;
  try { logoImg = await loadImage('/logo-new1.png'); } catch { /* skip */ }
  let wmImg: HTMLImageElement | null = null;
  try { wmImg = await loadImage('/js-watermark.png'); } catch { /* skip */ }

  drawHeader(doc, pw, ph, m, 'Estimation', data.id, data.date, logoImg);

  // From / To — two-column table
  autoTable(doc, {
    startY: 67,
    head: [[
      { content: 'From', styles: { halign: 'center', fillColor: RED, textColor: [255, 255, 255], fontStyle: 'bold' } },
      { content: 'To', styles: { halign: 'center', fillColor: RED, textColor: [255, 255, 255], fontStyle: 'bold' } },
    ]],
    body: [
      [
        { content: `Name :  ${data.fromName}`, styles: { fillColor: [255, 255, 255], fontStyle: 'bold' } },
        { content: `Name :  ${data.toName}`, styles: { fillColor: [255, 255, 255], fontStyle: 'bold' } },
      ],
      [
        { content: `Origin :  ${data.fromLocation || '-'}`, styles: { fillColor: ALT_ROW } },
        { content: `Destination :  ${data.toLocation || '-'}`, styles: { fillColor: ALT_ROW } },
      ],
    ],
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 3.5, lineColor: [200, 200, 200], lineWidth: 0.3 },
    headStyles: { fontSize: 9, lineColor: [255, 255, 255] },
    margin: { top: 67, left: m, right: m },
    didDrawPage: () => { drawWatermark(doc, pw, ph, wmImg); },
  });

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 6,
    head: [['S.No', 'Name of Article', 'Nos', 'Type of Packing']],
    body: data.items.map((item, i) => [i + 1, item.description, item.qty, item.value]),
    theme: 'grid',
    headStyles: { fillColor: RED, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5, lineColor: [255, 255, 255] },
    styles: { fontSize: 8.5, cellPadding: 3 },
    alternateRowStyles: { fillColor: ALT_ROW },
    columnStyles: {
      0: { halign: 'center', cellWidth: 14 },
      2: { halign: 'center', cellWidth: 18 },
    },
    margin: { top: 67, left: m, right: m },
    didDrawPage: (hookData) => {
      if (hookData.pageNumber > 1) {
        drawHeader(doc, pw, ph, m, 'Estimation', data.id, data.date, logoImg);
      }
      drawWatermark(doc, pw, ph, wmImg);
    },
  });

  const tableEndY = (doc as any).lastAutoTable.finalY;
  drawTermsAndSignature(doc, pw, ph, m, tableEndY + 12, data.id, data.date, logoImg, wmImg);

  if (action === 'view') window.open(doc.output('bloburl'), '_blank');
  else doc.save(`ES_${data.id}.pdf`);
};
