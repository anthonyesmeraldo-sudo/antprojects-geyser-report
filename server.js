require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { generateReportHTML } = require('./report-template');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('.'));

const PORT = process.env.PORT || 3000;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@antprojects.co.za';
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = 'anthony.esmeraldo@gmail.com';
const SMTP_PASS = 'jaxdqqdymzfrcvzl';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
async function generatePDF(htmlContent) {
  const tmpFile = path.join(os.tmpdir(), `report-${Date.now()}.html`);
  fs.writeFileSync(tmpFile, htmlContent);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--disable-gpu'],
    headless: 'new',
  });

  try {
    const page = await browser.newPage();
    await page.goto(`file://${tmpFile}`, { waitUntil: 'load' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' },
    });
    return pdf;
  } finally {
    await browser.close();
    fs.unlinkSync(tmpFile);
  }
}

async function sendEmail(pdfBuffer, reportRef, techName) {
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

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

// ── API: Send Report ──
app.post('/api/send-report', async (req, res) => {
  try {
    const data = req.body;
    console.log(`[${new Date().toISOString()}] Generating PDF for ref: ${data.reportRef}`);
    const html = generateReportHTML(data);
    const pdfBuffer = await generatePDF(html);
    console.log(`PDF generated: ${pdfBuffer.length} bytes`);
    const filename = await sendEmail(pdfBuffer, data.reportRef, data.techName);
    console.log(`Email sent: ${filename}`);
    res.json({ success: true, message: `Report sent to ${ADMIN_EMAIL}`, filename });
  } catch (err) {
    console.error('Error:', err.message);
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
