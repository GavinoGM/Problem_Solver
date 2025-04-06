/**
 * API Service for handling API calls to OpenAI
 */
class ApiService {
    constructor() {
        // Configuration will be loaded asynchronously
        this.config = null;
        this.configPromise = this._loadConfig();
        this.model = 'gpt-4'; // Default model
        
        // Add model selection handler
        document.addEventListener('DOMContentLoaded', () => {
            const modelSelect = document.getElementById('modelSelect');
            if (modelSelect) {
                modelSelect.value = this.model;
                modelSelect.addEventListener('change', (e) => {
                    this.model = e.target.value;
                    console.log('Model changed to:', this.model);
                });
            }
        });
    }

    /**
     * Load configuration from server
     * @returns {Promise<Object>} - Configuration object
     * @private
     */
    async _loadConfig() {
        try {
            const response = await fetch('/api/config');
            if (!response.ok) {
                throw new Error('Failed to load API configuration');
            }
            
            this.config = await response.json();
            if (this.config.model) {
                this.model = this.config.model;
            }
            
            console.log('API configuration loaded:', 
                this.config.apiKeyConfigured ? 'API Key configured ✓' : 'No API Key found ✗');
            
            // Update model name in UI
            const modelNameElement = document.getElementById('aiModelName');
            if (modelNameElement) {
                modelNameElement.textContent = this.model || 'GPT-4';
            }
            return this.config;
        } catch (error) {
            console.error('Error loading API configuration:', error);
            this.config = { apiKeyConfigured: false };
            return this.config;
        }
    }

    /**
     * Generate AI solutions based on problem description and domain
     * @param {string} problem - The problem description
     * @param {string} domain - The problem domain
     * @param {number} complexity - Complexity level (1-5)
     * @param {string} context - Additional context (optional)
     * @returns {Promise<Array>} - Array of solution objects
     */
    async generateSolutions(problem, domain, complexity, context = '') {
        // Ensure config is loaded
        await this.configPromise;
        
        const prompt = this._buildSolutionPrompt(problem, domain, complexity, context);
        
        try {
            const response = await this._callOpenAI(prompt);
            return this._parseSolutionsResponse(response, problem);
        } catch (error) {
            console.error('Error generating solutions:', error);
            throw error;
        }
    }

    /**
     * Reframe a problem with AI assistance
     * @param {string} problem - The original problem
     * @param {string} domain - The problem domain
     * @param {string} context - Additional context (optional)
     * @returns {Promise<Array>} - Array of reframed problem statements
     */
    async reframeProblem(problem, domain, context = '') {
        // Ensure config is loaded
        await this.configPromise;
        
        const prompt = this._buildReframingPrompt(problem, domain, context);
        
        try {
            const response = await this._callOpenAI(prompt);
            return this._parseReframingResponse(response);
        } catch (error) {
            console.error('Error reframing problem:', error);
            throw error;
        }
    }

    /**
     * Enhance a solution with AI
     * @param {Object} solution - The solution object
     * @param {string} enhancementType - Type of enhancement (elaborate, examples, etc.)
     * @param {string} problem - The original problem
     * @returns {Promise<string>} - HTML content for enhancement
     */
    async enhanceSolution(solution, enhancementType, problem) {
        // Ensure config is loaded
        await this.configPromise;
        
        const prompt = this._buildEnhancementPrompt(solution, enhancementType, problem);
        
        try {
            const response = await this._callOpenAI(prompt);
            return this._formatEnhancement(response, enhancementType);
        } catch (error) {
            console.error('Error enhancing solution:', error);
            throw error;
        }
    }

    /**
     * Process custom AI prompt from user
     * @param {string} customPrompt - User's custom prompt
     * @param {Object} solution - The current solution being viewed
     * @param {string} problem - The original problem
     * @returns {Promise<string>} - AI response
     */
    async processCustomPrompt(customPrompt, solution, problem) {
        // Ensure config is loaded
        await this.configPromise;
        
        const prompt = this._buildCustomPrompt(customPrompt, solution, problem);
        
        try {
            const response = await this._callOpenAI(prompt);
            return response.trim();
        } catch (error) {
            console.error('Error processing custom prompt:', error);
            throw error;
        }
    }

