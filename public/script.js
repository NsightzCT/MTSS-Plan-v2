// Add rate limiting variables at the top of the file
let lastApiCallTime = 0;
const MIN_API_CALL_INTERVAL = 1000; // Minimum 1 second between API calls

// Add API endpoint configuration
const API_ENDPOINT = '/api/chat';
const RESOURCE_ENDPOINT = '/api/generate-resource';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// DOM Elements
const messagesContainer = document.getElementById('messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const suggestedButtonsContainer = document.getElementById('suggested-buttons');
const schoolLevelSelect = document.getElementById('school-level');
const resourcePreviewContainer = document.getElementById('resource-preview-container');
const resourceContent = document.getElementById('resource-content');
const downloadPdfButton = document.getElementById('download-pdf');
const exportGoogleDocsButton = document.getElementById('export-google-docs');
const backToChatButton = document.getElementById('back-to-chat');
const ctaBanner = document.getElementById('cta-banner');
const ctaButton = document.getElementById('cta-button');
const ctaClose = document.getElementById('cta-close');
const loadingModal = document.getElementById('loading-modal');

// State
let conversationHistory = [];
let currentResourceType = null;
let markdownConverter = new showdown.Converter({
  tables: true,
  tasklists: true,
  strikethrough: true
});

// Main Functions
async function sendMessage(message, retryCount = 0) {
  try {
    // Add loading message
    const loadingMessage = addMessage('Thinking...', 'assistant', true);

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [...conversationHistory, { sender: 'user', text: message }],
        userSchoolLevel: schoolLevelSelect.value,
        resourceType: currentResourceType
      })
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Please wait a moment before making another request. The system is processing your previous request.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }

    // Remove loading message
    messagesContainer.removeChild(loadingMessage);

    // Add assistant response to UI
    addMessage(data.text, 'assistant');

    // Update suggested buttons
    if (data.suggestedButtons && data.suggestedButtons.length > 0) {
      updateSuggestedButtons(data.suggestedButtons);
    }

    // Show generate resource button if we've had enough exchanges
    if (conversationHistory.length >= 6 && !document.getElementById('generate-resource-button')) {
      const actionButtonsContainer = document.querySelector('.action-buttons-container');
      if (actionButtonsContainer) {
        const generateButton = document.createElement('button');
        generateButton.id = 'generate-resource-button';
        generateButton.innerHTML = '<i class="fas fa-file-alt"></i> Generate Resource';
        generateButton.style.backgroundColor = '#EC913D';
        generateButton.style.color = 'white';
        generateButton.style.padding = '12px 20px';
        generateButton.style.borderRadius = '30px';
        generateButton.style.border = 'none';
        generateButton.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
        generateButton.style.display = 'inline-flex';
        generateButton.style.alignItems = 'center';
        generateButton.style.justifyContent = 'center';
        generateButton.style.cursor = 'pointer';
        generateButton.style.transition = 'background-color 0.3s ease';
        generateButton.style.fontFamily = 'Poppins, sans-serif';
        generateButton.style.fontSize = '0.9rem';
        generateButton.style.fontWeight = '500';

        generateButton.addEventListener('mouseenter', function() {
          this.style.backgroundColor = '#D9802D';
        });

        generateButton.addEventListener('mouseleave', function() {
          this.style.backgroundColor = '#EC913D';
        });

        generateButton.addEventListener('click', generateResource);
        actionButtonsContainer.appendChild(generateButton);
      }
    }

    // Scroll to bottom of messages
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Show CTA banner after a few exchanges
    if (conversationHistory.length >= 6 && ctaBanner.style.display === 'none') {
      setTimeout(() => {
        ctaBanner.style.display = 'flex';
      }, 2000);
    }
  } catch (error) {
    console.error(`API call error (attempt ${retryCount + 1}):`, error);
    
    if (retryCount < 2) {
      // Wait for 2 seconds before retrying
      await new Promise(resolve => setTimeout(resolve, 2000));
      return sendMessage(message, retryCount + 1);
    }
    
    throw error;
  }
}

