import { ChatOpenAI } from '@langchain/openai';
import { env } from '../../config/env';

export const langchainAiClient = new ChatOpenAI({
    modelName: env.AI_MODEL,
    apiKey: env.GROQ_API_KEY,
    configuration: {
        baseURL: 'https://api.groq.com/openai/v1',
    },
    temperature: 0.5,
});
