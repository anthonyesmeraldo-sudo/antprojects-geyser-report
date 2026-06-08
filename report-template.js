function generateReportHTML(data) {
  const {
    techName, jobDate, jobTime, siteAddress, clientPhone, clientEmail,
    claimNumber, bMake, bSerial, bCapacity, bType, bLocation,
    bElement, bAge, bThermostat, bPrv, bDrip, bBlanket, bNotes,
    bRecommendation, bRecNotes, beforePhotos,
    dCause, dAffected, dOther, dDescription,
    aMake, aSerial, aCapacity, aType, aElement,
    aThermostat, aWarranty, aMaterials, aInstallChecklist, aNotes,
    afterPhotos, clientSigName, finalRemarks, reportRef
  } = data;

  const row = (label, value) => value ? `
    <tr>
      <td style="padding:5px 10px;font-size:11px;color:#666;font-family:'Courier New',monospace;text-transform:uppercase;width:38%;border-bottom:1px solid #f5f5f5;">${label}</td>
      <td style="padding:5px 10px;font-size:12px;color:#1a1a1a;font-weight:600;border-bottom:1px solid #f5f5f5;">${value}</td>
    </tr>` : '';

  const sectionTitle = (title) => `
    <tr>
      <td colspan="2" style="padding:10px 10px 4px;font-family:'Arial',sans-serif;font-size:12px;font-weight:700;color:#ff9900;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #ff9900;">
        ${title}
      </td>
    </tr>`;

  const recColors = {
    'Beyond Repair': { bg: '#fff5f5', border: '#ef4444', color: '#b91c1c' },
    'Repairable': { bg: '#fff7ed', border: '#f97316', color: '#c2410c' },
    'Electrical': { bg: '#fefce8', border: '#eab308', color: '#a16207' },
    'Structural': { bg: '#fefce8', border: '#eab308', color: '#a16207' },
    'Under Warranty': { bg: '#eff6ff', border: '#3b82f6', color: '#1d4ed8' },
    'Insurance': { bg: '#eff6ff', border: '#3b82f6', color: '#1d4ed8' },
  };
  const recKey = Object.keys(recColors).find(k => (bRecommendation || '').startsWith(k));
  const rec = recColors[recKey] || { bg: '#f9fafb', border: '#6b7280', color: '#374151' };

  const photoGrid = (photos) => {
    if (!photos || photos.length === 0) return '<p style="font-size:11px;color:#999;margin:4px 0;">No photos captured</p>';
    return `<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:6px;">
      ${photos.map(p => `<img src="${p}" style="width:160px;height:120px;object-fit:cover;border-radius:4px;border:1px solid #e0e0e0;" />`).join('')}
    </div>`;
  };

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; background: #fff; color: #1a1a1a; font-size: 12px; }
  .page { max-width: 800px; margin: 0 auto; padding: 24px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
</style>
</head>
<body>
<div class="page">

  <!-- HEADER -->
  <div style="text-align:center;border-bottom:3px solid #ff9900;padding-bottom:12px;margin-bottom:6px;">
    <div style="font-size:28px;font-weight:700;letter-spacing:1px;color:#1a1a1a;">
      Ant <span style="color:#ff9900;">|</span> Projects PTY (LTD)
    </div>
    <div style="font-size:9px;color:#555;margin-top:4px;letter-spacing:0.5px;">
      <span style="color:#ff9900;">|</span> Renovations
      <span style="color:#ff9900;">|</span> Plumbing
      <span style="color:#ff9900;">|</span> Electrical
      <span style="color:#ff9900;">|</span> 061 026 7185
      <span style="color:#ff9900;">|</span> Building Maintenance
      <span style="color:#ff9900;">|</span> admin@antprojects.co.za
      <span style="color:#ff9900;">|</span> www.antprojects.co.za
      <span style="color:#ff9900;">|</span>
    </div>
  </div>

  <!-- TITLE BAND -->
  <div style="background:#1a1a1a;color:#ff9900;text-align:center;padding:8px 16px;margin-bottom:16px;">
    <div style="font-size:15px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Geyser Damage &amp; Installation Report</div>
    <div style="font-size:9px;color:#aaa;margin-top:2px;font-family:'Courier New',monospace;">REF: ${reportRef} &nbsp;|&nbsp; Generated: ${new Date().toLocaleString('en-ZA')}</div>
  </div>

  <!-- JOB INFO -->
  <table>
    ${sectionTitle('1. Job Information')}
    ${row('Technician', techName)}
    ${row('Date', jobDate)}
    ${row('Time on Site', jobTime)}
    ${row('Property Address', siteAddress)}
    ${row('Contact Number', clientPhone)}
    ${row('Email', clientEmail)}
    ${row('Claim / Insurance No.', claimNumber)}
  </table>

  <!-- GEYSER BEFORE -->
  <table>
    ${sectionTitle('2. Existing Geyser Details')}
    ${row('Make / Brand', bMake)}
    ${row('Serial Number', bSerial)}
    ${row('Capacity', bCapacity)}
    ${row('Type', bType)}
    ${row('Location', bLocation)}
    ${row('Element Size', bElement)}
    ${row('Approximate Age', bAge ? bAge + ' years' : '')}
    ${row('Thermostat Setting', bThermostat ? bThermostat + '°C' : '')}
    ${row('PRV Status', bPrv)}
    ${row('Drip Tray', bDrip)}
    ${row('Geyser Blanket', bBlanket)}
    ${row('Notes', bNotes)}
  </table>

  <!-- PHOTOS BEFORE -->
  <div style="margin-bottom:16px;">
    <div style="font-size:12px;font-weight:700;color:#ff9900;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #ff9900;padding-bottom:4px;margin-bottom:8px;">Photos of Damaged Geyser</div>
    ${photoGrid(beforePhotos)}
  </div>

  <!-- RECOMMENDATION -->
  ${bRecommendation ? `
  <div style="margin-bottom:16px;padding:12px 14px;border-radius:4px;border-left:4px solid ${rec.border};background:${rec.bg};color:${rec.color};">
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">🔧 Technician Recommendation</div>
    <div style="font-size:13px;font-weight:700;">${bRecommendation}</div>
    ${bRecNotes ? `<div style="font-size:11px;margin-top:4px;">${bRecNotes}</div>` : ''}
  </div>` : ''}

  <!-- DAMAGE REPORT -->
  <table>
    ${sectionTitle('3. Damage Report')}
    ${row('Primary Cause', dCause)}
    ${row('Affected Components', dAffected)}
    ${row('Other Areas', dOther)}
  </table>
  ${dDescription ? `
  <div style="margin-bottom:16px;">
    <div style="font-size:10px;color:#999;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:4px;font-family:'Courier New',monospace;">Damage Description</div>
    <div style="font-size:12px;background:#f9f9f9;padding:10px 12px;border-radius:4px;border-left:3px solid #ff9900;line-height:1.6;">${dDescription}</div>
  </div>` : ''}

  <!-- NEW INSTALLATION -->
  <table>
    ${sectionTitle('4. New Geyser Installation')}
    ${row('Make / Brand', aMake)}
    ${row('Serial Number', aSerial)}
    ${row('Capacity', aCapacity)}
    ${row('Type', aType)}
    ${row('Element Size', aElement)}
    ${row('Thermostat Set To', aThermostat ? aThermostat + '°C' : '')}
    ${row('Warranty', aWarranty ? aWarranty + ' years' : '')}
    ${row('Materials / Parts Used', aMaterials)}
    ${row('Installation Checklist', aInstallChecklist)}
    ${row('Technician Notes', aNotes)}
  </table>

  <!-- PHOTOS AFTER -->
  <div style="margin-bottom:16px;">
    <div style="font-size:12px;font-weight:700;color:#ff9900;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #ff9900;padding-bottom:4px;margin-bottom:8px;">Photos — After Installation</div>
    ${photoGrid(afterPhotos)}
  </div>

  <!-- SIGN OFF -->
  <table>
    ${sectionTitle('5. Client Sign-off')}
    ${row('Client Printed Name', clientSigName)}
    ${row('Final Remarks', finalRemarks)}
  </table>

  <!-- FOOTER -->
  <div style="border-top:2px solid #ff9900;padding-top:10px;text-align:center;font-size:9px;color:#888;font-family:'Courier New',monospace;">
    Ant | Projects PTY (LTD) &nbsp;|&nbsp; 061 026 7185 &nbsp;|&nbsp; admin@antprojects.co.za &nbsp;|&nbsp; www.antprojects.co.za
  </div>

</div>
</body>
</html>`;
}

module.exports = { generateReportHTML };