async function generateResource() {
  // Show loading modal
  loadingModal.classList.add('active');

  const loadingContent = loadingModal.querySelector('.loading-content');
  if (loadingContent) {
    const spinner = loadingContent.querySelector('.spinner');
    if (spinner) {
      spinner.style.borderTopColor = '#3da0ad';
    }

    const loadingText = loadingContent.querySelector('p');
    if (loadingText) {
      loadingText.textContent = 'Generating your resource...';
      loadingText.style.color = '#3da0ad';
      loadingText.style.fontWeight = 'bold';
    }
  }

  try {
    // Create resource based on type
    let resourceTemplate = '';
    let resourceTitle = '';

    if (currentResourceType === 'interventionMenu') {
      resourceTemplate = await fetchNsightzTemplate('interventionMenu');
      resourceTitle = 'Intervention Menu';
    } else if (currentResourceType === 'studentPlan') {
      resourceTemplate = await fetchNsightzTemplate('studentPlan');
      resourceTitle = 'Student Intervention Plan';
    } else if (currentResourceType === 'progressMonitoring') {
      resourceTemplate = await fetchNsightzTemplate('progressMonitoring');
      resourceTitle = 'Progress Monitoring Framework';
    } else {
      resourceTemplate = '# Nsightz MTSS Resource\n\n[Resource content will be generated based on your conversation]';
      resourceTitle = 'MTSS Resource';
    }

    // Customize template based on conversation
    const customizedResource = await customizeTemplate(resourceTemplate);

    // Convert markdown to HTML
    const htmlContent = markdownConverter.makeHtml(customizedResource);

    // Update resource content
    resourceContent.innerHTML = htmlContent;

    // Add Nsightz color theme to headings
    const headings = resourceContent.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach(heading => {
      if (heading.tagName === 'H1') {
        heading.style.color = '#3da0ad';
        heading.style.borderBottom = '2px solid #3da0ad';
        heading.style.paddingBottom = '10px';
      } else if (heading.tagName === 'H2') {
        heading.style.color = '#3da0ad';
      } else {
        heading.style.color = '#2a8995';
      }
    });

    // Style tables in the resource content
    const tables = resourceContent.querySelectorAll('table');
    tables.forEach(table => {
      table.style.borderCollapse = 'collapse';
      table.style.width = '100%';
      table.style.marginBottom = '20px';

      const headers = table.querySelectorAll('th');
      headers.forEach(header => {
        header.style.backgroundColor = '#3da0ad';
        header.style.color = 'white';
        header.style.padding = '8px';
        header.style.textAlign = 'left';
      });

      const cells = table.querySelectorAll('td');
      cells.forEach(cell => {
        cell.style.border = '1px solid #ddd';
        cell.style.padding = '8px';
      });

      const rows = table.querySelectorAll('tr:nth-child(even)');
      rows.forEach(row => {
        row.style.backgroundColor = '#f2f2f2';
      });
    });

    // Show resource preview
    resourcePreviewContainer.style.display = 'flex';
    document.querySelector('.chat-container').style.flex = '0';

    // Add message to conversation
    addMessage(`I've generated your Nsightz MTSS ${resourceTitle}! You can view it, download it as a PDF, or export it to Google Docs.`, 'assistant');

    // Suggest next steps
    updateSuggestedButtons(['Make changes', 'Create another resource', 'Schedule Nsightz demo', 'Thank you']);

  } catch (error) {
    console.error('Error:', error);
    addMessage('Sorry, there was an error generating your resource. Please try again.', 'assistant');
  } finally {
    // Hide loading modal
    loadingModal.classList.remove('active');
  }
}

// Helper function to fetch Nsightz templates
async function fetchNsightzTemplate(type) {
  // In a real implementation, this would fetch from server
  // For now, return hardcoded templates
  if (type === 'interventionMenu') {
    return `# MTSS Intervention Menu\n\n## School: [School Name]\n## School Level: ${schoolLevelSelect.value} School\n## Date Created: ${new Date().toLocaleDateString()}\n\n[Content will be customized based on your input]`;
  } else if (type === 'studentPlan') {
    return `# Student Intervention Plan\n\n## Student Information\n- **Student Name:** [Student Name]\n- **Grade:** [Grade Level]\n- **School:** ${schoolLevelSelect.value} School\n- **Start Date:** ${new Date().toLocaleDateString()}\n\n[Content will be customized based on your input]`;
  } else if (type === 'progressMonitoring') {
    return `# Progress Monitoring Framework\n\n## School: [School Name]\n## School Level: ${schoolLevelSelect.value} School\n## Date Created: ${new Date().toLocaleDateString()}\n\n[Content will be customized based on your input]`;
  }
  return '';
}

// Helper function to customize template based on conversation
async function customizeTemplate(template) {
  // In a real implementation, this would use AI to customize based on conversation
  // For now, use mock implementation

  // Send request to generate resource
  const response = await fetch(RESOURCE_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      resourceType: currentResourceType,
      conversationHistory: conversationHistory,
      userSchoolLevel: schoolLevelSelect.value
    })
  });

  if (!response.ok) {
    throw new Error('Failed to generate resource');
  }

  const data = await response.json();
  return data.resource;
}

// Utility Functions
function addMessage(text, sender, isLoading = false) {
  // Create message element
  const messageElement = document.createElement('div');
  messageElement.className = `message ${sender}-message`;

  // Create message content element
  const contentElement = document.createElement('div');
  contentElement.className = 'message-content';

  if (isLoading) {
    // Create loading spinner
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    spinner.style.width = '20px';
    spinner.style.height = '20px';
    contentElement.appendChild(spinner);
  } else {
    // Process text to convert markdown to HTML (for assistant messages only)
    if (sender === 'assistant') {
      contentElement.innerHTML = markdownToHTML(text);
    } else {
      contentElement.textContent = text;
    }

    // Add message to conversation history
    conversationHistory.push({
      text: text,
      sender: sender
    });
  }

  // Add content to message element
  messageElement.appendChild(contentElement);

  // Add message to messages container
  messagesContainer.appendChild(messageElement);

  // Scroll to bottom of messages
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  return messageElement;
}

