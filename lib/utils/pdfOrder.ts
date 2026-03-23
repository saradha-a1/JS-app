import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { numToWords } from './numToWords';

export interface OrderPDFData {
  id: string;
  date: string;
  billing: { name: string; address: string; gstin: string; contact: string };
  shipping: { name: string; address: string; gstin: string; contact: string };
  items: Array<{
    description: string;
    qty: number;
    rate: number;
    basicAmount: number;
    cgst: number;
    cgstAmount: number;
    sgst: number;
    sgstAmount: number;
    igst: number;
    igstAmount: number;
    grandTotal: number;
  }>;
  totalAmount: number;
  totalTax: number;
  grandTotal: number;
  discountPercent: number;
  otherCharges: number;
}

const RED: [number, number, number] = [217, 36, 28];
const DARK_BLUE: [number, number, number] = [30, 58, 95];
const LIGHT_RED: [number, number, number] = [255, 240, 240];
const ALT_ROW: [number, number, number] = [255, 250, 250];
const BILLING_ALT: [number, number, number] = [248, 205, 205];

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
    img.src = src;
    img.crossOrigin = 'Anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image failed'));
  });

export const generateOrderPDF = async (data: OrderPDFData, action: 'view' | 'save' = 'save') => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pw = doc.internal.pageSize.width;
  const ph = doc.internal.pageSize.height;
  const m = 14;

  let logoImg: HTMLImageElement | null = null;
  try { logoImg = await loadImage('/logo-new1.png'); } catch { /* skip */ }
  let wmImg: HTMLImageElement | null = null;
  try { wmImg = await loadImage('/js-watermark.png'); } catch { /* skip */ }

  const drawHeader = (pdf: jsPDF) => {
    pdf.setFillColor(...RED);
    pdf.rect(0, 0, pw, 15, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('INVOICE - Original', m, 10);
    pdf.text(data.id, pw / 2, 10, { align: 'center' });
    pdf.text(data.date, pw - m, 10, { align: 'right' });
  };

  const drawCompanyInfo = (pdf: jsPDF) => {
    // Logo — smaller so company name can be large without overflow
    if (logoImg) pdf.addImage(logoImg, 'PNG', m, 17, 30, 24);

    // Company name — large bold to match reference
    pdf.setTextColor(...DARK_BLUE);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('JS PACKERS AND MOVERS', m + 34, 32);

    // ADDRESS label + address (below logo)
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(8.5);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ADDRESS', m, 50);
    pdf.setFont('helvetica', 'normal');
    pdf.text(': #17, Sathiya Nagar, West Saram', m + 22, 50);
    pdf.text('Pondicherry 605 013.', m + 24, 56);

    // Divider
    pdf.setDrawColor(220, 220, 220);
    pdf.line(m, 63, pw - m, 63);

    // Right column — shifted to 62% to avoid overlap with large company name
    const rx = pw * 0.62;
    let ry = 32; // aligned with "JS PACKERS AND MOVERS" text baseline
    [['GST/TIN NO', ': 34BGZPV3876M1Z2'], ['CONTACT', ': 9629679328'], ['E-MAIL', ': jspackersnmovers@gmail.com'], ['WEB', ': www.jspackers.com']].forEach(([label, val]) => {
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8.5); pdf.text(label, rx, ry);
      pdf.setFont('helvetica', 'normal'); pdf.text(val, rx + 25, ry);
      ry += 8;
    });
  };

  const drawFooter = (pdf: jsPDF) => {
    pdf.setFillColor(...RED);
    pdf.rect(0, ph - 12, pw, 12, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(8.5);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Thanks for doing business with us.', pw / 2, ph - 5, { align: 'center' });
  };

  const drawWatermark = (pdf: jsPDF) => {
    if (!wmImg) return;
    try {
      const canvas = document.createElement('canvas');
      const size = 500;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      ctx.globalAlpha = 0.09;
      ctx.translate(size / 2, size / 2);
      ctx.rotate(-12 * Math.PI / 180); // slight left tilt
      ctx.drawImage(wmImg, -size / 2, -size / 2, size, size);
      const wmSize = 120; // mm — bigger, centered
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', pw / 2 - wmSize / 2, ph / 2 - wmSize / 2, wmSize, wmSize);
    } catch { /* skip */ }
  };

  const drawTermsAndSignature = (pdf: jsPDF, startY: number) => {
    let y = startY;
    const maxW = pw - m * 2;
    let footerMode = false;

    if (y + 80 > ph - 40) {
      pdf.addPage();
      drawHeader(pdf);
      drawCompanyInfo(pdf);
      drawFooter(pdf);
      drawWatermark(pdf);
      y = ph - 115;
      footerMode = true;
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(0, 0, 0);
    pdf.text('TERMS & CONDITIONS', m, y);
    y += 8;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(60, 60, 60);
    TERMS.forEach(term => {
      const lines = pdf.splitTextToSize(term, maxW);
      if (!footerMode && y + lines.length * 3.5 > ph - 50) {
        pdf.addPage();
        drawHeader(pdf);
        drawCompanyInfo(pdf);
        drawFooter(pdf);
        drawWatermark(pdf);
        y = 70;
      }
      pdf.text(lines, m, y);
      y += lines.length * 3.5 + 1;
    });

    y += 8;
    if (!footerMode && y + 20 > ph - 30) {
      pdf.addPage();
      drawHeader(pdf);
      drawCompanyInfo(pdf);
      drawFooter(pdf);
      drawWatermark(pdf);
      y = 70;
    }

    pdf.setDrawColor(220, 220, 220);
    pdf.line(m, y, pw - m, y);
    y += 6;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(0, 0, 0);
    pdf.text('For JS Packers and Movers', pw - m, y, { align: 'right' });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.text('Authorised Signature', pw - m, y + 6, { align: 'right' });
  };

  // ─── PAGE 1 ───────────────────────────────────────────────────────────
  drawHeader(doc);
  drawCompanyInfo(doc);
  drawFooter(doc);

  // Billing / Shipping table — 4-column: [label | value | label | value]
  autoTable(doc, {
    startY: 67,
    head: [[
      { content: 'Billing Details', colSpan: 2, styles: { halign: 'center', fillColor: RED, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 } },
      { content: 'Shipping Details', colSpan: 2, styles: { halign: 'center', fillColor: RED, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 } },
    ]],
    body: [
      [
        { content: `Purchaser Name :  ${data.billing.name}`, colSpan: 2, styles: { fontStyle: 'bold', fillColor: [255, 255, 255], textColor: [50, 58, 75], lineColor: [255, 255, 255] } },
        { content: `Receiver Name :  ${data.shipping.name}`, colSpan: 2, styles: { fontStyle: 'bold', fillColor: [255, 255, 255], textColor: [50, 58, 75], lineColor: [255, 255, 255] } },
      ],
      [
        { content: `GSTIN :  ${data.billing.gstin || ''}`, colSpan: 2, styles: { fontStyle: 'bold', fillColor: [255, 220, 220] as [number,number,number], textColor: [50, 58, 75], lineColor: [255, 255, 255] } },
        { content: `GSTIN :  ${data.shipping.gstin || ''}`, colSpan: 2, styles: { fontStyle: 'bold', fillColor: [255, 220, 220] as [number,number,number], textColor: [50, 58, 75], lineColor: [255, 255, 255] } },
      ],
      [
        { content: `Billing Address :  ${data.billing.address}`, colSpan: 2, styles: { fontStyle: 'bold', fillColor: [255, 255, 255], textColor: [50, 58, 75], lineColor: [255, 255, 255] } },
        { content: `Delivery Address :  ${data.shipping.address}`, colSpan: 2, styles: { fontStyle: 'bold', fillColor: [255, 255, 255], textColor: [50, 58, 75], lineColor: [255, 255, 255] } },
      ],
      [
        { content: 'Contact No :', styles: { fontStyle: 'bold', fillColor: [255, 220, 220] as [number,number,number], textColor: [0, 0, 0], lineColor: [255, 255, 255] } },
        { content: data.billing.contact || '', styles: { fillColor: [255, 220, 220] as [number,number,number], textColor: [0, 0, 0], lineColor: [255, 255, 255] } },
        { content: 'Contact No :', styles: { fontStyle: 'bold', fillColor: [255, 220, 220] as [number,number,number], textColor: [0, 0, 0], lineColor: [255, 255, 255] } },
        { content: data.shipping.contact || '', styles: { fillColor: [255, 220, 220] as [number,number,number], textColor: [0, 0, 0], lineColor: [255, 255, 255] } },
      ],
    ],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 3, lineColor: [255, 255, 255], lineWidth: 0.3 },
    columnStyles: { 0: { cellWidth: 32 }, 1: { cellWidth: 59 }, 2: { cellWidth: 32 }, 3: { cellWidth: 59 } },
    margin: { left: m, right: m },
    didDrawPage: (hookData) => {
      if (hookData.pageNumber > 1) {
        drawHeader(doc); drawCompanyInfo(doc); drawFooter(doc); drawWatermark(doc);
      }
    },
  });

  const hasIgst = data.items.some(i => Number(i.igst) > 0);
  const tableStartY = (doc as any).lastAutoTable.finalY + 6;

  const itemBody = data.items.map((item, idx) => {
    const bg = idx % 2 === 0 ? [255, 255, 255] : ALT_ROW;
    if (hasIgst) {
      return [
        { content: idx + 1, styles: { halign: 'center', fillColor: bg } },
        { content: item.description, styles: { fillColor: bg } },
        { content: item.qty, styles: { halign: 'center', fillColor: bg } },
        { content: Number(item.rate).toFixed(2), styles: { halign: 'center', fillColor: bg } },
        { content: Number(item.basicAmount).toFixed(2), styles: { halign: 'right', fillColor: bg } },
        { content: Number(item.igst) + ' %', styles: { halign: 'center', fillColor: bg } },
        { content: Number(item.igstAmount).toFixed(2), styles: { halign: 'center', fillColor: bg } },
        { content: Number(item.grandTotal).toFixed(2), styles: { halign: 'right', fontStyle: 'bold', fillColor: bg } },
      ];
    }
    return [
      { content: idx + 1, styles: { halign: 'center', fillColor: bg } },
      { content: item.description, styles: { fillColor: bg } },
      { content: item.qty, styles: { halign: 'center', fillColor: bg } },
      { content: Number(item.rate).toFixed(2), styles: { halign: 'center', fillColor: bg } },
      { content: Number(item.basicAmount).toFixed(2), styles: { halign: 'right', fillColor: bg } },
      { content: Number(item.cgst) + ' %', styles: { halign: 'center', fillColor: bg } },
      { content: Number(item.cgstAmount).toFixed(2), styles: { halign: 'center', fillColor: bg } },
      { content: Number(item.sgst) + ' %', styles: { halign: 'center', fillColor: bg } },
      { content: Number(item.sgstAmount).toFixed(2), styles: { halign: 'center', fillColor: bg } },
      { content: Number(item.grandTotal).toFixed(2), styles: { halign: 'right', fontStyle: 'bold', fillColor: bg } },
    ];
  });

  const totalBasic = data.items.reduce((s, i) => s + Number(i.basicAmount), 0);
  const totalCgst = data.items.reduce((s, i) => s + Number(i.cgstAmount), 0);
  const totalSgst = data.items.reduce((s, i) => s + Number(i.sgstAmount), 0);
  const totalIgst = data.items.reduce((s, i) => s + Number(i.igstAmount), 0);
  const grandTotalItems = data.items.reduce((s, i) => s + Number(i.grandTotal), 0);

  const totalRowStyles = { fillColor: LIGHT_RED as [number, number, number], fontStyle: 'bold' as const, fontSize: 8 };
  const fmt = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  let itemHead: object[][];
  let totalRow: object[];

  if (hasIgst) {
    itemHead = [[
      { content: 'S.No', rowSpan: 2, styles: { halign: 'center', valign: 'middle', fillColor: RED, textColor: [255, 255, 255] } },
      { content: 'Description', rowSpan: 2, styles: { fillColor: RED, textColor: [255, 255, 255] } },
      { content: 'Qty(kg)', rowSpan: 2, styles: { halign: 'center', fillColor: RED, textColor: [255, 255, 255] } },
      { content: 'Rate', rowSpan: 2, styles: { halign: 'center', fillColor: RED, textColor: [255, 255, 255] } },
      { content: 'Basic Amount', rowSpan: 2, styles: { halign: 'center', fillColor: RED, textColor: [255, 255, 255] } },
      { content: 'IGST', colSpan: 2, styles: { halign: 'center', fillColor: RED, textColor: [255, 255, 255] } },
      { content: 'Grand Total', rowSpan: 2, styles: { halign: 'center', fillColor: RED, textColor: [255, 255, 255] } },
    ], [
      { content: 'Tax', styles: { halign: 'center', fillColor: RED, textColor: [255, 255, 255] } },
      { content: 'Amount', styles: { halign: 'center', fillColor: RED, textColor: [255, 255, 255] } },
    ]];
    totalRow = [
      { content: 'Total Amount', colSpan: 4, styles: { ...totalRowStyles, halign: 'left' } },
      { content: fmt(totalBasic), styles: { ...totalRowStyles, halign: 'right' } },
      { content: '', styles: totalRowStyles },
      { content: fmt(totalIgst), styles: { ...totalRowStyles, halign: 'right' } },
      { content: fmt(grandTotalItems), styles: { ...totalRowStyles, halign: 'right' } },
    ];
  } else {
    itemHead = [[
      { content: 'S.No', rowSpan: 2, styles: { halign: 'center', valign: 'middle', fillColor: RED, textColor: [255, 255, 255] } },
      { content: 'Description', rowSpan: 2, styles: { fillColor: RED, textColor: [255, 255, 255] } },
      { content: 'Qty(kg)', rowSpan: 2, styles: { halign: 'center', fillColor: RED, textColor: [255, 255, 255] } },
      { content: 'Rate', rowSpan: 2, styles: { halign: 'center', fillColor: RED, textColor: [255, 255, 255] } },
      { content: 'Basic Amount', rowSpan: 2, styles: { halign: 'center', fillColor: RED, textColor: [255, 255, 255] } },
      { content: 'CGST', colSpan: 2, styles: { halign: 'center', fillColor: RED, textColor: [255, 255, 255] } },
      { content: 'SGST', colSpan: 2, styles: { halign: 'center', fillColor: RED, textColor: [255, 255, 255] } },
      { content: 'Grand Total', rowSpan: 2, styles: { halign: 'center', valign: 'middle', fillColor: RED, textColor: [255, 255, 255] } },
    ], [
      { content: 'Tax', styles: { halign: 'center', fillColor: RED, textColor: [255, 255, 255] } },
      { content: 'Amount', styles: { halign: 'center', fillColor: RED, textColor: [255, 255, 255] } },
      { content: 'Tax', styles: { halign: 'center', fillColor: RED, textColor: [255, 255, 255] } },
      { content: 'Amount', styles: { halign: 'center', fillColor: RED, textColor: [255, 255, 255] } },
    ]];
    totalRow = [
      { content: 'Total Amount', colSpan: 4, styles: { ...totalRowStyles, halign: 'left' } },
      { content: fmt(totalBasic), styles: { ...totalRowStyles, halign: 'right' } },
      { content: '', styles: totalRowStyles },
      { content: fmt(totalCgst), styles: { ...totalRowStyles, halign: 'right' } },
      { content: '', styles: totalRowStyles },
      { content: fmt(totalSgst), styles: { ...totalRowStyles, halign: 'right' } },
      { content: fmt(grandTotalItems), styles: { ...totalRowStyles, halign: 'right' } },
    ];
  }

  const finalGrandTotal = grandTotalItems
    - grandTotalItems * (Number(data.discountPercent) / 100)
    + Number(data.otherCharges);

  // CGST+SGST = 10 cols; IGST = 8 cols
  const discountRow = hasIgst
    ? [
        { content: 'Discount', colSpan: 6, styles: { ...totalRowStyles, halign: 'left' } },
        { content: '%', styles: { ...totalRowStyles, halign: 'center' } },
        { content: String(data.discountPercent || 0), styles: { ...totalRowStyles, halign: 'right' } },
      ]
    : [
        { content: 'Discount', colSpan: 8, styles: { ...totalRowStyles, halign: 'left' } },
        { content: '%', styles: { ...totalRowStyles, halign: 'center' } },
        { content: String(data.discountPercent || 0), styles: { ...totalRowStyles, halign: 'right' } },
      ];

  const otherRow = hasIgst
    ? [
        { content: 'Other Charges', colSpan: 7, styles: { ...totalRowStyles, halign: 'left' } },
        { content: fmt(Number(data.otherCharges || 0)), styles: { ...totalRowStyles, halign: 'right' } },
      ]
    : [
        { content: 'Other Charges', colSpan: 9, styles: { ...totalRowStyles, halign: 'left' } },
        { content: fmt(Number(data.otherCharges || 0)), styles: { ...totalRowStyles, halign: 'right' } },
      ];

  const totalInvRow = hasIgst
    ? [
        { content: 'Total Invoice Amount', colSpan: 7, styles: { ...totalRowStyles, halign: 'left' } },
        { content: fmt(finalGrandTotal), styles: { ...totalRowStyles, halign: 'right', textColor: [0, 0, 0] } },
      ]
    : [
        { content: 'Total Invoice Amount', colSpan: 9, styles: { ...totalRowStyles, halign: 'left' } },
        { content: fmt(finalGrandTotal), styles: { ...totalRowStyles, halign: 'right', textColor: [0, 0, 0] } },
      ];

  const wordsRowStyle = { fillColor: RED as [number, number, number], fontStyle: 'bold' as const, fontSize: 8, textColor: [255, 255, 255] as [number, number, number] };
  const amtWordsRow = hasIgst
    ? [
        { content: 'Total Invoice Amount (In Words)', colSpan: 2, styles: { ...wordsRowStyle, halign: 'left' } },
        { content: numToWords(finalGrandTotal), colSpan: 6, styles: { ...wordsRowStyle, fontStyle: 'normal' as const, halign: 'left' } },
      ]
    : [
        { content: 'Total Invoice Amount (In Words)', colSpan: 2, styles: { ...wordsRowStyle, halign: 'left' } },
        { content: numToWords(finalGrandTotal), colSpan: 8, styles: { ...wordsRowStyle, fontStyle: 'normal' as const, halign: 'left' } },
      ];

  autoTable(doc, {
    startY: tableStartY,
    head: itemHead as any,
    body: [
      ...itemBody,
      totalRow,
      discountRow,
      otherRow,
      totalInvRow,
      amtWordsRow,
    ] as any,
    theme: 'grid',
    headStyles: { fontStyle: 'bold', fontSize: 8, lineColor: [255, 255, 255], lineWidth: 0.5 },
    styles: { fontSize: 8, cellPadding: 3, lineColor: RED, lineWidth: 0.4, halign: 'center' },
    columnStyles: hasIgst ? {
      // 8 cols: S.No | Description | Qty | Rate | Basic | IGST-Tax | IGST-Amt | Grand Total
      // Fixed = 10+16+14+24+20+22+20 = 126 → auto = 56mm for Description
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto', halign: 'left' },
      2: { cellWidth: 16, halign: 'center' },
      3: { cellWidth: 14, halign: 'center' },
      4: { cellWidth: 24, halign: 'right' },
      5: { cellWidth: 20, halign: 'center' },
      6: { cellWidth: 22, halign: 'right' },
      7: { cellWidth: 20, halign: 'right' },
    } : {
      // 10 cols: S.No | Description | Qty | Rate | Basic | CG-Tax | CG-Amt | SG-Tax | SG-Amt | Grand Total
      // Fixed = 10+16+14+24+14+16+14+16+20 = 144 → auto = 38mm for Description
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto', halign: 'left' },
      2: { cellWidth: 16, halign: 'center' },
      3: { cellWidth: 14, halign: 'center' },
      4: { cellWidth: 24, halign: 'right' },
      5: { cellWidth: 14, halign: 'center' },
      6: { cellWidth: 16, halign: 'right' },
      7: { cellWidth: 14, halign: 'center' },
      8: { cellWidth: 16, halign: 'right' },
      9: { cellWidth: 20, halign: 'right' },
    },
    margin: { left: m, right: m },
    didDrawPage: (hookData) => {
      if (hookData.pageNumber > 1) {
        drawHeader(doc); drawCompanyInfo(doc); drawFooter(doc);
      }
      drawWatermark(doc); // draw after cells on every page so it overlays on top
    },
  });

  const tableEndY = (doc as any).lastAutoTable.finalY;
  drawTermsAndSignature(doc, tableEndY + 12);

  if (action === 'view') {
    window.open(doc.output('bloburl'), '_blank');
  } else {
    doc.save(`Invoice_${data.id}.pdf`);
  }
};
