const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { Configuration, OpenAIApi } = require('openai');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import intervention data
const interventionData = require('./public/interventionData.js').interventionData;
const interventionStrategies = require('./public/interventionData.js').interventionStrategies;
const sampleInterventionPlan = require('./public/interventionData.js').sampleInterventionPlan;

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply rate limiting to all routes
app.use(limiter);

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Check for required environment variables
if (!process.env.OPENAI_API_KEY) {
  console.error('ERROR: OPENAI_API_KEY is not set in environment variables');
  process.exit(1);
}

// Configure OpenAI
let openai;
try {
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  openai = new OpenAIApi(configuration);
} catch (error) {
  console.error('Error configuring OpenAI:', error);
  process.exit(1);
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint to process chat messages
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, userSchoolLevel, resourceType } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages format' });
    }

    // Filter out any messages with null or empty content
    const validMessages = messages.filter(msg => 
      msg && 
      typeof msg.text === 'string' && 
      msg.text.trim().length > 0
    );

    // Prepare context based on resource type
    let systemPrompt = getSystemPrompt(resourceType, userSchoolLevel);

    // Format messages for OpenAI
    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...validMessages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text.trim()
      }))
    ];

    // Call OpenAI API
    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: formattedMessages,
      temperature: 0.7,
      max_tokens: 800,
    });

    if (!completion.data || !completion.data.choices || !completion.data.choices[0]) {
      throw new Error('Invalid response from OpenAI API');
    }

    // Extract response and suggested buttons if any
    const responseText = completion.data.choices[0].message.content;
    const suggestedButtons = extractSuggestedButtons(responseText, resourceType);

    res.json({
      text: responseText.replace(/\[BUTTONS:.*\]/s, '').trim(),
      suggestedButtons: suggestedButtons
    });
  } catch (error) {
    console.error('Error in /api/chat:', error.response?.data || error.message || error);
    
    // Send appropriate error message based on the type of error
    if (error.response?.status === 401) {
      res.status(500).json({ error: 'Authentication error with AI service. Please check API key configuration.' });
    } else if (error.response?.status === 429) {
      res.status(429).json({ error: 'Too many requests. Please try again in a moment.' });
    } else {
      res.status(500).json({ 
        error: 'An error occurred while processing your request.',
        details: error.message
      });
    }
  }
});