function updateSuggestedButtons(buttons) {
  // Clear existing buttons
  suggestedButtonsContainer.innerHTML = '';

  // Add new buttons
  buttons.forEach(buttonText => {
    const button = document.createElement('button');
    button.className = 'suggested-button';
    button.textContent = buttonText;
    suggestedButtonsContainer.appendChild(button);
  });
}

function markdownToHTML(text) {
  // Replace line breaks with <br> tags
  text = text.replace(/\n/g, '<br>');

  // Replace markdown for bold text
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Replace markdown for italic text
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Replace markdown for links
  text = text.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');

  // Replace markdown for bullet lists
  text = text.replace(/^\s*-\s+(.*?)(?=<br>|$)/gm, '• $1');

  return text;
}

function htmlToMarkdown(html) {
  // Create a temporary div to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  // First, process nested elements to prevent formatting conflicts
  const processTextFormatting = (element) => {
    // Process bold and italic text first
    const boldElements = element.querySelectorAll('strong, b');
    boldElements.forEach(el => {
      el.outerHTML = '**' + el.textContent + '**';
    });

    const italicElements = element.querySelectorAll('em, i');
    italicElements.forEach(el => {
      el.outerHTML = '*' + el.textContent + '*';
    });
  };

  // Process text formatting in all elements
  processTextFormatting(tempDiv);

  // Convert headings with proper spacing
  const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
  headings.forEach(heading => {
    const level = parseInt(heading.tagName[1]);
    const text = heading.textContent.trim();
    heading.outerHTML = '\n' + '#'.repeat(level) + ' ' + text + '\n\n';
  });

  // Convert paragraphs with proper spacing
  const paragraphs = tempDiv.querySelectorAll('p');
  paragraphs.forEach(p => {
    p.outerHTML = '\n' + p.textContent.trim() + '\n\n';
  });

  // Convert lists with proper indentation
  const lists = tempDiv.querySelectorAll('ul, ol');
  lists.forEach(list => {
    const items = list.querySelectorAll('li');
    let markdownList = '\n';
    items.forEach(item => {
      markdownList += '- ' + item.textContent.trim() + '\n';
    });
    list.outerHTML = markdownList + '\n';
  });

  // Convert tables with proper alignment
  const tables = tempDiv.querySelectorAll('table');
  tables.forEach(table => {
    const rows = table.querySelectorAll('tr');
    let markdownTable = '\n';
    
    // Process header row
    const headerCells = rows[0]?.querySelectorAll('th, td');
    if (headerCells?.length) {
      markdownTable += '| ' + Array.from(headerCells).map(cell => cell.textContent.trim()).join(' | ') + ' |\n';
      markdownTable += '|' + Array.from(headerCells).map(() => ' --- ').join('|') + '|\n';
    }
    
    // Process data rows
    Array.from(rows).slice(1).forEach(row => {
      const cells = row.querySelectorAll('td');
      markdownTable += '| ' + Array.from(cells).map(cell => cell.textContent.trim()).join(' | ') + ' |\n';
    });
    
    table.outerHTML = markdownTable + '\n';
  });

  // Get the processed content and clean up extra whitespace
  let markdown = tempDiv.textContent
    .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newlines
    .trim();

  return markdown;
}

