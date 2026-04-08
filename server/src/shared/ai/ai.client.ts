import axios from 'axios';
import { env } from '../../config/env';
import logger from '../../config/logger';

interface AiMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface AiRequestOptions {
    messages: AiMessage[];
    temperature?: number;
    maxTokens?: number;
    jsonResponse?: boolean;
}

class AiClient {
    private maxRetries = 3;
    private baseDelay = 1000;

    async chat(options: AiRequestOptions): Promise<string> {
        const { messages, temperature = 0.3, maxTokens = 4096, jsonResponse = false } = options;

        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                const startTime = Date.now();

                const response = await axios.post(
                    'https://api.groq.com/openai/v1/chat/completions',
                    {
                        model: env.AI_MODEL,
                        messages,
                        temperature,
                        max_tokens: maxTokens,
                        response_format: jsonResponse ? { type: 'json_object' } : undefined,
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${env.GROQ_API_KEY}`,
                            'Content-Type': 'application/json',
                        },
                        timeout: 60000,
                    }
                );

                const duration = Date.now() - startTime;
                logger.info(`AI request completed in ${duration}ms (Groq: ${env.AI_MODEL})`);

                const text = response.data.choices?.[0]?.message?.content;

                if (!text) {
                    throw new Error('Empty response from AI API');
                }

                return text;
            } catch (error: any) {
                lastError = error as Error;
                const status = error.response?.status;
                const errorMessage = error.response?.data?.error?.message || error.message;

                logger.warn(`AI API attempt ${attempt} failed (Status ${status}): ${errorMessage}`);

                // Don't retry on certain errors (auth, validation, etc.)
                if (status === 401 || status === 403 || status === 400) {
                    throw new Error(`AI API Critical Error: ${errorMessage}`);
                }

                if (attempt < this.maxRetries) {
                    const delay = this.baseDelay * Math.pow(2, attempt - 1);
                    logger.info(`Retrying AI API in ${delay}ms (attempt ${attempt + 1}/${this.maxRetries})...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        throw lastError || new Error('AI API request failed after retries');
    }

    async chatJson<T>(options: AiRequestOptions): Promise<T> {
        const response = await this.chat({ ...options, jsonResponse: true });

        try {
            // Strip potential markdown code blocks
            const cleaned = response.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
            return JSON.parse(cleaned) as T;
        } catch (error) {
            logger.error('Failed to parse AI JSON response:', {
                error: (error as Error).message,
                response: response.substring(0, 500)
            });
            throw new Error('Invalid JSON response from AI API');
        }
    }
}

export const aiClient = new AiClient();