// API endpoint to generate intervention resource
app.post('/api/generate-resource', async (req, res) => {
  try {
    const { resourceType, conversationHistory, userSchoolLevel } = req.body;

    // Create specific prompt for generating the resource
    const resourcePrompt = createResourceGenerationPrompt(resourceType, conversationHistory, userSchoolLevel);

    // Call OpenAI API
    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        { role: 'system', content: resourcePrompt },
        { role: 'user', content: 'Generate a detailed, evidence-based resource incorporating our discussion points.' }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const generatedResource = completion.data.choices[0].message.content;

    res.json({
      resource: generatedResource
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred while generating the resource.' });
  }
});

// Helper Functions
function getSystemPrompt(resourceType, schoolLevel) {
  let basePrompt = `You are an expert MTSS assistant helping educators create evidence-based resources. The user works at a ${schoolLevel} school. Respond in a professional but conversational tone. After questions, suggest 2-4 button options the user might want to click that move the conversation forward and are actionable, in format [BUTTONS: option1 | option2 | ...].

When suggesting interventions, consider these domains:
- Academic (Reading, Math, Writing)
- Behavioral
- Social-Emotional
- Attendance

And these tiers:
- Tier 1: Universal supports
- Tier 2: Targeted interventions
- Tier 3: Intensive interventions

If you need more information, ask follow-up questions. Once you have enough information, confirm with the user that they want to create the resource.

At appropriate moments, suggest that Nsightz MTSS can help enhance progress monitoring and intervention fidelity. When users express interest, direct them to https://mtss.nsightz.com/launch.`;

  // Add resource-specific instructions
  switch(resourceType) {
    case 'interventionMenu':
      basePrompt += `\n\nYou're helping create an intervention menu across tiers. Ask about academic, behavioral, and social-emotional domains. Guide them through creating a structured menu of evidence-based interventions for each tier (1-3) and domain. Use the provided intervention database to suggest specific, evidence-based interventions that match the school's needs.`;
      break;
    case 'studentPlan':
      basePrompt += `\n\nYou're helping create an individual student intervention plan. Ask about the student's needs, goals, strategies, who should be responsible for the intervention, timeline, and how progress will be monitored. If these are incomplete, ask follow-up questions to gather more information. Use the provided intervention database to suggest specific, evidence-based interventions that match the student's needs.`;
      break;
    case 'progressMonitoring':
      basePrompt += `\n\nYou're helping create a progress monitoring framework. Ask about what data will be collected, how frequently, by whom, and how it will be used for decision-making. Include methods for tracking both individual students and intervention effectiveness at system level. If these are incomplete, ask follow-up questions to gather more information.`;
      break;
    default:
      basePrompt += `\n\nIntroduce yourself and ask what type of MTSS resource they want to create.`;
  }

  return basePrompt;
}

function extractSuggestedButtons(text, resourceType) {
  // Extract button suggestions from the response using | as delimiter
  const buttonMatch = text.match(/\[BUTTONS:(.*?)\]/);
  if (buttonMatch && buttonMatch[1]) {
    return buttonMatch[1].split('|').map(btn => btn.trim());
  }

  // Default buttons based on resource type if none suggested
  switch(resourceType) {
    case 'interventionMenu':
      return ['Academic Interventions', 'Behavioral Interventions', 'Social-Emotional Interventions', 'Next Step'];
    case 'studentPlan':
      return ['Academic Goal', 'Behavioral Goal', 'Let me describe the student situation'];
    case 'progressMonitoring':
      return ['Weekly Monitoring', 'Bi-weekly Monitoring', 'Recommendations'];
    default:
      return ['Intervention Menu', 'Student Plan', 'Progress Monitoring'];
  }
}

function createResourceGenerationPrompt(resourceType, conversationHistory, schoolLevel) {
  const userMessages = conversationHistory.filter(msg => msg.sender === 'user').map(msg => msg.text);
  const assistantMessages = conversationHistory.filter(msg => msg.sender === 'assistant').map(msg => msg.text);

  let prompt = `You are an expert MTSS specialist creating a professional ${resourceType} for a ${schoolLevel} school. Use evidence-based practices from these sources:
- What Works Clearinghouse
- Evidence for ESSA
- Intervention Central
- Harmony SEL
- Florida Center for Reading Research
- Everyday Speech MTSS Intervention Library
- RethinkEd MTSS Suite
- OSE Educational Partnership
- National Center on Intensive Intervention

Generate a comprehensive resource in markdown format that follows best practices and research-based strategies.`;

  switch(resourceType) {
    case 'interventionMenu':
      prompt += `\n\nCreate a tiered intervention menu that includes:
- 2-3 key interventions per tier with strong evidence base
- Clear implementation steps and required resources
- Expected outcomes and progress indicators
- Specific examples for academic, behavioral, and social-emotional domains
Format with clear headers and sections by tier.`;
      break;
    case 'studentPlan':
      prompt += `\n\nCreate a comprehensive student intervention plan including:
- Student Information (use placeholder)
- Specific Areas of Concern (based on data)
- SMART Goals (2-3 targeted goals)
- Selected Evidence-Based Interventions
- Implementation Timeline (6-8 weeks)
- Staff Responsibilities
- Progress Monitoring Schedule
Format as a professional, actionable document.`;
      break;
    case 'progressMonitoring':
      prompt += `\n\nCreate a detailed progress monitoring framework including:
- Essential Data Points to Track
- Collection Schedule (daily/weekly/monthly)
- Staff Roles and Responsibilities
- Decision Rules for Adjusting Interventions
- Sample Data Collection Forms
Format with clear sections and practical examples.`;
      break;
  }

  // Add conversation context
  prompt += `\n\nBased on our conversation:\n${userMessages.join('\n')}`;

  return prompt;
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});