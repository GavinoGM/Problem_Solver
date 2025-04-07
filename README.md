# SmartSolver - AI-Powered Problem Solving Application


## 📋 Description

SmartSolver is a web application that uses AI to help users analyze problems, reframe them from different perspectives, and generate innovative solutions. The app guides users through a structured problem-solving process enhanced by artificial intelligence.

## ✨ Features

- **Problem Analysis**: Detailed problem breakdown with stakeholders, root causes, and impact assessment
- **AI-Powered Reframing**: Alternative perspectives on your problem
- **Solution Generation**: AI-generated solutions based on context and problem reframing
- **Solution Enhancement**: Elaboration, examples, action plans, and metrics for each solution
- **Multi-Model Support**: Integration with OpenAI (GPT-4, GPT-3.5) and Anthropic (Claude) models
- **Export Functionality**: Save solutions as structured text files

## 🛠️ Tech Stack

- **Frontend**: HTML, CSS, JavaScript, Tailwind CSS
- **Backend**: Node.js, Express
- **AI**: OpenAI and Anthropic API integration
- **Hosting**: Replit

## 📦 Installation

### Using Replit (Easiest Option)

1. Visit this repository on GitHub
2. Fork it directly to your Replit account using the "Fork on Replit" button
3. Alternatively, you can clone this repository and import it into Replit manually

```bash
# Clone the repository
git clone https://github.com/YourUsername/smartsolver.git

# Then import the folder into Replit
```

### Local Installation

```bash
# Clone the repository
git clone https://github.com/YourUsername/smartsolver.git

# Navigate to the directory
cd smartsolver

# Install dependencies
npm install

# Start the server
npm start
```

## ⚙️ Configuration

### Setting up API Keys

#### On Replit
1. In your Replit project, go to "Tools" > "Secrets"
2. Add the following secrets:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `ANTHROPIC_API_KEY`: Your Anthropic API key (optional)
   - `OPENAI_MODEL`: (Optional) To specify a different model than the default (gpt-4)

#### Local Configuration
1. Create a `.env` file in the root directory with the following content:
```
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
OPENAI_MODEL=gpt-4 # optional
```

## 🧠 How to Use

1. **Define the Problem**:
   - Describe your problem in detail
   - Select the domain (general, product, technology, marketing, etc.)
   - Set the complexity level
   - Add additional context (optional)

2. **Analyze the Problem**:
   - Click "Analyze Problem"
   - Add stakeholders, root causes, and impact assessment (optional)

3. **Explore Alternative Perspectives**:
   - Click "Reframe" to get alternative problem perspectives
   - Add custom reframings (optional)

4. **Generate Solutions**:
   - Click the light bulb icon next to a reframing to generate solutions
   - The system will generate solutions based on the reframed problem

5. **Enhance Solutions**:
   - Click on a solution to view details
   - Use "Elaborate," "Examples," "Action Plan," and "Metrics" buttons
   - Ask custom questions to the AI

6. **Export Solutions**:
   - Use the "Export" button to save individual solutions as text files
   - Or "Save Solutions" to save all generated solutions

## 🔄 Supported AI Models

### OpenAI
- GPT-4 (Most Capable)
- GPT-4 Turbo
- GPT-3.5 Turbo (Faster)
- GPT-3.5 Turbo 16K

### Anthropic
- Claude 3 Opus (Most Capable)
- Claude 3 Sonnet (Balanced)
- Claude 3 Haiku (Fast)

## 🏠 Deployment Options

### Replit (Recommended)
The app is designed to run seamlessly on Replit:
1. Fork the project to your Replit account
2. Configure API keys in Secrets
3. Run the app
4. The app will be available at your Replit URL

### Other Hosting Options
If you want to deploy elsewhere:

1. **Vercel/Netlify/Render**:
   - Set up environment variables for API keys
   - Configure to run `npm start` as the start command

2. **Traditional VPS**:
   - Clone the repository
   - Install Node.js
   - Run with PM2 or similar: `pm2 start server.js`

### Resource Requirements
- Minimal server requirements: 512MB RAM, 1 CPU core
- Storage: ~50MB for code and dependencies
- The main resource consumption comes from API calls to OpenAI/Anthropic

## 🔐 API Key Security

- API keys are never sent to the frontend
- All requests pass through the server
- On Replit, keys are stored as "Secrets" and are not publicly accessible
- In local configuration, use `.env` files (added to `.gitignore`)

## 📜 License

This project is licensed under the MIT License. See the `LICENSE` file for details.

---

<p align="center">
  For support or inquiries, please open an issue on GitHub.
</p>