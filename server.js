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

// Configure Express to trust proxy headers for Vercel deployment
app.set('trust proxy', true);

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Add debug logging middleware
app.use((req, res, next) => {
  console.log(`[DEBUG] Incoming request: ${req.method} ${req.path}`);
  next();
});

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting to all routes
app.use(limiter);

// Configure OpenAI
if (!process.env.OPENAI_API_KEY) {
  console.error('ERROR: OPENAI_API_KEY is not set in environment variables');
  process.exit(1);
}

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

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Handle root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle all API routes
app.use('/api', (req, res, next) => {
  console.log('[DEBUG] API request received:', req.path);
  next();
});

// Catch-all route for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint to process chat messages
app.post(['/api/chat', '/interventions/api/chat'], async (req, res) => {
  console.log('[DEBUG] Processing chat message');
  try {
    const { messages, resourceType, schoolLevel = 'K-12' } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      throw new Error('Invalid messages format');
    }

    // Filter out messages with null content
    const validMessages = messages.filter(msg => msg && msg.content);
    
    const formattedMessages = [
      { role: "system", content: getSystemPrompt(resourceType, schoolLevel) },
      ...validMessages
    ];

    const completion = await openai.createChatCompletion({
      model: "gpt-4-turbo-preview",
      messages: formattedMessages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const aiResponse = completion.data.choices[0].message.content;
    console.log('[DEBUG] AI Response:', aiResponse);
    
    // Extract suggested buttons if any
    const suggestedButtons = extractSuggestedButtons(aiResponse, resourceType);
    
    res.json({
      message: aiResponse,
      suggestedButtons: suggestedButtons
    });
  } catch (error) {
    console.error('[ERROR] Chat processing error:', error);
    res.status(500).json({ 
      error: 'Failed to process chat message',
      details: error.message 
    });
  }
});

// API endpoint to generate resources
app.post(['/api/generate-resource', '/interventions/api/generate-resource'], async (req, res) => {
  console.log('[DEBUG] Generating resource');
  try {
    const { messages, resourceType, schoolLevel = 'K-12' } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      throw new Error('Invalid messages format');
    }

    // Generate resource content using conversation history
    const resourcePrompt = createResourceGenerationPrompt(messages, resourceType, schoolLevel);
    
    const completion = await openai.createChatCompletion({
      model: "gpt-4-turbo-preview",
      messages: [{ role: "user", content: resourcePrompt }],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const resourceContent = completion.data.choices[0].message.content;
    console.log('[DEBUG] Resource generated successfully');
    
    res.json({ content: resourceContent });
  } catch (error) {
    console.error('[ERROR] Resource generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate resource',
      details: error.message 
    });
  }
});

// Helper function to generate resource sections
async function generateResourceSection(type, section, context, schoolLevel) {
  const sectionPrompts = {
    interventionMenu: {
      overview: `Create a brief introduction and overview section for a ${schoolLevel} school intervention menu. Include purpose and how to use the menu. Format in markdown.`,
      tier1: `Create the Tier 1 (Universal) section of the intervention menu. Include 2-3 key interventions with implementation steps and outcomes. Focus on universal supports.`,
      tier2: `Create the Tier 2 (Targeted) section of the intervention menu. Include 2-3 key interventions with implementation steps and outcomes. Focus on small group interventions.`,
      tier3: `Create the Tier 3 (Intensive) section of the intervention menu. Include 2-3 key interventions with implementation steps and outcomes. Focus on individual interventions.`
    },
    studentPlan: {
      info: `Create the student information and areas of concern sections for a student intervention plan. Use placeholder student info and focus on clear documentation of concerns.`,
      goals: `Create the goals and intervention selection section. Include 2-3 SMART goals and selected evidence-based interventions that align with the concerns discussed.`,
      implementation: `Create the implementation timeline, staff responsibilities, and progress monitoring sections. Include specific schedules and clear staff roles.`
    },
    progressMonitoring: {
      framework: `Create the overview and data collection framework sections. Include essential data points and collection schedules.`,
      roles: `Create the staff roles, responsibilities, and decision rules sections. Include clear guidelines for using the data.`,
      forms: `Create sample data collection forms and progress monitoring templates. Include practical examples.`
    }
  };

  const prompt = `You are an expert MTSS specialist creating part of a ${type} for a ${schoolLevel} school. Use evidence-based practices from reputable sources.
${sectionPrompts[type][section]}

Context from conversation:
${context}`;

  const completion = await openai.createChatCompletion({
    model: "gpt-4",
    messages: [
      { role: 'system', content: prompt },
      { role: 'user', content: 'Generate this section of the resource.' }
    ],
    temperature: 0.7,
    max_tokens: 1000,
  });

  return completion.data.choices[0].message.content;
}

// API endpoint to generate resource sections
app.post('/interventions/api/generate-resource-section', async (req, res) => {
  try {
    const { resourceType, section, conversationHistory, userSchoolLevel } = req.body;
    
    // Get relevant context from conversation
    const context = conversationHistory
      .filter(msg => msg.sender === 'user')
      .map(msg => msg.text)
      .join('\n');

    const sectionContent = await generateResourceSection(
      resourceType,
      section,
      context,
      userSchoolLevel
    );

    res.json({
      section: sectionContent
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred while generating the resource section.' });
  }
});

// Helper Functions
function getSystemPrompt(resourceType, schoolLevel = 'K-12') {
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

function createResourceGenerationPrompt(messages, resourceType, schoolLevel = 'K-12') {
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
  prompt += `\n\nBased on our conversation:\n${messages.join('\n')}`;

  return prompt;
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});