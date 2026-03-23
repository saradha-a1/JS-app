import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ReceiptPDFData {
  receiptNo: string; receiptDate: string; serviceTax: string;
  branchLocation: string; customerName: string; address: string;
  billNo: string; goodConsignmentNo: string; paymentType: string;
  bankName: string; accountChequeNo: string; chequeDate: string;
  items: { description: string; amount: number }[];
  totalAmount: number;
}

const RED: [number, number, number] = [217, 36, 28];
const BLUE: [number, number, number] = [30, 58, 138];
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

const drawHF = (doc: jsPDF, pw: number, ph: number, m: number, logoImg: HTMLImageElement | null) => {
  // Top red bar
  doc.setFillColor(...RED);
  doc.rect(0, 0, pw, 15, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Receipt', m, 10);

  // Logo
  if (logoImg) doc.addImage(logoImg, 'PNG', m, 19, 26, 20);

  // Company name — left column (bounded to ~55% width)
  const leftMax = pw * 0.55;
  doc.setTextColor(...BLUE);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('JS PACKERS AND MOVERS', m + 30, 26);

  // Address — two lines to avoid overflow
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text('#17, Sathiya Nagar, West Saram,', m + 30, 32);
  doc.text('Pondicherry - 605 013.', m + 30, 37);

  // Right: GST/Contact info
  const rx = leftMax + 4;
  let hy = 19;
  [['GST/TIN NO', ': 34BGZPV3876M1Z2'], ['CONTACT', ': 9629679328'], ['E-MAIL', ': jspackersnmovers@gmail.com'], ['WEB', ': www.jspackers.com']].forEach(([l, v]) => {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.text(l, rx, hy);
    doc.setFont('helvetica', 'normal'); doc.text(v, rx + 20, hy);
    hy += 5;
  });

  // Divider
  doc.setDrawColor(220, 220, 220);
  doc.line(m, 44, pw - m, 44);

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

const drawTermsAndSignature = (doc: jsPDF, pw: number, ph: number, m: number, startY: number, logoImg: HTMLImageElement | null, wmImg: HTMLImageElement | null) => {
  let y = startY;
  const maxW = pw - m * 2;

  let footerMode = false;
  if (y + 80 > ph - 40) {
    doc.addPage();
    drawHF(doc, pw, ph, m, logoImg);
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
      drawHF(doc, pw, ph, m, logoImg);
      drawWatermark(doc, pw, ph, wmImg);
      y = 52;
    }
    doc.text(lines, m, y);
    y += lines.length * 3.5 + 1;
  });

  y += 8;
  if (!footerMode && y + 20 > ph - 30) {
    doc.addPage();
    drawHF(doc, pw, ph, m, logoImg);
    drawWatermark(doc, pw, ph, wmImg);
    y = 52;
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

export const generateReceiptPDF = async (data: ReceiptPDFData, action: 'view' | 'save' = 'save') => {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.width;
  const ph = doc.internal.pageSize.height;
  const m = 14;

  let logoImg: HTMLImageElement | null = null;
  try { logoImg = await loadImage('/logo-new1.png'); } catch { /* skip */ }
  let wmImg: HTMLImageElement | null = null;
  try { wmImg = await loadImage('/js-watermark.png'); } catch { /* skip */ }

  drawHF(doc, pw, ph, m, logoImg);
  drawWatermark(doc, pw, ph, wmImg);

  const paymentMethods = ['Cash', 'Cheque', 'Online', 'RTGS', 'NET Banking'];

  autoTable(doc, {
    startY: 48,
    theme: 'grid',
    head: [[
      { content: 'Money Receipt NO.', styles: { fillColor: RED, textColor: [255, 255, 255], fontStyle: 'bold' } },
      { content: data.receiptNo, styles: { fillColor: RED, textColor: [255, 255, 255] } },
      { content: 'Date', styles: { fillColor: RED, textColor: [255, 255, 255], halign: 'center' } },
      { content: data.receiptDate, styles: { fillColor: RED, textColor: [255, 255, 255] } },
      { content: `Service Tax: ${data.serviceTax || '34BGZPV3876M1Z2'}`, styles: { fillColor: RED, textColor: [255, 255, 255] } },
    ]],
    body: [
      [{ content: 'Branch Location:', styles: { fontStyle: 'bold', fillColor: ALT_ROW } }, { content: data.branchLocation, colSpan: 4, styles: { fillColor: ALT_ROW } }],
      [{ content: 'Party Name', styles: { fontStyle: 'bold' } }, { content: data.customerName, colSpan: 4 }],
      [{ content: 'Address', styles: { fontStyle: 'bold', fillColor: ALT_ROW } }, { content: data.address, colSpan: 4, styles: { fillColor: ALT_ROW } }],
      [{ content: 'NO./ CFR NO.', styles: { fontStyle: 'bold' } }, { content: data.billNo }, { content: 'Goods Consignment No.', styles: { fontStyle: 'bold' } }, { content: data.goodConsignmentNo, colSpan: 2 }],
    ],
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    margin: { left: m, right: m },
  });

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY,
    theme: 'grid',
    body: [[{ content: 'Type of Payment (TICK):', styles: { fontStyle: 'bold', fillColor: LIGHT_RED } }, ...paymentMethods.map(p => ({ content: p, styles: { fillColor: ALT_ROW } }))]],
    styles: { fontSize: 8.5, cellPadding: 3 },
    margin: { left: m, right: m },
    didDrawCell: (hookData) => {
      if (hookData.section === 'body' && hookData.column.index > 0) {
        const label = paymentMethods[hookData.column.index - 1];
        if (data.paymentType && label.toLowerCase().includes(data.paymentType.toLowerCase())) {
          const cell = hookData.cell;
          doc.setDrawColor(0, 128, 0); doc.setLineWidth(0.8);
          doc.line(cell.x + cell.width - 10, cell.y + cell.height / 2, cell.x + cell.width - 8, cell.y + cell.height / 2 + 2);
          doc.line(cell.x + cell.width - 8, cell.y + cell.height / 2 + 2, cell.x + cell.width - 4, cell.y + cell.height / 2 - 3);
        }
      }
    },
  });

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY,
    theme: 'grid',
    head: [[
      { content: 'Particulars', styles: { fillColor: RED, halign: 'center', textColor: [255, 255, 255], fontStyle: 'bold' } },
      { content: 'RS', styles: { fillColor: RED, halign: 'center', textColor: [255, 255, 255], fontStyle: 'bold' } },
    ]],
    body: data.items.map((i, idx) => [
      { content: i.description, styles: { fillColor: idx % 2 === 0 ? [255, 255, 255] : ALT_ROW } },
      { content: i.amount.toFixed(2), styles: { halign: 'right', fillColor: idx % 2 === 0 ? [255, 255, 255] : ALT_ROW } },
    ]),
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: { 0: { cellWidth: 140 }, 1: { halign: 'right' } },
    margin: { left: m, right: m },
    didDrawPage: (hookData) => {
      if (hookData.pageNumber > 1) {
        drawHF(doc, pw, ph, m, logoImg);
        drawWatermark(doc, pw, ph, logoImg);
      }
    },
  });

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY,
    theme: 'grid',
    body: [[
      { content: `Received Amount Of ${data.receiptNo}`, styles: { cellWidth: 140, fontStyle: 'bold', fillColor: LIGHT_RED } },
      { content: data.totalAmount.toFixed(2), styles: { fontStyle: 'bold', halign: 'right', fillColor: LIGHT_RED, textColor: RED } },
    ]],
    margin: { left: m, right: m },
  });

  // Bank details row
  let cy = (doc as any).lastAutoTable.finalY;
  const cw = [60, 40, 45, 37];
  doc.setDrawColor(180, 180, 180); doc.setLineWidth(0.3);
  doc.rect(m, cy, cw[0], 12);
  doc.setFontSize(8); doc.setTextColor(0, 0, 0);
  doc.text('Payment Received through', m + 2, cy + 7);
  doc.rect(m + cw[0], cy, cw[1], 12);
  doc.setFont('helvetica', 'bold'); doc.text('Bank Name', m + cw[0] + 2, cy + 4);
  doc.setFont('helvetica', 'normal'); doc.text(data.bankName || '-', m + cw[0] + 2, cy + 9);
  doc.rect(m + cw[0] + cw[1], cy, cw[2], 12);
  doc.setFont('helvetica', 'bold'); doc.text('Account No', m + cw[0] + cw[1] + 2, cy + 4);
  doc.setFont('helvetica', 'normal'); doc.text(data.accountChequeNo || '-', m + cw[0] + cw[1] + 2, cy + 9);
  doc.rect(m + cw[0] + cw[1] + cw[2], cy, cw[3], 12);
  doc.setFont('helvetica', 'bold'); doc.text('Date', m + cw[0] + cw[1] + cw[2] + 2, cy + 4);
  doc.setFont('helvetica', 'normal'); doc.text(data.chequeDate || '-', m + cw[0] + cw[1] + cw[2] + 2, cy + 9);

  const tableEndY = cy + 12;
  drawTermsAndSignature(doc, pw, ph, m, tableEndY + 12, logoImg, wmImg);

  if (action === 'view') window.open(doc.output('bloburl'), '_blank');
  else doc.save(`Receipt_${data.receiptNo}.pdf`);
};
