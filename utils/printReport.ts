// Utility function to generate print report HTML
export function generatePrintReportHTML(thermalData: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <title>Unpaid Invoices Report</title>
  <style>
body { 
  font-family: 'Courier New', monospace; 
  font-size: 8px; 
  line-height: 1.2;
  margin: 2mm;
  padding: 2mm;
  white-space: pre-line;
  background: white;
  width: 58mm;
  max-width: 58mm;
  text-align: center;
  letter-spacing: 0px;
}

.header-section {
  text-align: center;
  margin: 0;
  padding: 0;
  width: 100%;
}

.data-section {
  text-align: left;
  margin: 0;
  padding: 0;
  width: 100%;
  line-height: 1.1;
}

.data-section .service-item {
  display: flex;
  justify-content: space-between;
  width: 100%;
}
    @media print {
      body { 
        margin: 1mm; 
        padding: 1mm; 
        width: 58mm;
        max-width: 58mm;
        font-size: 7px;
        line-height: 1.0;
      }
      .header-section {
        margin: 0;
        padding: 0;
        line-height: 1.0;
      }
      .data-section {
        margin: 0;
        padding: 0;
        line-height: 1.0;
        width: 100%;
        text-align: left;
      }
      @page {
        size: 58mm auto;
        margin: 1mm;
      }
    }
    .print-controls {
      position: fixed;
      top: 10px;
      right: 10px;
      z-index: 1000;
      background: white;
      padding: 10px;
      border: 1px solid #ccc;
      border-radius: 5px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .print-controls button {
      margin: 5px;
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      display: block;
      width: 100%;
      margin-bottom: 5px;
    }
    .print-btn {
      background: #007bff;
      color: white;
    }
    .pdf-btn {
      background: #28a745;
      color: white;
    }
    .close-btn {
      background: #6c757d;
      color: white;
    }
    @media print {
      .print-controls { display: none; }
      body {
        -webkit-print-color-adjust: exact;
        color-adjust: exact;
      }
    }
    
    /* Thermal printer specific styles */
    @media print {
      * {
        box-sizing: border-box;
      }
        body {
          font-family: 'Courier New', 'Monaco', 'Menlo', monospace;
          font-size: 7px;
          line-height: 1.0;
          margin: 1mm;
          padding: 1mm;
          width: 58mm;
          max-width: 58mm;
          text-align: center;
          color: black;
          background: white;
        }
        .header-section {
          margin: 0;
          padding: 0;
          line-height: 1.0;
          width: 100%;
          text-align: center;
        }
        .data-section {
          margin: 0;
          padding: 0;
          line-height: 1.0;
          width: 100%;
          text-align: left;
        }
        .data-section .service-item {
          display: block;
          width: 100%;
        }
        /* Add spacing between invoices for easier cutting */
        .invoice-separator {
          margin: 10mm 0;
          page-break-before: auto;
        }
    }
  </style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
</head>
<body>
  <div class="print-controls">
    <button class="print-btn" onclick="window.print()">🖨️ Print</button>
    <button class="pdf-btn" onclick="saveAsPDF()">📄 Save as PDF</button>
    <button class="close-btn" onclick="window.close()">❌ Close</button>
  </div>
  ${thermalData}
  
  <script>
    async function saveAsPDF() {
      try {
        const pdfBtn = document.querySelector('.pdf-btn');
        if (pdfBtn) {
          const originalText = pdfBtn.textContent;
          pdfBtn.textContent = 'Generating PDF...';
          pdfBtn.disabled = true;
        }
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: [58, 297] // 58mm width x 297mm height for thermal printer
        });
        
        // Get the content without print controls
        const contentDiv = document.createElement('div');
        contentDiv.innerHTML = document.body.innerHTML
          .replace(/<div class="print-controls">[\\s\\S]*?<\\/div>/g, '')
          .replace(/<script[\\s\\S]*?<\\/script>/g, '')
          .replace(/<style[\\s\\S]*?<\\/style>/g, '');
        
        // Process each section with proper alignment
        const headerSections = contentDiv.querySelectorAll('.header-section');
        const dataSections = contentDiv.querySelectorAll('.data-section');
        
        let y = 2; // Start very close to top edge
        const pageHeight = doc.internal.pageSize.height;
        const lineHeight = 5; // Very tight line spacing
        const pageWidth = doc.internal.pageSize.width;
        const centerX = pageWidth / 2;
        
        doc.setFont('courier');
        doc.setFontSize(7); // Slightly larger font to fill width better
        
        // Process sections in order - each invoice should have its own header + data
        const allSections = contentDiv.querySelectorAll('.header-section, .data-section');
        
        allSections.forEach((section, sectionIndex) => {
          const lines = section.textContent?.split('\\n') || [];
          lines.forEach(line => {
            const trimmedLine = line.trim();
            if (trimmedLine) {
              if (y > pageHeight - 2) {
                doc.addPage();
                y = 2;
              }
              
              // Check if this is a header section (company info, customer info)
              if (section.classList.contains('header-section')) {
                // Center the text for headers
                const textWidth = doc.getTextWidth(trimmedLine);
                const x = (pageWidth - textWidth) / 2;
                doc.text(trimmedLine, x, y);
              } else {
                // For data sections, use left alignment
                doc.text(trimmedLine, 1, y);
              }
              y += lineHeight;
            }
          });
          
          // Add extra spacing between invoices (every 2 sections: header + data = 1 invoice)
          if (sectionIndex > 0 && (sectionIndex + 1) % 2 === 0) {
            y += lineHeight * 3; // Add extra spacing between invoices
          }
        });
        
        const fileName = 'unpaid-invoices-report-' + new Date().toISOString().split('T')[0] + '.pdf';
        doc.save(fileName);
        alert('PDF saved successfully as ' + fileName);
        
      } catch (error) {
        console.error('PDF generation error:', error);
        alert('Error generating PDF: ' + (error?.message || 'Unknown error'));
      } finally {
        const pdfBtn = document.querySelector('.pdf-btn');
        if (pdfBtn) {
          pdfBtn.textContent = '📄 Save as PDF';
          pdfBtn.disabled = false;
        }
      }
    }
    
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      document.addEventListener('DOMContentLoaded', function() {
        const controls = document.querySelector('.print-controls');
        if (controls) {
          controls.style.position = 'relative';
          controls.style.top = 'auto';
          controls.style.right = 'auto';
          controls.style.margin = '10px';
          controls.style.textAlign = 'center';
        }
      });
    }
  </script>
</body>
</html>`
}
