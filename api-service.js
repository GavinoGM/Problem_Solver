/**
 * API Service for handling API calls to OpenAI
 */
class ApiService {
    constructor() {
        // Configuration will be loaded asynchronously
        this.config = null;
        this.configPromise = this._loadConfig();
        this.model = 'gpt-4'; // Default model
        this.temperature = 0.7; // Default temperature

        // Add temperature control handler
        document.addEventListener('DOMContentLoaded', () => {
            const temperatureControl = document.getElementById('temperatureControl');
            const temperatureValue = document.getElementById('temperatureValue');
            if (temperatureControl && temperatureValue) {
                temperatureControl.addEventListener('input', (e) => {
                    this.temperature = Number(e.target.value) / 100;
                    temperatureValue.textContent = this.temperature.toFixed(2);
                });
            }
        this.retryCount = 3; // Number of retry attempts

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

        let lastError = null;
        for (let attempt = 0; attempt < this.retryCount; attempt++) {
            try {
                const response = await fetch('/api/openai', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: this.model,
                        messages: [
                            { role: 'system', content: 'You are an expert problem-solving assistant. Analyze all provided context including stakeholders, root causes, and impact assessments to provide comprehensive, targeted solutions.' },
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
            } catch (error) {
                console.error(`API call attempt ${attempt + 1} failed:`, error);
                lastError = error;
                if (attempt < this.retryCount) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
                    continue;
                }
                throw lastError;
            }
        }
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
        // Get values from optional input fields
        const stakeholders = document.getElementById('stakeholders')?.value.trim();
        const rootCauses = document.getElementById('rootCauses')?.value.trim();
        const impactAssessment = document.getElementById('impactAssessment')?.value.trim();

        // Add timestamp for uniqueness
        const timestamp = Date.now();

        return `At timestamp ${timestamp}, generate 3 completely new and innovative solutions for the following problem, heavily incorporating ALL provided context and analysis:

Problem: "${problem}"
Domain: ${domain}
Complexity: ${complexity}/5
${context ? `Additional Context: ${context}` : ''}
${stakeholders ? `\nStakeholders Analysis:\n${stakeholders}\nConsider how each solution impacts these stakeholders.` : ''}
${rootCauses ? `\nRoot Causes Identified:\n${rootCauses}\nEnsure solutions address these underlying causes.` : ''}
${impactAssessment ? `\nImpact Assessment:\n${impactAssessment}\nPropose solutions that minimize negative impacts and maximize positive ones.` : ''}

Considering ALL provided context above, for each solution provide:
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
        // Get values from optional input fields
        const stakeholders = document.getElementById('stakeholders')?.value.trim();
        const rootCauses = document.getElementById('rootCauses')?.value.trim();
        const impactAssessment = document.getElementById('impactAssessment')?.value.trim();

        // Add timestamp to ensure uniqueness
        const timestamp = Date.now();

        return `Given this problem and timestamp ${timestamp}, generate 3 completely new and radically different perspective shifts. Each reframe must be unique and never previously generated:

Problem: "${problem}"
Domain: ${domain}
${context ? `Additional Context: ${context}` : ''}
${stakeholders ? `\nStakeholders Involved:\n${stakeholders}\nConsider their perspectives in reframing.` : ''}
${rootCauses ? `\nUnderlying Root Causes:\n${rootCauses}\nUse these insights to challenge assumptions.` : ''}
${impactAssessment ? `\nCurrent Impact Analysis:\n${impactAssessment}\nConsider both positive and negative implications.` : ''}

Leverage ALL the context above to use exactly one of these approaches for each reframe (no repeating):
1. Inversion/Contradiction: What if the opposite was true? What if we wanted the problem to get worse?
2. Systems Thinking: How does this problem connect to larger systems? What feedback loops exist?
3. Random Association: Connect this problem to a completely different domain or natural phenomenon

Requirements for each reframe:
- Must challenge core assumptions of the original problem
- Must open up entirely new solution possibilities 
- Must incorporate relevant stakeholder perspectives and context
- Must be specific and actionable, not abstract

Format response as JSON array with 3 strings, each using a different approach:
["Inversion perspective: ...", "Systems perspective: ...", "Random association perspective: ..."]`;
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
            let responseText = typeof response === 'string' ? response : 
                             response.content || response.choices?.[0]?.message?.content || response.messages?.[0]?.content;

            // Try to parse JSON directly
            try {
                solutions = JSON.parse(responseText);
            } catch (e) {
                // If direct parsing fails, extract JSON from text
                const jsonMatch = responseText.match(/\[[\s\S]*\]/);
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
            let responseText = typeof response === 'string' ? response : 
                             response.content || response.choices?.[0]?.message?.content || response.messages?.[0]?.content;

            // Try to parse JSON directly
            try {
                reframes = JSON.parse(responseText);
            } catch (e) {
                // If direct parsing fails, extract JSON from text
                const jsonMatch = responseText.match(/\[[\s\S]*\]/);
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