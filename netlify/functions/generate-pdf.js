// Netlify Function: Generate PDF from Notion page using browserless.io

const BROWSERLESS_API_URL = 'https://production-sfo.browserless.io/pdf';

// Margin presets in CSS units
const MARGIN_PRESETS = {
  none: { top: '0', right: '0', bottom: '0', left: '0' },
  small: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' },
  normal: { top: '1in', right: '1in', bottom: '1in', left: '1in' },
  large: { top: '1.5in', right: '1.5in', bottom: '1.5in', left: '1.5in' }
};

// Validate Notion URL
function isValidNotionUrl(url) {
  try {
    const parsed = new URL(url);
    const validHosts = [
      'notion.so',
      'www.notion.so',
      'notion.site',
      'www.notion.site'
    ];
    // Also allow custom domains that end with notion.site
    return validHosts.includes(parsed.host) || parsed.host.endsWith('.notion.site');
  } catch {
    return false;
  }
}

// Generate CSS for customizations
function generateCustomCSS(options) {
  const { fontFamily, fontSize, lineHeight, hideTitle } = options;

  let css = `
    /* Hide Notion UI elements for cleaner PDF */
    .notion-topbar,
    .notion-cursor-listener > div:first-child,
    .notion-overlay-container,
    .notion-presence-container,
    .notion-selectable-halo,
    .notion-help-button,
    .notion-sidebar-container {
      display: none !important;
    }

    /* Apply custom typography */
    .notion-page-content,
    .notion-text-block,
    .notion-toggle > div,
    .notion-bulleted_list-block,
    .notion-numbered_list-block {
      font-family: ${fontFamily} !important;
      font-size: ${fontSize} !important;
      line-height: ${lineHeight} !important;
    }

    /* Ensure content is readable */
    .notion-page-content {
      max-width: 100% !important;
      padding: 20px !important;
    }

    /* Better print styles */
    @media print {
      body {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
  `;

  // Hide page title and icon if requested
  if (hideTitle) {
    css += `
    /* Hide page icon */
    .notion-page-icon-hero,
    .notion-page-icon-inline,
    .notion-record-icon,
    .notion-collection-page-properties,
    [class*="page-icon"] {
      display: none !important;
    }
    /* Hide cover/header image */
    .notion-page-cover,
    .notion-page-cover-wrapper,
    .notion-cursor-listener > div > div > div:first-child > div:first-child > div:first-child img,
    [class*="page-cover"],
    [class*="pageCover"],
    [class*="cover-image"],
    div[style*="height: 30vh"],
    div[style*="height:30vh"] {
      display: none !important;
    }
    /* Hide the title text */
    .notion-page-block > h1,
    .notion-page-content > div:first-child > div:first-child > h1,
    .notion-scroller h1.notranslate:first-of-type,
    .notion-page-content-inner > div:first-child h1 {
      display: none !important;
    }
    `;
  }

  return css;
}

export async function handler(event) {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Check for API token
  const apiToken = process.env.BROWSERLESS_API_TOKEN;
  if (!apiToken) {
    console.error('BROWSERLESS_API_TOKEN not configured');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'PDF service not configured' })
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid request body' })
    };
  }

  const {
    url, fontFamily, fontSize, lineHeight, margins, pageSize,
    orientation, scale, hideTitle, pageNumbers
  } = body;

  // Validate URL
  if (!url || !isValidNotionUrl(url)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Please provide a valid Notion page URL' })
    };
  }

  // Get margin preset
  const marginConfig = MARGIN_PRESETS[margins] || MARGIN_PRESETS.normal;

  // Generate custom CSS
  const customCSS = generateCustomCSS({
    fontFamily: fontFamily || 'system-ui',
    fontSize: fontSize || '16px',
    lineHeight: lineHeight || '1.6',
    hideTitle: hideTitle || false
  });

  // Build PDF options
  const pdfPrintOptions = {
    format: pageSize || 'A4',
    printBackground: true,
    margin: marginConfig,
    landscape: orientation === 'landscape',
    scale: parseFloat(scale) || 1
  };

  // Add page numbers if requested
  if (pageNumbers) {
    pdfPrintOptions.displayHeaderFooter = true;
    pdfPrintOptions.headerTemplate = '<div></div>';
    pdfPrintOptions.footerTemplate = `
      <div style="width: 100%; font-size: 10px; text-align: center; color: #666;">
        <span class="pageNumber"></span> / <span class="totalPages"></span>
      </div>
    `;
    // Adjust bottom margin for footer if it's too small
    if (margins === 'none' || margins === 'small') {
      pdfPrintOptions.margin.bottom = '0.5in';
    }
  }

  // Browserless.io PDF request payload
  const pdfOptions = {
    url: url,
    gotoOptions: {
      waitUntil: 'networkidle2',
      timeout: 60000
    },
    options: pdfPrintOptions,
    addStyleTag: [
      { content: customCSS }
    ],
    // Wait for Notion page content to load
    waitForSelector: {
      selector: 'div[data-content-editable-root="true"], .notion-page-content, .notion-app-inner',
      timeout: 30000
    },
    // Additional wait for dynamic content
    waitForTimeout: 3000,
    // Continue even if some resources fail
    bestAttempt: true
  };

  console.log('Generating PDF for:', url);

  try {
    const response = await fetch(`${BROWSERLESS_API_URL}?token=${apiToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify(pdfOptions)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Browserless error:', response.status, errorText);

      // Parse error for better messaging
      let errorMessage = 'Failed to generate PDF. Please try again.';
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.message) {
          console.error('Browserless message:', errorJson.message);
        }
        if (errorText.includes('timeout') || errorText.includes('Timeout')) {
          errorMessage = 'The page took too long to load. Please try again.';
        } else if (errorText.includes('net::ERR') || errorText.includes('navigation')) {
          errorMessage = 'Could not access this Notion page. Make sure it\'s shared publicly.';
        }
      } catch {
        // Use default error message
      }

      return {
        statusCode: response.status >= 500 ? 500 : 400,
        body: JSON.stringify({ error: errorMessage })
      };
    }

    const pdfBuffer = await response.arrayBuffer();

    // Extract page title from URL for filename
    let filename = 'notion-page.pdf';
    try {
      const urlParts = url.split('/');
      const lastPart = urlParts[urlParts.length - 1];
      // Remove the ID part (after the last dash)
      const titlePart = lastPart.split('-').slice(0, -1).join('-');
      if (titlePart) {
        filename = `${titlePart}.pdf`;
      }
    } catch {
      // Use default filename
    }

    console.log('PDF generated successfully, size:', pdfBuffer.byteLength);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`
      },
      body: Buffer.from(pdfBuffer).toString('base64'),
      isBase64Encoded: true
    };
  } catch (error) {
    console.error('PDF generation error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to generate PDF. Please try again.' })
    };
  }
}
