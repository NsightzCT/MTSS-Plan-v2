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
async function sendMessage() {
  const message = userInput.value.trim();
  if (message === '') return;

  // Add user message to UI
  addMessage(message, 'user');

  // Clear input field
  userInput.value = '';

  // Clear suggested buttons
  suggestedButtonsContainer.innerHTML = '';

  // Show loading indicator
  const loadingMessage = addMessage('Thinking...', 'assistant', true);

  try {
    // Determine resource type if not already set
    if (!currentResourceType) {
      if (message.toLowerCase().includes('intervention menu')) {
        currentResourceType = 'interventionMenu';
      } else if ((message.toLowerCase().includes('student') && message.toLowerCase().includes('plan')) || 
                message.toLowerCase().includes('individual')) {
        currentResourceType = 'studentPlan';
      } else if (message.toLowerCase().includes('progress monitoring')) {
        currentResourceType = 'progressMonitoring';
      }
    }

    // Send message to server
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: conversationHistory,
        userSchoolLevel: schoolLevelSelect.value,
        resourceType: currentResourceType
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get response from server');
    }

    const data = await response.json();

    // Remove loading message
    messagesContainer.removeChild(loadingMessage);

    // Add assistant response to UI
    addMessage(data.text, 'assistant');

    // Update suggested buttons
    if (data.suggestedButtons && data.suggestedButtons.length > 0) {
      updateSuggestedButtons(data.suggestedButtons);
    }

    // Show generate resource button if we've had enough exchanges
    if (conversationHistory.length >= 3 && !document.getElementById('generate-resource-button')) {
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
    if (conversationHistory.length >= 4 && ctaBanner.style.display === 'none') {
      setTimeout(() => {
        ctaBanner.style.display = 'flex';
      }, 2000);
    }
  } catch (error) {
    console.error('Error:', error);

    // Remove loading message
    messagesContainer.removeChild(loadingMessage);

    // Add error message
    addMessage('Sorry, there was an error processing your request. Please try again.', 'assistant');
  }
}

