require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { Writable } = require('stream');
const { generateReportHTML } = require('./report-template');

const app = express();
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.static('.'));

const PORT = process.env.PORT || 3000;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@antprojects.co.za';
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465');
const SMTP_USER = process.env.SMTP_USER || 'anthony.esmeraldo@gmail.com';
const SMTP_PASS = process.env.SMTP_PASS || 'jaxdqqdymzfrcvzl';

console.log(`SMTP config: ${SMTP_HOST}:${SMTP_PORT} user=${SMTP_USER}`);

async function generatePDF(data) {
  const PDFDocument = require('pdfkit');

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks = [];
    const stream = new Writable({
      write(chunk, encoding, callback) {
        chunks.push(chunk);
        callback();
      }
    });

    doc.pipe(stream);
    stream.on('finish', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);

    const ORANGE = '#ff9900';
    const BLACK = '#1a1a1a';
    const GREY = '#666666';
    const W = 515;

    // HEADER
    doc.rect(40, 40, W, 50).fill(BLACK);
    doc.fillColor(ORANGE).font('Helvetica-Bold').fontSize(20)
      .text('Ant | Projects PTY (LTD)', 40, 52, { align: 'center', width: W });
    doc.fillColor('#aaaaaa').font('Helvetica').fontSize(8)
      .text('Renovations | Plumbing | Electrical | 061 026 7185 | admin@antprojects.co.za', 40, 76, { align: 'center', width: W });

    // TITLE
    doc.rect(40, 100, W, 28).fill('#f0f0f0');
    doc.fillColor(ORANGE).font('Helvetica-Bold').fontSize(13)
      .text('GEYSER DAMAGE & INSTALLATION REPORT', 40, 108, { align: 'center', width: W });
    doc.fillColor(GREY).font('Helvetica').fontSize(8)
      .text(`REF: ${data.reportRef || '—'}   |   Generated: ${new Date().toLocaleString('en-ZA')}`, 40, 132, { align: 'center', width: W });

    doc.moveDown(0.5);

    const section = (title) => {
      doc.moveDown(0.4);
      const y = doc.y;
      doc.rect(40, y, W, 18).fill(ORANGE);
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(10)
        .text(title, 48, y + 4);
      doc.moveDown(0.8);
    };

    const row = (label, value) => {
      if (!value) return;
      const y = doc.y;
      doc.fillColor(GREY).font('Helvetica').fontSize(8).text(label, 48, y, { width: 160 });
      doc.fillColor(BLACK).font('Helvetica-Bold').fontSize(9).text(String(value), 220, y, { width: 320 });
      doc.moveDown(0.5);
    };

    section('1. JOB INFORMATION');
    row('Technician', data.techName);
    row('Date', data.jobDate);
    row('Time on Site', data.jobTime);
    row('Property Address', data.siteAddress);
    row('Contact Number', data.clientPhone);
    row('Email', data.clientEmail);
    row('Claim / Insurance No.', data.claimNumber);

    section('2. EXISTING GEYSER DETAILS');
    row('Make / Brand', data.bMake);
    row('Serial Number', data.bSerial);
    row('Capacity', data.bCapacity);
    row('Type', data.bType);
    row('Location', data.bLocation);
    row('Element Size', data.bElement);
    row('Approximate Age', data.bAge ? data.bAge + ' years' : '');
    row('Thermostat Setting', data.bThermostat ? data.bThermostat + '°C' : '');
    row('PRV Status', data.bPrv);
    row('Drip Tray', data.bDrip);
    row('Geyser Blanket', data.bBlanket);
    row('Notes', data.bNotes);

    if (data.bRecommendation) {
      section('TECHNICIAN RECOMMENDATION');
      row('Assessment', data.bRecommendation);
      row('Notes', data.bRecNotes);
    }

    section('3. DAMAGE REPORT');
    row('Primary Cause', data.dCause);
    row('Affected Components', data.dAffected);
    row('Other Areas', data.dOther);
    row('Damage Description', data.dDescription);

    section('4. NEW GEYSER INSTALLATION');
    row('Make / Brand', data.aMake);
    row('Serial Number', data.aSerial);
    row('Capacity', data.aCapacity);
    row('Type', data.aType);
    row('Element Size', data.aElement);
    row('Thermostat Set To', data.aThermostat ? data.aThermostat + '°C' : '');
    row('Warranty', data.aWarranty ? data.aWarranty + ' years' : '');
    row('Materials / Parts Used', data.aMaterials);
    row('Installation Checklist', data.aInstallChecklist);
    row('Technician Notes', data.aNotes);

    section('5. CLIENT SIGN-OFF');
    row('Client Printed Name', data.clientSigName);
    row('Final Remarks', data.finalRemarks);

    // ── PHOTO GRID HELPER ──
    const photoGrid = (photos, title) => {
      if (!photos || photos.length === 0) return;

      const COLS = 3;
      const GAP = 8;
      const BORDER = 2;
      const imgW = Math.floor((W - (GAP * (COLS - 1))) / COLS); // ~163px
      const imgH = Math.floor(imgW * 0.75); // 4:3 ratio ~122px
      const pageBottom = doc.page.height - doc.page.margins.bottom - 10;

      // Add new page if less than 100px space left
      if (doc.y + 30 + imgH > pageBottom) doc.addPage();

      // Section heading (absolute position)
      const secY = doc.y + 6;
      doc.rect(40, secY, W, 20).fill(ORANGE);
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(10)
        .text(title, 48, secY + 5, { width: W - 16 });

      let curY = secY + 28; // start photos below heading
      let col = 0;
      let rowY = curY;

      photos.forEach((src) => {
        try {
          const base64 = src.replace(/^data:image\/\w+;base64,/, '');
          const buf = Buffer.from(base64, 'base64');

          // New page if not enough room
          if (col === 0 && rowY + imgH > pageBottom) {
            doc.addPage();
            rowY = 40;
          }

          const x = 40 + col * (imgW + GAP);
          const y = rowY;

          // White background
          doc.rect(x, y, imgW, imgH).fill('#ffffff');
          // Photo
          doc.image(buf, x + BORDER, y + BORDER, {
            width: imgW - BORDER * 2,
            height: imgH - BORDER * 2,
            cover: [imgW - BORDER * 2, imgH - BORDER * 2],
          });
          // Border
          doc.rect(x, y, imgW, imgH).strokeColor('#cccccc').lineWidth(1).stroke();

          col++;
          if (col >= COLS) {
            col = 0;
            rowY += imgH + GAP;
          }
        } catch(e) {
          console.error('Photo render error:', e.message);
        }
      });

      // Move doc.y past the last row
      if (col > 0) rowY += imgH + GAP;
      doc.y = rowY + 10;
    };

    photoGrid(data.beforePhotos, 'PHOTOS — DAMAGED GEYSER');
    photoGrid(data.afterPhotos, 'PHOTOS — AFTER INSTALLATION');

    // FOOTER
    doc.moveDown(1);
    const footerY = doc.y;
    doc.rect(40, footerY, W, 1).fill(ORANGE);
    doc.moveDown(0.3);
    doc.fillColor(GREY).font('Helvetica').fontSize(8)
      .text('Ant | Projects PTY (LTD)  |  061 026 7185  |  admin@antprojects.co.za  |  www.antprojects.co.za',
        40, doc.y, { align: 'center', width: W });

    doc.end();
  });
}