// Update the PDF generation function with proper implementation
async function generatePDF(markdownContent) {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const margins = { top: 20, bottom: 20, left: 15, right: 15 };
  let yOffset = margins.top;
  let currentPage = 1;

  // Set default font and size
  pdf.setFont('helvetica');
  pdf.setFontSize(11);
  pdf.setTextColor(0, 0, 0);

  // Add header to first page
  addHeaderToPage(pdf, currentPage);

  // Process markdown content
  const sections = markdownContent.split('\n\n').filter(section => section.trim());
  
  for (let section of sections) {
    if (!section.trim()) continue;

    // Handle headers
    if (section.startsWith('#')) {
      const level = section.match(/^#+/)[0].length;
      const text = section.replace(/^#+\s*/, '').trim();
      
      // Add spacing before headers
      yOffset += 5;
      
      // Check if we need a new page
      if (yOffset + 10 > pdfHeight - margins.bottom) {
        pdf.addPage();
        currentPage++;
        addHeaderToPage(pdf, currentPage);
        yOffset = margins.top;
      }

      // Set font size based on header level
      switch(level) {
        case 1:
          pdf.setFontSize(16);
          pdf.setFont('helvetica', 'bold');
          break;
        case 2:
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          break;
        case 3:
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          break;
        default:
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'bold');
      }

      // Add the header text
      const lines = pdf.splitTextToSize(text, pdfWidth - margins.left - margins.right);
      for (let i = 0; i < lines.length; i++) {
        pdf.text(lines[i], margins.left, yOffset);
        yOffset += 8;
      }
      
      // Reset font
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      continue;
    }

    // Handle lists
    if (section.trim().startsWith('- ')) {
      const listItems = section.split('\n');
      for (const item of listItems) {
        if (!item.trim()) continue;
        
        // Check if we need a new page
        if (yOffset + 7 > pdfHeight - margins.bottom) {
          pdf.addPage();
          currentPage++;
          addHeaderToPage(pdf, currentPage);
          yOffset = margins.top;
        }

        // Process bold text in list items
        const parts = processBoldText(item.replace(/^-\s*/, '').trim());
        let xOffset = margins.left + 5;
        let lineContent = '';
        const maxWidth = pdfWidth - margins.left - margins.right - 5;

        // Add bullet point
        pdf.text('•', margins.left, yOffset);

        // Process each part and handle line wrapping
        for (const part of parts) {
          if (part.bold) {
            pdf.setFont('helvetica', 'bold');
          } else {
            pdf.setFont('helvetica', 'normal');
          }

          const words = part.text.split(' ');
          for (const word of words) {
            const testContent = lineContent + (lineContent ? ' ' : '') + word;
            const testWidth = pdf.getStringUnitWidth(testContent) * pdf.getFontSize() / pdf.internal.scaleFactor;

            if (testWidth > maxWidth) {
              // Write current line
              pdf.text(lineContent, xOffset, yOffset);
              yOffset += 7;
              xOffset = margins.left + 10; // Indent wrapped lines
              lineContent = word;

              // Check if we need a new page
              if (yOffset + 7 > pdfHeight - margins.bottom) {
                pdf.addPage();
                currentPage++;
                addHeaderToPage(pdf, currentPage);
                yOffset = margins.top;
              }
            } else {
              lineContent = testContent;
            }
          }
        }

        // Write the last line if any
        if (lineContent) {
          pdf.text(lineContent, xOffset, yOffset);
          yOffset += 7;
        }

        pdf.setFont('helvetica', 'normal');
      }
      continue;
    }

    // Handle tables
    if (section.includes('|')) {
      const rows = section.split('\n').filter(row => row.trim().startsWith('|'));
      if (rows.length > 0) {
        // Calculate table dimensions
        const tableHeight = rows.length * 8 + 5;
        
        // Check if we need a new page
        if (yOffset + tableHeight > pdfHeight - margins.bottom) {
          pdf.addPage();
          currentPage++;
          addHeaderToPage(pdf, currentPage);
          yOffset = margins.top;
        }

        // Process table
        const columnWidths = [];
        const tableData = rows.map(row => {
          const cells = row.split('|').slice(1, -1).map(cell => cell.trim());
          cells.forEach((cell, i) => {
            columnWidths[i] = Math.max(columnWidths[i] || 0, pdf.getStringUnitWidth(cell) * 5);
          });
          return cells;
        });

        // Draw table
        const availableWidth = pdfWidth - margins.left - margins.right;
        const totalWidth = columnWidths.reduce((a, b) => a + b, 0);
        const scaleFactor = availableWidth / totalWidth;

        tableData.forEach((row, rowIndex) => {
          if (rowIndex === 1 && row.join('').includes('---')) return; // Skip separator row
          
          let xOffset = margins.left;
          
          // Set header style for first row
          if (rowIndex === 0) {
            pdf.setFont('helvetica', 'bold');
          }

          row.forEach((cell, colIndex) => {
            const cellWidth = columnWidths[colIndex] * scaleFactor;
            const parts = processBoldText(cell);
            let cellXOffset = xOffset;
            let cellContent = '';
            const maxCellWidth = cellWidth - 2; // Leave some padding

            // Process each part of the cell text
            for (const part of parts) {
              if (part.bold) {
                pdf.setFont('helvetica', 'bold');
              } else {
                pdf.setFont('helvetica', 'normal');
              }

              const words = part.text.split(' ');
              for (const word of words) {
                const testContent = cellContent + (cellContent ? ' ' : '') + word;
                const testWidth = pdf.getStringUnitWidth(testContent) * pdf.getFontSize() / pdf.internal.scaleFactor;

                if (testWidth > maxCellWidth) {
                  // Write current line
                  pdf.text(cellContent, cellXOffset, yOffset);
                  yOffset += 7;
                  cellContent = word;

                  // Check if we need a new page
                  if (yOffset + 7 > pdfHeight - margins.bottom) {
                    pdf.addPage();
                    currentPage++;
                    addHeaderToPage(pdf, currentPage);
                    yOffset = margins.top;
                  }
                } else {
                  cellContent = testContent;
                }
              }
            }

            // Write the last line if any
            if (cellContent) {
              pdf.text(cellContent, cellXOffset, yOffset);
            }

            xOffset += cellWidth;
          });

          yOffset += 8;
          pdf.setFont('helvetica', 'normal');
        });

        yOffset += 5;
      }
      continue;
    }

    // Handle regular paragraphs with bold text
    const parts = processBoldText(section);
    let currentLine = '';
    let lineHeight = 7;
    const maxWidth = pdfWidth - margins.left - margins.right;

    // Check if we need a new page
    if (yOffset + lineHeight > pdfHeight - margins.bottom) {
      pdf.addPage();
      currentPage++;
      addHeaderToPage(pdf, currentPage);
      yOffset = margins.top;
    }

    // Process each part of the text
    for (const part of parts) {
      if (part.bold) {
        pdf.setFont('helvetica', 'bold');
      } else {
        pdf.setFont('helvetica', 'normal');
      }

      const words = part.text.split(' ');
      for (const word of words) {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const testWidth = pdf.getStringUnitWidth(testLine) * pdf.getFontSize() / pdf.internal.scaleFactor;

        if (testWidth > maxWidth) {
          // Write current line
          pdf.text(currentLine, margins.left, yOffset);
          yOffset += lineHeight;
          currentLine = word;

          // Check if we need a new page
          if (yOffset + lineHeight > pdfHeight - margins.bottom) {
            pdf.addPage();
            currentPage++;
            addHeaderToPage(pdf, currentPage);
            yOffset = margins.top;
          }
        } else {
          currentLine = testLine;
        }
      }
    }

    // Write the last line if any
    if (currentLine) {
      pdf.text(currentLine, margins.left, yOffset);
      yOffset += lineHeight + 3;
    }
  }

  // Add footer to each page
  for (let page = 1; page <= currentPage; page++) {
    pdf.setPage(page);
    addFooterToPage(pdf);
  }

  return pdf;
}

// Helper function to process bold text
function processBoldText(text) {
  const parts = [];
  let currentIndex = 0;
  let boldMatch;
  const boldRegex = /\*\*(.*?)\*\*/g;

  while ((boldMatch = boldRegex.exec(text)) !== null) {
    // Add text before the bold part
    if (boldMatch.index > currentIndex) {
      parts.push({
        text: text.substring(currentIndex, boldMatch.index),
        bold: false
      });
    }

    // Add the bold text with proper spacing
    const boldText = boldMatch[1];
    parts.push({
      text: boldText + (text[boldMatch.index + boldMatch[0].length] === ':' ? ':' : ''),
      bold: true
    });

    currentIndex = boldMatch.index + boldMatch[0].length + (text[boldMatch.index + boldMatch[0].length] === ':' ? 1 : 0);
  }

  // Add any remaining text
  if (currentIndex < text.length) {
    parts.push({
      text: text.substring(currentIndex),
      bold: false
    });
  }

  // If no bold text was found, return the entire text as a single non-bold part
  if (parts.length === 0) {
    parts.push({
      text: text,
      bold: false
    });
  }

  return parts;
}

function addHeaderToPage(pdf, pageNumber) {
  const pdfWidth = pdf.internal.pageSize.getWidth();
  
  // Add title background
  pdf.setFillColor(61, 160, 173); // #3da0ad
  pdf.rect(0, 0, pdfWidth, 15, 'F');
  
  // Set header text style
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255); // White text for header
  pdf.setFontSize(12);

  // Set title based on resource type
  let title = 'Nsightz MTSS Resource';
  if (currentResourceType === 'interventionMenu') {
    title = 'Nsightz MTSS Intervention Menu';
  } else if (currentResourceType === 'studentPlan') {
    title = 'Nsightz MTSS Student Intervention Plan';
  } else if (currentResourceType === 'progressMonitoring') {
    title = 'Nsightz MTSS Progress Monitoring Framework';
  }

  // Add title and page number
  pdf.text(title + ' - Page ' + pageNumber, 10, 10);
  
  // Add generation date
  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  pdf.text('Generated on: ' + dateString, pdfWidth - 10, 10, { align: 'right' });
  
  // Reset text style for content
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
}