async function generateResource() {
  // Show loading modal
  loadingModal.classList.add('active');

  const loadingContent = loadingModal.querySelector('.loading-content');
  if (loadingContent) {
    // Update loading spinner color to match Nsightz brand
    const spinner = loadingContent.querySelector('.spinner');
    if (spinner) {
      spinner.style.borderTopColor = '#3da0ad';
    }

    // Update loading text
    const loadingText = loadingContent.querySelector('p');
    if (loadingText) {
      loadingText.textContent = 'Generating your Nsightz MTSS resource...';
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

    // Add custom Nsightz header before displaying content
    const nsightzHeader = `
      <div style="display: flex; align-items: center; padding: 15px; background-color: #3da0ad; color: white; border-radius: 4px; margin-bottom: 20px;">
        <img src="./Nsightz Logo.png" alt="Nsightz Logo" style="width: 40px; height: 40px; margin-right: 15px;">
        <div>
          <h1 style="margin: 0; font-size: 24px;">Nsightz MTSS ${resourceTitle}</h1>
          <p style="margin: 0; font-size: 14px;">Generated on ${new Date().toLocaleDateString()}</p>
        </div>
      </div>
    `;

    // Update resource content
    resourceContent.innerHTML = nsightzHeader + htmlContent;

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

      // Add styles to table headers
      const headers = table.querySelectorAll('th');
      headers.forEach(header => {
        header.style.backgroundColor = '#3da0ad';
        header.style.color = 'white';
        header.style.padding = '8px';
        header.style.textAlign = 'left';
      });

      // Add styles to table cells
      const cells = table.querySelectorAll('td');
      cells.forEach(cell => {
        cell.style.border = '1px solid #ddd';
        cell.style.padding = '8px';
      });

      // Add zebra striping to table rows
      const rows = table.querySelectorAll('tr:nth-child(even)');
      rows.forEach(row => {
        row.style.backgroundColor = '#f2f2f2';
      });
    });

    // Ensure Nsightz footer is present
    addNsightzFooter();

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

// Add Nsightz footer to generated resources
function addNsightzFooter() {
  const footer = document.createElement('div');
  footer.className = 'nsightz-footer';
  footer.innerHTML = `
    <div class="nsightz-footer-content">
      <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 15px;">
        <img src="./Nsightz Logo.png" alt="Nsightz Logo" class="footer-logo" style="width: 60px; height: auto;">
        <div style="margin-left: 15px;">
          <h3 style="margin: 0; color: #3da0ad; font-size: 18px;">Nsightz MTSS</h3>
          <p style="margin: 0; font-size: 12px; color: #666;">Simplified Progress Monitoring</p>
        </div>
      </div>
      <div style="display: flex; justify-content: space-between; width: 100%; border-top: 1px solid #eee; padding-top: 15px;">
        <div style="flex: 1;">
          <p style="font-size: 0.7rem; color: #666; margin: 0;"><strong>Contact:</strong> hello@nsightz.com</p>
          <p style="font-size: 0.7rem; color: #666; margin: 0;"><strong>Website:</strong> <a href="https://mtss.nsightz.com/launch" target="_blank" style="color: #3da0ad;">mtss.nsightz.com</a></p>
        </div>
        <div style="flex: 1; text-align: right;">
          <p style="font-size: 0.7rem; color: #666; margin: 0;">© 2025 Nsightz Inc.</p>
          <p style="font-size: 0.7rem; color: #666; margin: 0;">All Rights Reserved</p>
        </div>
      </div>
      <div style="width: 100%; margin-top: 10px; padding: 8px; background-color: #f5f5f5; border-radius: 4px; text-align: center;">
        <p style="font-size: 0.7rem; color: #3da0ad; margin: 0;">
          <strong>For comprehensive progress monitoring, quick logging, and improved intervention fidelity tracking,<br>visit <a href="https://mtss.nsightz.com/launch" target="_blank" style="color: #3da0ad;">mtss.nsightz.com/launch</a> to request a free demo.</strong>
        </p>
      </div>
    </div>
  `;

  footer.style.padding = '20px';
  footer.style.marginTop = '40px';
  footer.style.borderTop = '2px solid #3da0ad';
  footer.style.backgroundColor = '#ffffff';

  // Remove existing footer if present
  const existingFooter = resourceContent.querySelector('.nsightz-footer');
  if (existingFooter) {
    existingFooter.remove();
  }

  // Add footer to resource content
  resourceContent.appendChild(footer);
}

// Constants
const API_ENDPOINT = '/api/chat';
const RESOURCE_ENDPOINT = '/api/generate-resource';

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

// Initialize the chat with a welcome message
window.addEventListener('DOMContentLoaded', () => {
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

  addMessage('Welcome to the Nsightz MTSS Assistant! I\'m here to help you create evidence-based resources for your Multi-Tiered System of Supports. What type of resource would you like to create today?', 'assistant');

  // Add initial suggested buttons
  updateSuggestedButtons(['Intervention Menu', 'Student Intervention Plan', 'Progress Monitoring Framework']);

  // Set event listeners
  setupEventListeners();

  // Show CTA banner after 20 seconds
  setTimeout(() => {
    ctaBanner.style.display = 'flex';
  }, 20000);

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
        ctaText.innerHTML = 'Want to streamline your MTSS process? Try <strong>Nsightz MTSS Platform</strong> for comprehensive progress monitoring, data visualization, and automated reporting.';
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
});

function setupEventListeners() {
  // Send message when send button is clicked
  sendButton.addEventListener('click', sendMessage);

  // Send message when Enter key is pressed (but allow Shift+Enter for new lines)
  userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Update resource type when a suggested button is clicked
  suggestedButtonsContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('suggested-button')) {
      const buttonText = e.target.textContent;

      // Special handling for "Schedule Nsightz demo" button
      if (buttonText === 'Schedule Nsightz demo') {
        // Open a demo scheduling page in a new tab
        window.open('https://mtss.nsightz.com/launch', '_blank');

        // Add a message to the conversation
        addMessage('I\'d like to schedule a demo of the Nsightz MTSS platform.', 'user');

        // Show loading indicator
        const loadingMessage = addMessage('Thinking...', 'assistant', true);

        // Remove loading indicator after a short delay
        setTimeout(() => {
          messagesContainer.removeChild(loadingMessage);

          // Add assistant response
          addMessage('Great choice! I\'ve opened the Nsightz demo scheduling page in a new tab. A member of our team will walk you through how Nsightz can streamline your MTSS process with comprehensive progress monitoring, data visualization, and automated reporting. Is there anything specific about the platform you\'d like to know more about?', 'assistant');

          // Suggest follow-up questions
          updateSuggestedButtons([
            'Data visualization features', 
            'Integration with SIS', 
            'Implementation timeline',
            'No thanks, I\'m all set'
          ]);
        }, 1500);

        return; // Don't continue with regular button processing
      }

      // Normal button handling
      userInput.value = buttonText;
      sendMessage();

      // Determine resource type based on button text
      if (buttonText.toLowerCase().includes('intervention menu')) {
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
    }
  });

  // PDF download
  downloadPdfButton.addEventListener('click', () => {
    const { jsPDF } = window.jspdf;

    // Display loading modal
    loadingModal.classList.add('active');

    // Add Nsightz footer if not already present
    addNsightzFooter();

    // Capture HTML content as canvas
    html2canvas(resourceContent).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      // Add content to PDF
      pdf.addImage(imgData, 'PNG', 0, 15, pdfWidth, pdfHeight); // Add some top margin for header

      // Add header with title
      pdf.setFillColor(61, 160, 173); // #3da0ad
      pdf.rect(0, 0, pdfWidth, 15, 'F');

      // Add title text
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(12);

      let title = 'Nsightz MTSS Resource';
      if (currentResourceType === 'interventionMenu') {
        title = 'Nsightz MTSS Intervention Menu';
      } else if (currentResourceType === 'studentPlan') {
        title = 'Nsightz MTSS Student Intervention Plan';
      } else if (currentResourceType === 'progressMonitoring') {
        title = 'Nsightz MTSS Progress Monitoring Framework';
      }

      pdf.text(title, 20, 8);

      // Add footer with Nsightz branding
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text('© 2025 Nsightz Inc. All Rights Reserved', pdfWidth/2, pdf.internal.pageSize.getHeight() - 10, {
        align: 'center'
      });
      pdf.text('For comprehensive progress monitoring, visit mtss.nsightz.com/launch', pdfWidth/2, pdf.internal.pageSize.getHeight() - 6, {
        align: 'center'
      });

      // Generate filename based on resource type
      let filename = 'Nsightz_MTSS_Resource.pdf';
      if (currentResourceType === 'interventionMenu') {
        filename = 'Nsightz_Intervention_Menu.pdf';
      } else if (currentResourceType === 'studentPlan') {
        filename = 'Nsightz_Student_Intervention_Plan.pdf';
      } else if (currentResourceType === 'progressMonitoring') {
        filename = 'Nsightz_Progress_Monitoring_Framework.pdf';
      }

      pdf.save(filename);

      // Hide loading modal
      loadingModal.classList.remove('active');
    }).catch(error => {
      console.error('Error generating PDF:', error);
      loadingModal.classList.remove('active');
      alert('There was an error generating the PDF. Please try again.');
    });
  });

  // Export to Google Docs
  exportGoogleDocsButton.addEventListener('click', () => {
    // Add Nsightz footer if not already present
    addNsightzFooter();

    const htmlContent = resourceContent.innerHTML;

    // Create a Blob with the HTML content
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    // Generate filename based on resource type
    let filename = 'Nsightz_MTSS_Resource.html';
    if (currentResourceType === 'interventionMenu') {
      filename = 'Nsightz_Intervention_Menu.html';
    } else if (currentResourceType === 'studentPlan') {
      filename = 'Nsightz_Student_Intervention_Plan.html';
    } else if (currentResourceType === 'progressMonitoring') {
      filename = 'Nsightz_Progress_Monitoring_Framework.html';
    }

    // Create a temporary link to download the HTML file
    const tempLink = document.createElement('a');
    tempLink.href = url;
    tempLink.download = filename;
    document.body.appendChild(tempLink);
    tempLink.click();
    document.body.removeChild(tempLink);

    // Show instructions for importing to Google Docs
    alert('File downloaded. To import to Google Docs:\n1. Go to drive.google.com\n2. Click "New" > "File upload"\n3. Select the downloaded HTML file\n4. Right-click the file > "Open with" > "Google Docs"');
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