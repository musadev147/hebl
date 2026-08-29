// We are dropping html2pdf.js because it fundamentally conflicts with this React DOM 
// and hangs infinitely, which causes the UI to break and the PDF to be blank.
// Instead, we use a bulletproof hidden iframe approach for native Print-to-PDF.

export const downloadAsPDF = (elementId, filename) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    alert('Error: Could not find the content to download.');
    return;
  }
  
  // Create a hidden iframe
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);
  
  const content = element.innerHTML;
  const doc = iframe.contentWindow.document;
  
  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${filename}</title>
        <style>
          /* Clean, professional A4 styling */
          body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 20px; background: #fff; color: #000; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
          th, td { border: 1px solid #ddd; padding: 10px 8px; text-align: left; }
          th { background-color: #f4f6f8; font-weight: bold; color: #333; text-transform: uppercase; font-size: 11px; }
          tr:nth-child(even) { background-color: #fafafa; }
          h2, h3, p { margin: 0 0 8px 0; text-align: center; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .font-bold { font-weight: bold; }
          @page { size: A4 portrait; margin: 15mm; }
          body { padding-bottom: 120px; }
          .common-print-footer {
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100%;
            background: white;
            padding: 10px 15px;
            font-size: 11px;
            line-height: 1.4;
            color: #000;
            box-sizing: border-box;
          }
          .common-print-footer p { margin: 0 0 3px 0; }
          .common-print-footer .footer-phone { font-weight: bold; margin-top: 5px; }
        </style>
      </head>
      <body>
        ${content}
      </body>
    </html>
  `);
  doc.close();
  
  // Trigger the print dialog safely
  setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    
    // Cleanup after print dialog closes
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 1000);
  }, 250);
};