function addFooterToPage(pdf) {
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(0, 0, 0);
  
  // Add copyright
  pdf.text('© 2025 Nsightz Inc. All Rights Reserved', pdfWidth/2, pdfHeight - 10, {
    align: 'center'
  });
  
  // Add promotional text
  pdf.text('For one-click progress monitoring, visit mtss.nsightz.com/launch', pdfWidth/2, pdfHeight - 6, {
    align: 'center'
  });
}

// Helper function to get resource filename
function getResourceFilename(extension = 'pdf') {
  let filename = `Nsightz_MTSS_Resource.${extension}`;
  if (currentResourceType === 'interventionMenu') {
    filename = `Nsightz_Intervention_Menu.${extension}`;
  } else if (currentResourceType === 'studentPlan') {
    filename = `Nsightz_Student_Intervention_Plan.${extension}`;
  } else if (currentResourceType === 'progressMonitoring') {
    filename = `Nsightz_Progress_Monitoring_Framework.${extension}`;
  }
  return filename;
}

// Helper function to create styled HTML from markdown
function createStyledHTML(markdownContent) {
  const styledHTML = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body {
    font-family: Arial, sans-serif;
    line-height: 1.6;
    margin: 40px;
    max-width: 800px;
    margin: 40px auto;
  }
  h1 {
    color: #3da0ad;
    border-bottom: 2px solid #3da0ad;
    padding-bottom: 10px;
  }
  h2 {
    color: #3da0ad;
    margin-top: 25px;
  }
  h3, h4, h5, h6 {
    color: #2a8995;
  }
  table {
    border-collapse: collapse;
    width: 100%;
    margin: 20px 0;
  }
  th {
    background-color: #3da0ad;
    color: white;
    padding: 8px;
    text-align: left;
  }
  td {
    border: 1px solid #ddd;
    padding: 8px;
  }
  tr:nth-child(even) {
    background-color: #f2f2f2;
  }
  ul {
    margin-bottom: 1rem;
    padding-left: 1.5rem;
  }
  li {
    margin-bottom: 0.5rem;
  }
  .footer {
    margin-top: 40px;
    padding-top: 20px;
    border-top: 1px solid #eee;
    text-align: center;
    color: #666;
    font-size: 0.8rem;
  }
</style>
</head>
<body>
${markdownConverter.makeHtml(markdownContent)}
<div class="footer">
  <p>© 2025 Nsightz Inc. All Rights Reserved</p>
  <p>For one-click progress monitoring, visit mtss.nsightz.com/launch</p>
</div>
</body>
</html>`;

  return styledHTML;
}

// Initialize the chat with a welcome message
console.log('Script loaded'); // Debug log

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM Content Loaded'); // Debug log

  // Verify DOM elements exist
  if (!messagesContainer) {
    console.error('Messages container not found!');
    return;
  }

  // Set Nsightz theme colors
  document.documentElement.style.setProperty('--primary-color', '#3da0ad');
  document.documentElement.style.setProperty('--primary-light', '#5fb9c6');
  document.documentElement.style.setProperty('--primary-dark', '#2a8995');

  // Add favicon
  const favicon = document.createElement('link');
  favicon.rel = 'icon';
  favicon.href = './Nsightz Logo.png';
  favicon.type = 'image/png';
  document.head.appendChild(favicon);

  // Update page title
  document.title = 'Nsightz MTSS Assistant';

  // Ensure logo is loaded
  const headerLogo = document.querySelector('.logo');
  if (headerLogo) {
    headerLogo.src = './Nsightz Logo.png';
    headerLogo.alt = 'Nsightz MTSS Assistant Logo';
  }

  try {
    // Add initial welcome message
    console.log('Adding welcome message...'); // Debug log
    const welcomeMessage = 'Welcome to the Nsightz MTSS Assistant! I\'m here to help you create evidence-based resources for your MTSS program. What type of resource would you like to create today?';
    addMessage(welcomeMessage, 'assistant');

    // Add initial suggested buttons
    console.log('Adding suggested buttons...'); // Debug log
    updateSuggestedButtons(['Intervention Menu', 'Intervention Plan for a Student', 'Progress Monitoring Framework']);

    // Set up event listeners
    console.log('Setting up event listeners...'); // Debug log
    setupEventListeners();

    // Show CTA banner after 15 seconds
    setTimeout(() => {
      if (ctaBanner) {
        ctaBanner.style.display = 'flex';
      }
    }, 15000);

    // Style the CTA banner
    if (ctaBanner) {
      ctaBanner.style.backgroundColor = '#3da0ad';
      ctaBanner.style.color = '#ffffff';
      ctaBanner.style.borderRadius = '8px';
      ctaBanner.style.margin = '0 10px 10px 10px';

      // Add Nsightz logo to banner
      const ctaContent = ctaBanner.querySelector('.cta-content');
      if (ctaContent) {
        const logoImg = document.createElement('img');
        logoImg.src = './Nsightz Logo.png';
        logoImg.alt = 'Nsightz Logo';
        logoImg.style.width = '30px';
        logoImg.style.marginRight = '10px';

        // Add the logo as the first child of the content div
        if (ctaContent.firstChild) {
          ctaContent.insertBefore(logoImg, ctaContent.firstChild);
        } else {
          ctaContent.appendChild(logoImg);
        }

        // Update text
        const ctaText = ctaContent.querySelector('p');
        if (ctaText) {
          ctaText.innerHTML = 'Want to streamline your MTSS process? Try <strong>Nsightz MTSS</strong> for one-click progress monitoring, quick logging, and intervention fidelity tracking.';
        }

        // Style the button
        const button = ctaContent.querySelector('.cta-button');
        if (button) {
          button.style.backgroundColor = '#ffffff';
          button.style.color = '#3da0ad';
          button.style.fontWeight = 'bold';
          button.style.border = 'none';
          button.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
        }
      }
    }

    // Update footer bar text
    const footerBar = document.querySelector('.footer-bar');
    if (footerBar) {
      footerBar.innerHTML = 'Want to streamline your MTSS process? Try Nsightz MTSS for one-click progress monitoring, quick logging, and intervention fidelity tracking.';
    }

    console.log('Initialization complete!'); // Debug log
  } catch (error) {
    console.error('Error during initialization:', error);
  }
});

function setupEventListeners() {
  // Send message when send button is clicked
  sendButton.addEventListener('click', async () => {
    const message = userInput.value.trim();
    if (message) {
      // Add user message to UI
      addMessage(message, 'user');
      // Clear input field
      userInput.value = '';
      // Send message to server
      await handleMessageSend(message);
    }
  });

  // Send message when Enter key is pressed (but allow Shift+Enter for new lines)
  userInput.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const message = userInput.value.trim();
      if (message) {
        // Add user message to UI
        addMessage(message, 'user');
        // Clear input field
        userInput.value = '';
        // Send message to server
        await handleMessageSend(message);
      }
    }
  });

  // Update resource type when a suggested button is clicked
  suggestedButtonsContainer.addEventListener('click', async (e) => {
    if (e.target.classList.contains('suggested-button')) {
      const buttonText = e.target.textContent;

      // Special handling for "Schedule Nsightz demo" button
      if (buttonText === 'Schedule Nsightz demo') {
        window.open('https://mtss.nsightz.com/launch', '_blank');
        // Add a message to the conversation
        addMessage('I\'d like to schedule a demo of the Nsightz MTSS platform.', 'user');
        // Send message to server
        await handleMessageSend('I\'d like to schedule a demo of the Nsightz MTSS platform.');
        return;
      }

      // Normal button handling
      // Add user message to UI
      addMessage(buttonText, 'user');
      
      // Determine resource type based on button text
      if (buttonText.toLowerCase().includes('intervention menu') || 
          buttonText.toLowerCase().includes('academic interventions') ||
          buttonText.toLowerCase().includes('behavioral interventions') ||
          buttonText.toLowerCase().includes('social-emotional interventions') ||
          buttonText.toLowerCase().includes('attendance interventions')) {
        currentResourceType = 'interventionMenu';
      } else if (buttonText.toLowerCase().includes('student') && buttonText.toLowerCase().includes('plan')) {
        currentResourceType = 'studentPlan';
      } else if (buttonText.toLowerCase().includes('progress monitoring')) {
        currentResourceType = 'progressMonitoring';
      }

      // Style the clicked button for better UX
      e.target.style.backgroundColor = '#3da0ad';
      e.target.style.color = 'white';
      e.target.style.borderColor = '#3da0ad';

      // Reset the button style after a short delay
      setTimeout(() => {
        e.target.style.backgroundColor = '';
        e.target.style.color = '';
        e.target.style.borderColor = '';
      }, 300);

      // Send message to server
      await handleMessageSend(buttonText);
    }
  });

  // PDF download
  downloadPdfButton.addEventListener('click', async () => {
    // Display loading modal
    loadingModal.classList.add('active');

    try {
      // Get the content element
      const contentElement = document.querySelector('#resource-content');
      if (!contentElement) {
        throw new Error('Resource preview content not found. Please make sure you have generated a resource first.');
      }

      // Get the HTML content and convert to markdown
      const htmlContent = contentElement.innerHTML;
      console.log('Original HTML:', htmlContent); // Debug log
      
      const markdownContent = htmlToMarkdown(htmlContent);
      console.log('Converted Markdown:', markdownContent); // Debug log

      // Generate the PDF
      const pdf = await generatePDF(markdownContent);

      // Generate filename based on resource type
      let filename = 'Nsightz_MTSS_Resource.pdf';
      if (currentResourceType === 'interventionMenu') {
        filename = 'Nsightz_Intervention_Menu.pdf';
      } else if (currentResourceType === 'studentPlan') {
        filename = 'Nsightz_Student_Intervention_Plan.pdf';
      } else if (currentResourceType === 'progressMonitoring') {
        filename = 'Nsightz_Progress_Monitoring_Framework.pdf';
      }

      // Save the PDF
      pdf.save(filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('There was an error generating the PDF: ' + error.message);
    } finally {
      // Hide loading modal
      loadingModal.classList.remove('active');
    }
  });

  // Export to Google Docs
  exportGoogleDocsButton.addEventListener('click', async () => {
    // Display loading modal
    loadingModal.classList.add('active');

    try {
      // Get the content element
      const contentElement = document.querySelector('#resource-content');
      if (!contentElement) {
        throw new Error('Resource preview content not found. Please make sure you have generated a resource first.');
      }

      // Get the HTML content and convert to markdown
      const htmlContent = contentElement.innerHTML;
      const markdownContent = htmlToMarkdown(htmlContent);
      
      // Create styled HTML document
      const styledHTML = createStyledHTML(markdownContent);

      // Create a Blob with the HTML content
      const blob = new Blob([styledHTML], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      // Generate filename
      const filename = getResourceFilename('html');

      // Create a temporary link to download the HTML file
      const tempLink = document.createElement('a');
      tempLink.href = url;
      tempLink.download = filename;
      document.body.appendChild(tempLink);
      tempLink.click();
      document.body.removeChild(tempLink);

      // Clean up the URL object
      URL.revokeObjectURL(url);

      // Show instructions for importing to Google Docs
      const instructions = 
        'File downloaded successfully!\n\n' +
        'To import to Google Docs:\n' +
        '1. Go to drive.google.com\n' +
        '2. Click "New" > "File upload"\n' +
        '3. Select the downloaded HTML file\n' +
        '4. Right-click the file > "Open with" > "Google Docs"\n\n' +
        'The document will maintain all formatting, including:\n' +
        '• Headers and styling\n' +
        '• Tables and lists\n' +
        '• Bold and italic text\n' +
        '• Custom colors and spacing';

      alert(instructions);
    } catch (error) {
      console.error('Error exporting to Google Docs:', error);
      alert('There was an error exporting to Google Docs: ' + error.message);
    } finally {
      // Hide loading modal
      loadingModal.classList.remove('active');
    }
  });

  // Back to chat
  backToChatButton.addEventListener('click', () => {
    resourcePreviewContainer.style.display = 'none';
    document.querySelector('.chat-container').style.flex = '1';
  });

  // CTA banner
  ctaButton.addEventListener('click', () => {
    window.open('https://mtss.nsightz.com/launch', '_blank');
  });

  ctaClose.addEventListener('click', () => {
    ctaBanner.style.display = 'none';
  });
}

// Separate the message sending logic
async function handleMessageSend(message, retryCount = 0) {
  try {
    // Add loading message
    const loadingMessage = addMessage('Thinking...', 'assistant', true);

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [...conversationHistory, { sender: 'user', text: message }],
        userSchoolLevel: schoolLevelSelect.value,
        resourceType: currentResourceType
      })
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Please wait a moment before making another request. The system is processing your previous request.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }

    // Remove loading message
    if (loadingMessage && loadingMessage.parentNode) {
      messagesContainer.removeChild(loadingMessage);
    }

    // Add assistant response to UI
    addMessage(data.text, 'assistant');

    // Update suggested buttons
    if (data.suggestedButtons && data.suggestedButtons.length > 0) {
      updateSuggestedButtons(data.suggestedButtons);
    }

    // Show generate resource button if we've had enough exchanges
    if (conversationHistory.length >= 6 && !document.getElementById('generate-resource-button')) {
      const actionButtonsContainer = document.querySelector('.action-buttons-container');
      if (actionButtonsContainer) {
        const generateButton = document.createElement('button');
        generateButton.id = 'generate-resource-button';
        generateButton.innerHTML = '<i class="fas fa-file-alt"></i> Generate Resource';
        generateButton.style.backgroundColor = '#EC913D';
        generateButton.style.color = 'white';
        generateButton.style.padding = '12px 20px';
        generateButton.style.borderRadius = '30px';
        generateButton.style.border = 'none';
        generateButton.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
        generateButton.style.display = 'inline-flex';
        generateButton.style.alignItems = 'center';
        generateButton.style.justifyContent = 'center';
        generateButton.style.cursor = 'pointer';
        generateButton.style.transition = 'background-color 0.3s ease';
        generateButton.style.fontFamily = 'Poppins, sans-serif';
        generateButton.style.fontSize = '0.9rem';
        generateButton.style.fontWeight = '500';

        generateButton.addEventListener('mouseenter', function() {
          this.style.backgroundColor = '#D9802D';
        });

        generateButton.addEventListener('mouseleave', function() {
          this.style.backgroundColor = '#EC913D';
        });

        generateButton.addEventListener('click', generateResource);
        actionButtonsContainer.appendChild(generateButton);
      }
    }

    // Scroll to bottom of messages
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Show CTA banner after a few exchanges
    if (conversationHistory.length >= 6 && ctaBanner.style.display === 'none') {
      setTimeout(() => {
        ctaBanner.style.display = 'flex';
      }, 2000);
    }
  } catch (error) {
    console.error(`API call error (attempt ${retryCount + 1}):`, error);
    
    // Remove loading message if it exists
    const loadingMessage = messagesContainer.querySelector('.message.assistant-message .spinner');
    if (loadingMessage) {
      const messageElement = loadingMessage.closest('.message');
      if (messageElement) {
        messagesContainer.removeChild(messageElement);
      }
    }
    
    if (retryCount < 2) {
      // Wait for 2 seconds before retrying
      await new Promise(resolve => setTimeout(resolve, 2000));
      return handleMessageSend(message, retryCount + 1);
    }
    
    // Add error message to the chat
    addMessage('Sorry, there was an error processing your message. Please try again.', 'assistant');
    throw error;
  }
}