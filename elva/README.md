# ELVA

A mobile-friendly personal assistant with everyday chat, live web search, weather forecasts, voice controls, and a workspace for notes, tasks, and drafts.

## Run locally

1. Install Node.js 24.
2. Copy .env.example to .env.local and fill in the keys below.
3. Run `npm run dev` and open http://localhost:3000.

| Variable | Where to get it |
| --- | --- |
| GEMINI_API_KEY | https://aistudio.google.com/apikey |
| TAVILY_API_KEY | https://app.tavily.com/ |

Gemini powers chat and tool selection. Tavily powers news and search. Open-Meteo weather requires no key. The keys are read server-side. Keep .env.local private.

## Deploy to Vercel

1. Extract the ZIP and open the elva folder. It contains package.json and vercel.json.
2. Import a Git repository containing this folder's contents into Vercel, or run `npx vercel` from the folder. Use the project configuration from vercel.json.
3. In Vercel project settings, add GEMINI_API_KEY and TAVILY_API_KEY under Environment Variables for the deployment environments you use.
4. Redeploy after adding the values. For a production CLI deployment, run `npx vercel --prod`.
5. Open the deployment and try the news prompt below. Keep the demo link within your intended audience, since requests use your API quotas.

## Try the live demo

Send “Find one AI news story from today in India and save a short summary with the source.” ELVA searches the web, shows publisher links, and saves the summary in Workspace. Reload to see the saved note. To demonstrate weather, ask “What’s the weather in Chandigarh tomorrow?”

The workspace persists in the current browser. Recent chat and up to 25 workspace items are sent to Gemini as context when you submit a message. Chat history resets when you reload. Read aloud uses browser speech synthesis. Microphone input depends on browser support and permissions.

Weather data from [Open-Meteo](https://open-meteo.com/).