    /**
     * Call OpenAI API via server proxy
     * @param {string} prompt - The prompt to send to OpenAI
     * @returns {Promise<string>} - OpenAI response text
     * @private
     */
    async _callOpenAI(prompt) {
        // Check if API key is configured
        if (!this.config || !this.config.apiKeyConfigured) {
            throw new Error('OpenAI API key not configured. Please set it in Replit Secrets.');
        }
        
        // Use server proxy to avoid CORS and hide API key
        // Log which model is being used
        console.log('Using AI model:', this.model);
        
        const response = await fetch('/api/openai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: this.model,
                messages: [
                    { role: 'system', content: 'You are an expert problem-solving assistant. Your responses should be helpful, innovative, and directly address the user\'s problem with actionable insights.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: this.model.includes('16k') ? 16000 : 4000,
                provider: this.model.startsWith('claude') ? 'anthropic' : 'openai',
                model_family: this.model.startsWith('claude-3') ? 'claude-3' : 
                            this.model.startsWith('claude') ? 'claude' : 
                            this.model.startsWith('gpt-4') ? 'gpt-4' : 'gpt-3.5'
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    /**
     * Build prompt for solution generation
     * @param {string} problem - The problem description
     * @param {string} domain - The problem domain 
     * @param {number} complexity - Complexity level (1-5)
     * @param {string} context - Additional context
     * @returns {string} - Formatted prompt
     * @private
     */
    _buildSolutionPrompt(problem, domain, complexity, context) {
        return `Generate 3 innovative solutions for the following problem:
        
Problem: "${problem}"
Domain: ${domain}
Complexity: ${complexity}/5
${context ? `Additional Context: ${context}` : ''}

For each solution, provide:
1. A title that captures the essence of the approach
2. A one-sentence description that summarizes the solution
3. A detailed explanation of how the solution addresses the problem (3-5 sentences)
4. A suitable icon from Font Awesome (specify as a Font Awesome class name like 'fas fa-brain')

Return the solutions in JSON format with the following structure:
[
  {
    "title": "Solution Title",
    "description": "Brief description",
    "content": "Detailed explanation",
    "icon": "fas fa-icon-name"
  },
  ...
]

Be creative, practical, and ensure the solutions are genuinely useful for solving the stated problem in the ${domain} domain.`;
    }

    /**
     * Build prompt for problem reframing
     * @param {string} problem - The problem description
     * @param {string} domain - The problem domain
     * @param {string} context - Additional context
     * @returns {string} - Formatted prompt
     * @private
     */
    _buildReframingPrompt(problem, domain, context = '') {
        return `Reframe the following problem in 3 different innovative ways to help uncover new perspectives and solutions:

Problem: "${problem}"
Domain: ${domain}
${context ? `Additional Context: ${context}` : ''}

For each reframing:
1. Use a different cognitive technique (e.g., inverse thinking, first principles, analogy, constraint addition/removal)
2. Make sure the reframing opens up new solution spaces or angles
3. Keep the reframing concise but insightful (1-2 sentences)
4. Consider the additional context provided, if any

Return the reframings as an array of strings in JSON format:
["Reframing 1", "Reframing 2", "Reframing 3"]

Each reframing should be complete and coherent on its own.`;
    }

    /**
     * Build prompt for solution enhancement
     * @param {Object} solution - The solution object
     * @param {string} enhancementType - Type of enhancement
     * @param {string} problem - The original problem
     * @returns {string} - Formatted prompt
     * @private
     */
    _buildEnhancementPrompt(solution, enhancementType, problem) {
        const enhancementPrompts = {
            'Elaborate': `Provide a detailed explanation of the following solution, diving deeper into the mechanisms, theory, and logic behind it:`,
            'Give examples': `Provide 2-3 specific real-world examples or case studies of how this solution has been applied successfully in similar contexts:`,
            'Create action steps': `Create a practical implementation plan with 3-5 specific action steps, timeframes, and responsible roles for executing this solution:`,
            'Suggest metrics': `Suggest 4-6 key performance indicators (KPIs) or metrics that would help measure the success of this solution:`,
        };

        const prompt = enhancementPrompts[enhancementType] || 'Provide additional insights about this solution:';
        
        return `${prompt}

Problem: "${problem}"
Solution: "${solution.title}"
${solution.description ? `Description: ${solution.description}` : ''}
${solution.content ? `Content: ${solution.content}` : ''}

Be specific, practical, and actionable in your response. Focus on providing genuinely useful information that would help implement this solution successfully.`;
    }

    /**
     * Build prompt for custom user request
     * @param {string} customPrompt - User's custom prompt
     * @param {Object} solution - The current solution
     * @param {string} problem - The original problem
     * @returns {string} - Formatted prompt
     * @private
     */
    _buildCustomPrompt(customPrompt, solution, problem) {
        return `Please respond to the following request regarding a solution to a problem:

Original Problem: "${problem}"
Solution being discussed: "${solution.title}"
${solution.description ? `Description: ${solution.description}` : ''}
${solution.content ? `Content: ${solution.content}` : ''}

User's request: "${customPrompt}"

Provide a helpful, concise response that directly addresses the user's request in the context of this solution and problem.`;
    }

    /**
     * Parse AI response for solutions
     * @param {string} response - OpenAI response 
     * @param {string} problem - The original problem
     * @returns {Array} - Array of solution objects
     * @private
     */
    _parseSolutionsResponse(response, problem) {
        try {
            let solutions;
            
            // Try to parse JSON directly
            try {
                solutions = JSON.parse(response);
            } catch (e) {
                // If direct parsing fails, extract JSON from text
                const jsonMatch = response.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    solutions = JSON.parse(jsonMatch[0]);
                } else {
                    throw new Error('Could not extract JSON from response');
                }
            }
            
            // Validate and format solutions
            return solutions.map((solution, i) => ({
                title: solution.title || `Solution ${i+1}`,
                description: solution.description || '',
                content: solution.content || '',
                icon: solution.icon || 'fas fa-lightbulb',
                isAI: true
            }));
        } catch (error) {
            console.error('Error parsing solutions response:', error);
            // Fallback to create basic solution objects if parsing fails
            return [
                {
                    title: 'AI Solution Approach',
                    content: response,
                    icon: 'fas fa-robot',
                    isAI: true
                }
            ];
        }
    }

    /**
     * Parse AI response for problem reframing
     * @param {string} response - OpenAI response
     * @returns {Array} - Array of reframing statements
     * @private
     */
    _parseReframingResponse(response) {
        try {
            let reframes;
            
            // Try to parse JSON directly
            try {
                reframes = JSON.parse(response);
            } catch (e) {
                // If direct parsing fails, extract JSON from text
                const jsonMatch = response.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    reframes = JSON.parse(jsonMatch[0]);
                } else {
                    throw new Error('Could not extract JSON from response');
                }
            }
            
            return Array.isArray(reframes) ? reframes : [response];
        } catch (error) {
            console.error('Error parsing reframing response:', error);
            // Fallback if parsing fails
            return [response];
        }
    }

    /**
     * Format enhancement response as HTML
     * @param {string} response - OpenAI response
     * @param {string} enhancementType - Type of enhancement
     * @returns {string} - Formatted HTML
     * @private
     */
    _formatEnhancement(response, enhancementType) {
        const enhancementStyles = {
            'Elaborate': {
                bgColor: 'bg-blue-50',
                borderColor: 'border-blue-100',
                textColor: 'text-blue-800',
                icon: 'fas fa-info-circle'
            },
            'Give examples': {
                bgColor: 'bg-green-50',
                borderColor: 'border-green-100',
                textColor: 'text-green-800',
                icon: 'fas fa-list-ul'
            },
            'Create action steps': {
                bgColor: 'bg-purple-50',
                borderColor: 'border-purple-100',
                textColor: 'text-purple-800',
                icon: 'fas fa-tasks'
            },
            'Suggest metrics': {
                bgColor: 'bg-yellow-50',
                borderColor: 'border-yellow-100',
                textColor: 'text-yellow-800',
                icon: 'fas fa-chart-line'
            }
        };

        const style = enhancementStyles[enhancementType] || {
            bgColor: 'bg-gray-50',
            borderColor: 'border-gray-200',
            textColor: 'text-gray-800',
            icon: 'fas fa-lightbulb'
        };

        const formattedText = response
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>');

        return `
            <div class="mt-4 ${style.bgColor} p-4 rounded-lg border ${style.borderColor}">
                <h4 class="font-medium ${style.textColor} mb-2 flex items-center">
                    <i class="${style.icon} mr-2"></i> ${enhancementType}
                </h4>
                <div class="text-gray-700">
                    <p>${formattedText}</p>
                </div>
            </div>
        `;
    }
}

// Create and export instance
const apiService = new ApiService();
export default apiService;