async function sendEmail(pdfBuffer, reportRef, techName) {
  console.log(`Attempting email to ${ADMIN_EMAIL} via ${SMTP_HOST}:${SMTP_PORT}`);

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: true,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  // Verify connection first
  await transporter.verify();
  console.log('SMTP connection verified');

  const filename = `Geyser-Report-${reportRef}.pdf`;

  await transporter.sendMail({
    from: `"Ant Projects Field Report" <${SMTP_USER}>`,
    to: ADMIN_EMAIL,
    subject: `Geyser Damage Report — ${reportRef} — ${techName || 'Technician'}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:500px;">
        <div style="background:#1a1a1a;color:#ff9900;padding:16px;text-align:center;">
          <strong style="font-size:18px;">Ant | Projects PTY (LTD)</strong>
        </div>
        <div style="padding:20px;border:1px solid #e0e0e0;">
          <p>Please find attached the <strong>Geyser Damage &amp; Installation Report</strong>.</p>
          <table style="width:100%;margin-top:12px;font-size:13px;">
            <tr><td style="color:#888;padding:4px 0;">Report Ref:</td><td><strong>${reportRef}</strong></td></tr>
            <tr><td style="color:#888;padding:4px 0;">Technician:</td><td>${techName || '—'}</td></tr>
            <tr><td style="color:#888;padding:4px 0;">Generated:</td><td>${new Date().toLocaleString('en-ZA')}</td></tr>
          </table>
        </div>
        <div style="background:#f5f5f0;padding:12px;text-align:center;font-size:11px;color:#888;">
          Ant | Projects PTY (LTD) | 061 026 7185 | admin@antprojects.co.za
        </div>
      </div>`,
    attachments: [{ filename, content: pdfBuffer, contentType: 'application/pdf' }],
  });

  return filename;
}

app.post('/api/send-report', async (req, res) => {
  try {
    const data = req.body;
    console.log(`[${new Date().toISOString()}] Generating PDF for ref: ${data.reportRef}`);
    const pdfBuffer = await generatePDF(data);
    console.log(`PDF generated: ${pdfBuffer.length} bytes`);
    const filename = await sendEmail(pdfBuffer, data.reportRef, data.techName);
    console.log(`Email sent successfully: ${filename}`);
    res.json({ success: true, message: `Report sent to ${ADMIN_EMAIL}`, filename });
  } catch (err) {
    console.error('FULL ERROR:', err.message);
    console.error('ERROR CODE:', err.code);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── API: Download PDF ──
app.post('/api/generate-pdf', async (req, res) => {
  try {
    const data = req.body;
    console.log(`[${new Date().toISOString()}] Generating download PDF for ref: ${data.reportRef}`);
    const pdfBuffer = await generatePDF(data);
    console.log(`PDF ready for download: ${pdfBuffer.length} bytes`);
    const filename = `Geyser-Report-${data.reportRef || 'Report'}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('PDF Error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Ant Projects Report Server on http://localhost:${PORT}`);
});

module.exports = app;
