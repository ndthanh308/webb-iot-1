import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

export const runtime = 'edge'; // This is a common pattern for AI SDK routes, but I will remove it if it causes issues.

export async function POST(req: Request) {
  const { messages } = await req.json();

  const { text } = await generateText({
    model: openai('gpt-4o'),
    prompt: messages[messages.length - 1].content, // Use the last message as the prompt
  });

  return new Response(JSON.stringify({ text }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
