# SmartSolver - AI-Powered Problem Solving

SmartSolver is a web application that helps users analyze and solve problems using both structured frameworks and AI-generated creative solutions.

## Features

- **Framework Mode**: Access proven problem-solving frameworks based on the problem domain
- **AI Creative Mode**: Generate innovative solutions powered by OpenAI's GPT models
- **Problem Reframing**: Get AI-assisted alternative perspectives on your problem
- **Solution Enhancement**: Elaborate on solutions with AI-generated insights
- **Interactive UI**: Seamless experience for problem solving

## Deployment on Replit

1. Create a new Replit using the "Import from GitHub" option
2. Set the following secrets in your Replit environment:
   - `OPENAI_API_KEY`: Your OpenAI API key 
   - `OPENAI_MODEL`: (Optional) Specify a different model than the default (gpt-4o)

3. Run the following commands in the Replit shell:
   ```
   npm install
   npm start
   ```

4. Your SmartSolver app should now be running!

## Local Development

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```
4. Start the development server:
   ```
   npm run dev
   ```
5. Open `http://localhost:3000` in your browser

## Technology Stack

- Frontend: HTML, CSS, JavaScript, TailwindCSS
- Backend: Node.js, Express
- AI: OpenAI API (GPT models)

## License

MIT