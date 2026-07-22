import PDFDocument from 'pdfkit';

export interface InvoiceData {
  invoiceNumber: string;
  createdAt: Date;
  planName: string;
  amount: number;
  currency: string;
  paymentId: string;
  orderId: string;
  user: {
    email: string;
    name: string | null;
    company: string | null;
    country: string | null;
  };
}

export const generateInvoicePdf = (data: InvoiceData, stream: NodeJS.WritableStream): void => {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  // Stream client-side output
  doc.pipe(stream);

  // Modern corporate color scheme
  const primaryColor = '#4F46E5'; // Violet theme
  const textColor = '#1F2937'; // Slate 800
  const lightTextColor = '#6B7280'; // Slate 500
  const borderColor = '#E5E7EB'; // Slate 200
  const headerBgColor = '#F9FAFB'; 

  // 1. Header Layout
  doc
    .fillColor(primaryColor)
    .fontSize(20)
    .font('Helvetica-Bold')
    .text('MedTrackInsight', 50, 50);

  doc
    .fillColor(textColor)
    .fontSize(9)
    .font('Helvetica')
    .text('Healthcare Intelligence & Market Research Portal', 50, 75);

  doc
    .fillColor(textColor)
    .fontSize(22)
    .font('Helvetica-Bold')
    .text('INVOICE', 400, 48, { align: 'right' });

  // Horizontal Rule
  doc.moveTo(50, 100).lineTo(545, 100).strokeColor(borderColor).lineWidth(1).stroke();

  // 2. Invoice Details Grid
  doc
    .fillColor(lightTextColor)
    .fontSize(8)
    .font('Helvetica-Bold')
    .text('INVOICE METRICS', 50, 115);

  doc
    .fillColor(textColor)
    .fontSize(9)
    .font('Helvetica')
    .text(`Invoice ID: ${data.invoiceNumber}`, 50, 130)
    .text(`Date of Issue: ${new Date(data.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`, 50, 145)
    .text(`Payment Method: Razorpay Online`, 50, 160);

  doc
    .fillColor(lightTextColor)
    .fontSize(8)
    .font('Helvetica-Bold')
    .text('TRANSACTION AUDIT', 350, 115);

  doc
    .fillColor(textColor)
    .fontSize(9)
    .font('Helvetica')
    .text(`Order Ref: ${data.orderId}`, 350, 130)
    .text(`Payment Ref: ${data.paymentId}`, 350, 145)
    .text(`Status: PAID`, 350, 160);

  // Horizontal Rule
  doc.moveTo(50, 185).lineTo(545, 185).strokeColor(borderColor).stroke();

  // 3. Billing details (Issuer & Receiver)
  doc
    .fillColor(lightTextColor)
    .fontSize(8)
    .font('Helvetica-Bold')
    .text('SELLER / SERVICE PROVIDER', 50, 200);

  doc
    .fillColor(textColor)
    .fontSize(9)
    .font('Helvetica')
    .text('MedTrackInsight Portal Ltd.', 50, 215)
    .text('4th Floor, Tech Hub, Sector 62', 50, 230)
    .text('Noida, Uttar Pradesh, 201301', 50, 245)
    .text('India', 50, 260)
    .text('Email: billing@medtrackinsight.com', 50, 275);

  doc
    .fillColor(lightTextColor)
    .fontSize(8)
    .font('Helvetica-Bold')
    .text('BILLED TO (RECEIVER)', 300, 200);

  const clientName = data.user.name || 'Individual Consultant';
  const clientCompany = data.user.company || 'Not Specified';
  const clientCountry = data.user.country || 'India';

  doc
    .fillColor(textColor)
    .fontSize(9)
    .font('Helvetica')
    .text(clientName, 300, 215)
    .text(clientCompany, 300, 230)
    .text(data.user.email, 300, 245)
    .text(clientCountry, 300, 260);

  // Horizontal Rule
  doc.moveTo(50, 300).lineTo(545, 300).strokeColor(borderColor).stroke();

  // 4. Line Items Table
  const tableTop = 320;
  
  // Table Header Background banner
  doc
    .rect(50, tableTop, 495, 20)
    .fill(headerBgColor);

  doc
    .fillColor(textColor)
    .fontSize(9)
    .font('Helvetica-Bold')
    .text('Computational Description', 60, tableTop + 6)
    .text('Qty', 330, tableTop + 6, { width: 30, align: 'center' })
    .text('Unit Price', 380, tableTop + 6, { width: 70, align: 'right' })
    .text('Amount', 470, tableTop + 6, { width: 70, align: 'right' });

  // Main row item
  const itemRowTop = tableTop + 25;
  doc
    .fillColor(textColor)
    .fontSize(9)
    .font('Helvetica')
    .text(`${data.planName} - 30-Day License`, 60, itemRowTop)
    .text('1', 330, itemRowTop, { width: 30, align: 'center' })
    .text(`INR ${data.amount.toFixed(2)}`, 380, itemRowTop, { width: 70, align: 'right' })
    .text(`INR ${data.amount.toFixed(2)}`, 470, itemRowTop, { width: 70, align: 'right' });

  // Line below item row
  doc.moveTo(50, itemRowTop + 20).lineTo(545, itemRowTop + 20).strokeColor(borderColor).stroke();

  // 5. Total Calculations (Indian GST configuration)
  const summaryTop = itemRowTop + 35;
  const subtotal = data.amount / 1.18;
  const gst = data.amount - subtotal;

  doc
    .fillColor(lightTextColor)
    .fontSize(8)
    .font('Helvetica')
    .text('Subtotal:', 340, summaryTop, { width: 100, align: 'right' })
    .text(`INR ${subtotal.toFixed(2)}`, 450, summaryTop, { width: 90, align: 'right' });

  doc
    .fillColor(lightTextColor)
    .fontSize(8)
    .font('Helvetica')
    .text('GST (Integrated 18%):', 340, summaryTop + 15, { width: 100, align: 'right' })
    .text(`INR ${gst.toFixed(2)}`, 450, summaryTop + 15, { width: 90, align: 'right' });

  // Highlight Box for Total Amount
  doc
    .rect(340, summaryTop + 32, 205, 24)
    .fill(headerBgColor);

  doc
    .fillColor(primaryColor)
    .fontSize(9)
    .font('Helvetica-Bold')
    .text('Total Paid:', 350, summaryTop + 39)
    .text(`INR ${data.amount.toFixed(2)}`, 450, summaryTop + 39, { width: 90, align: 'right' });

  // 6. Professional Footer
  const footerTop = 700;
  doc.moveTo(50, footerTop).lineTo(545, footerTop).strokeColor(borderColor).stroke();

  doc
    .fillColor(lightTextColor)
    .fontSize(8)
    .font('Helvetica')
    .text('MedTrackInsight Healthcare Market Analytics System', 50, footerTop + 10)
    .text('Note: This is an automatically generated receipt and does not require physical signature or stamp.', 50, footerTop + 22)
    .text('For support, email: billing@medtrackinsight.com. Thank you for choosing MedTrackInsight.', 50, footerTop + 34);

  // Complete PDF generation
  doc.end();
};
