import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateReportPDF = (report) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const content = report.content || {};
  const caseSummary = content.case_summary || report.summary || "No summary details available.";
  const bnsSections = content.applicable_bns_sections || [];
  const procedure = content.investigation_procedure || [];
  const evidence = content.required_evidence || [];
  const precautions = content.legal_precautions || [];

  // Branding Colors
  const primaryColor = [17, 24, 39]; // Slate 900 (deep navy accent)
  const textColor = [51, 51, 51]; // Charcoal
  const headingColor = [30, 41, 59]; // Slate 800

  // Draw Header
  const drawHeader = (doc) => {
    // Top colored banner
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 15, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('👮 AI INVESTIGATION ASSISTANT', 15, 9.5);
    
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text('CONFIDENTIAL // LAW ENFORCEMENT & LEGAL USE ONLY', 130, 9.5);
  };

  // Draw Footer
  const drawFooter = (doc, pageNum, totalPages) => {
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.3);
    doc.line(15, 280, 195, 280);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // slate-400
    const dateStr = new Date(report.created_at).toLocaleString('en-IN');
    doc.text(`System Generated: ${dateStr}`, 15, 285);
    doc.text(`Page ${pageNum} of ${totalPages}`, 180, 285);
  };

  // --- Page 1 Setup ---
  drawHeader(doc);

  // Document Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...headingColor);
  doc.text(report.title || 'Case Investigation Report', 15, 30);

  // Subtitle
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text('OFFICIAL CASE REPORT RECORD', 15, 35);

  // Metadata Table Grid
  const metaRows = [
    [
      { content: 'Report ID', styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } },
      report.id || '—',
      { content: 'Report Type', styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } },
      (report.report_type || '—').replace(/_/g, ' ').toUpperCase()
    ],
    [
      { content: 'Case ID', styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } },
      report.case_id || '—',
      { content: 'Officer Name', styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } },
      report.created_by_name || 'System Generated'
    ],
    [
      { content: 'Generated Date', styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } },
      new Date(report.created_at).toLocaleDateString('en-IN'),
      { content: 'Status', styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } },
      report.is_finalized ? 'FINALIZED' : 'DRAFT'
    ],
  ];

  autoTable(doc, {
    startY: 38,
    margin: { left: 15, right: 15 },
    body: metaRows,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2.5, font: 'helvetica', textColor: [71, 85, 105] },
    columnStyles: {
      0: { width: 30 },
      1: { width: 60 },
      2: { width: 30 },
      3: { width: 60 },
    },
  });

  let currentY = doc.lastAutoTable.finalY + 10;

  // 1. Executive Summary
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...headingColor);
  doc.text('1. Executive Case Summary', 15, currentY);
  
  doc.setLineWidth(0.4);
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.line(15, currentY + 2, 195, currentY + 2);
  currentY += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...textColor);
  
  const summaryLines = doc.splitTextToSize(caseSummary, 180);
  doc.text(summaryLines, 15, currentY);
  currentY += (summaryLines.length * 4.5) + 10;

  // 2. Applicable BNS Sections
  if (currentY > 230) {
    doc.addPage();
    drawHeader(doc);
    currentY = 25;
  }

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...headingColor);
  doc.text('2. Applicable BNS / IPC Sections', 15, currentY);
  doc.line(15, currentY + 2, 195, currentY + 2);
  currentY += 6;

  if (bnsSections.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text('No BNS sections specified in this report.', 15, currentY);
    currentY += 10;
  } else {
    const bnsBody = bnsSections.map((sec, idx) => [idx + 1, sec]);
    autoTable(doc, {
      startY: currentY,
      margin: { left: 15, right: 15 },
      head: [['#', 'Section Details']],
      body: bnsBody,
      theme: 'striped',
      headStyles: { fillColor: primaryColor, fontSize: 8.5, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2.5, textColor: [51, 51, 51] },
      columnStyles: { 0: { width: 10 }, 1: { cellWidth: 'auto' } },
    });
    currentY = doc.lastAutoTable.finalY + 10;
  }

  // 3. Investigation Procedure
  if (currentY > 230) {
    doc.addPage();
    drawHeader(doc);
    currentY = 25;
  }

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...headingColor);
  doc.text('3. Recommended Investigation Procedure', 15, currentY);
  doc.line(15, currentY + 2, 195, currentY + 2);
  currentY += 6;

  if (procedure.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text('No investigation steps specified in this report.', 15, currentY);
    currentY += 10;
  } else {
    const procBody = procedure.map((step, idx) => [idx + 1, step]);
    autoTable(doc, {
      startY: currentY,
      margin: { left: 15, right: 15 },
      head: [['Step', 'Procedure Description']],
      body: procBody,
      theme: 'striped',
      headStyles: { fillColor: primaryColor, fontSize: 8.5, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2.5, textColor: [51, 51, 51] },
      columnStyles: { 0: { width: 15 }, 1: { cellWidth: 'auto' } },
    });
    currentY = doc.lastAutoTable.finalY + 10;
  }

  // 4. Evidence Checklist
  if (currentY > 230) {
    doc.addPage();
    drawHeader(doc);
    currentY = 25;
  }

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...headingColor);
  doc.text('4. Required Evidence Checklist', 15, currentY);
  doc.line(15, currentY + 2, 195, currentY + 2);
  currentY += 6;

  if (evidence.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text('No evidence items specified in this report.', 15, currentY);
    currentY += 10;
  } else {
    const evBody = evidence.map((ev, idx) => [idx + 1, '[  ]   ' + ev]);
    autoTable(doc, {
      startY: currentY,
      margin: { left: 15, right: 15 },
      head: [['#', 'Evidence Item Description']],
      body: evBody,
      theme: 'striped',
      headStyles: { fillColor: primaryColor, fontSize: 8.5, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2.5, textColor: [51, 51, 51] },
      columnStyles: { 0: { width: 10 }, 1: { cellWidth: 'auto' } },
    });
    currentY = doc.lastAutoTable.finalY + 10;
  }

  // 5. Legal Precautions
  if (currentY > 230) {
    doc.addPage();
    drawHeader(doc);
    currentY = 25;
  }

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...headingColor);
  doc.text('5. Legal Precautions & Safeguards', 15, currentY);
  doc.line(15, currentY + 2, 195, currentY + 2);
  currentY += 6;

  if (precautions.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text('No precautions specified in this report.', 15, currentY);
    currentY += 15;
  } else {
    const precBody = precautions.map((p, idx) => [idx + 1, 'WARNING: ' + p]);
    autoTable(doc, {
      startY: currentY,
      margin: { left: 15, right: 15 },
      head: [['#', 'Precautions Details']],
      body: precBody,
      theme: 'striped',
      headStyles: { fillColor: primaryColor, fontSize: 8.5, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2.5, textColor: [51, 51, 51] },
      columnStyles: { 0: { width: 10 }, 1: { cellWidth: 'auto' } },
    });
    currentY = doc.lastAutoTable.finalY + 10;
  }

  // Disclaimer Box
  if (currentY > 240) {
    doc.addPage();
    drawHeader(doc);
    currentY = 25;
  }

  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.rect(15, currentY, 180, 22, 'FD');

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139); // slate-500
  const disclaimerText = doc.splitTextToSize(
    'Disclaimer: This report is generated by an artificial intelligence system for investigation support purposes. All findings, legal recommendations, and procedures must be verified by a qualified human officer before taking official action.',
    170
  );
  doc.text(disclaimerText, 20, currentY + 6);

  // Add Page Numbers and Header/Footer for all pages
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    if (i > 1) {
      drawHeader(doc);
    }
    drawFooter(doc, i, totalPages);
  }

  // Trigger download
  const filename = `${report.title?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'report'}.pdf`;
  doc.save(filename);
};
