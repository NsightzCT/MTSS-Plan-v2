# MTSS Assistant

A conversational MTSS (Multi-Tiered System of Supports) assistant tool that helps school administrators create intervention resources.

## Features

- Create intervention menus across tiers
- Build individual student intervention plans
- Develop progress monitoring frameworks
- Export resources as PDF or Google Docs
- Conversational interface with suggested responses

## Technology Stack

- **Backend**: Node.js with Express
- **Frontend**: HTML, CSS, JavaScript
- **AI Integration**: OpenAI API
- **Export Options**: PDF generation with jsPDF and html2canvas

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)
- OpenAI API key

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/mtss-assistant.git
   cd mtss-assistant
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file based on the example:
   ```
   cp .env.example .env
   ```

4. Add your OpenAI API key to the `.env` file:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

### Running the Application

1. Start the server:
   ```
   npm start
   ```

2. For development with auto-reload:
   ```
   npm run dev
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## Usage

1. Select your school level (Elementary, Middle, or High School) from the dropdown menu.
2. Choose the type of resource you want to create:
   - Intervention Menu
   - Student Intervention Plan
   - Progress Monitoring Framework
3. Follow the conversational prompts to provide details about your specific needs.
4. Use the suggested buttons for quick responses or type custom messages.
5. When ready, click the "Generate Resource" button to create your MTSS resource.
6. Preview the resource and download it as a PDF or export to Google Docs.

## Deployment on Replit

1. Create a new Replit project and select "Node.js" as the template.
2. Upload all the files from this repository to your Replit project.
3. Create a new secret named `OPENAI_API_KEY` and add your OpenAI API key as the value.
4. Run the project by clicking the "Run" button.

## Project Structure

```
mtss-assistant/
│
├── server.js                 # Express server and API endpoints
├── package.json              # Project dependencies
├── .env.example              # Environment variables example
│
└── public/                   # Frontend files
    ├── index.html            # Main HTML structure
    ├── style.css             # CSS styles
    └── script.js             # Frontend JavaScript
```

## License

MIT

## Acknowledgments

- Built with evidence-based practices from What Works Clearinghouse (WWC), Evidence for ESSA, National Center on Intensive Intervention, and Attendance Works.