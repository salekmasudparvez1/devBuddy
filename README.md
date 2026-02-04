# DevBuddy - ChatGPT-Style AI Codebase Assistant

A modern, production-ready chat application for the **Algolia Agent Studio Challenge**. Powered by Next.js 16, React 19, Tailwind CSS 4, and integrated with Algolia Agent Studio for AI-powered codebase analysis.

## ✨ Features

### UI/UX
- **ChatGPT-Style Layout** - Full-screen chat with sticky header and fixed input
- **Message Bubbles** - User (right-aligned, blue) and AI (left-aligned, dark)
- **Streaming Responses** - Real-time typing effect as responses arrive
- **Code Syntax Highlighting** - 100+ languages via highlight.js with copy button
- **Mobile Responsive** - Optimized for mobile, tablet, and desktop
- **Dark Mode** - Native light/dark theme support
- **Smooth Animations** - Framer Motion throughout
- **Keyboard Shortcuts** - Ctrl/Cmd+Enter to send, Shift+Enter for newline

### Algolia Integration
- **Edge Function Proxy** - Fast API route with global deployment
- **Streaming SSE** - Real-time chunked responses
- **Multi-part Messages** - Text, code, and references
- **Error Handling** - Automatic fallbacks and user-friendly errors
- **Authentication** - Secure header-based credentials

### Developer Experience
- **Full TypeScript** - Strict type checking
- **Well-Documented** - Inline comments and comprehensive guides
- **Tailwind Only** - No component libraries, pure utilities
- **Modular Components** - Reusable, tested building blocks
- **Easy Deployment** - One-click deploy to Vercel

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd devChallange
npm install
```

### 2. Configure Algolia

Create `.env.local`:

```env
ALGOLIA_AGENT_URL=https://agent.algolia.com/v1/instances/{YOUR_INSTANCE_ID}/responses
ALGOLIA_API_KEY=your_api_key_here
ALGOLIA_APP_ID=your_app_id_here
```

📖 **See [ALGOLIA_SETUP.md](./ALGOLIA_SETUP.md)** for detailed instructions.

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Deploy (Optional)

```bash
npm i -g vercel
vercel
```

📖 **See [DEPLOYMENT.md](./DEPLOYMENT.md)** for full deployment guide.

---

## 📁 Project Structure

```
app/
├── page.tsx                          # Main chat page (ChatGPT layout)
├── layout.tsx                        # Root layout + highlight.js CDN
├── globals.css                       # Global styles + animations
│
├── api/
│   └── devbuddy/
│       └── route.ts                  # Backend proxy to Algolia Agent Studio
│
├── components/
│   ├── ChatInput.tsx                 # Multi-line input textarea (bottom)
│   ├── UserMessage.tsx               # Right-aligned user messages
│   ├── AIMessage.tsx                 # Left-aligned AI responses
│   ├── WelcomeScreen.tsx             # Initial empty state
│   ├── Answer.tsx                    # Legacy (optional)
│   ├── GlassCard.tsx                 # Reusable card
│   └── InstantSearchWidget.tsx       # Optional search
│
├── hooks/
│   └── useChat.tsx                   # State management + SSE parser
│
├── types/
│   └── agent.ts                      # TypeScript interfaces
│
└── utils/
    ├── highlightCode.ts              # Syntax highlighting
    ├── parseStreaming.ts             # Stream parsing
    └── cn.ts                         # Tailwind merge
```

---

## 🎨 Component Overview

### `page.tsx` - Main Chat Page

**Layout**: Header (fixed) → Messages (scrollable) → Input (fixed)

```tsx
// Auto-scroll to latest message
useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [messages, isLoading]);

// Render messages
{messages.map((m) => 
  m.role === 'user' ? <UserMessage /> : <AIMessage />
)}
```

### `ChatInput.tsx` - Input Component

**Features**:
- Auto-expand textarea as user types
- Keyboard: Ctrl+Enter to send, Shift+Enter for newline
- Loading state disables input during streaming
- Visual feedback with spinner

```tsx
<textarea
  onKeyDown={(e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSend();
    }
  }}
/>
```

### `UserMessage.tsx` - User Bubbles

**Styling**:
- Right-aligned with blue gradient background
- Supports text and code parts
- Slide-in animation on arrival

### `AIMessage.tsx` - AI Responses

**Features**:
- Left-aligned with dark background
- Text with line-break support
- Code blocks with syntax highlighting
- Copy button for snippets
- Typing cursor when streaming

```tsx
<CodeBlock code={code} language="typescript" />
// ↓
<pre>const x = 42;</pre>  // syntax-highlighted
```

### `useChat.tsx` - State & Streaming

**Manages**:
- Message history (user + AI)
- Streaming parser for SSE events
- Auto-ID generation and timestamps

**Streaming Parser**:
```tsx
// Handles: text-delta, text-start/end, JSON fallback
if (parsed.type === 'text-delta' && parsed.delta) {
  // Append text chunk to last message
  setMessages((cur) =>
    cur.map((m) =>
      m.id === lastId
        ? { ...m, parts: [...m.parts.slice(0, -1), 
            { ...m.parts[-1], text: m.parts[-1].text + parsed.delta }] }
        : m
    )
  );
}
```

### `route.ts` - Backend API

**Endpoint**: `POST /api/devbuddy`

**Request**:
```json
{
  "messages": [
    { "role": "user", "parts": [{ "type": "text", "text": "How to...?" }] }
  ]
}
```

**Response**: SSE stream
```
data: {"type":"text-delta","delta":"Here"}
data: {"type":"text-delta","delta":" is..."}
data: [DONE]
```

**Logic**:
1. Receive messages from frontend
2. Forward to Algolia Agent Studio REST API
3. If streaming → pipe directly to client
4. If JSON → convert to SSE format
5. Return with `Content-Type: text/event-stream`

---

## 🔧 Configuration

### Algolia Credentials

Get from [console.algolia.com](https://console.algolia.com):

```env
# Agent Studio Instance URL
ALGOLIA_AGENT_URL=https://agent.algolia.com/v1/instances/{INSTANCE_ID}/responses

# API Key (with Agent Studio permissions)
ALGOLIA_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Your Algolia App ID
ALGOLIA_APP_ID=XXXXXX
```

### Tailwind v4 Configuration

Classes use new v4 syntax:
- `bg-linear-to-r` (was `bg-gradient-to-r`)
- `shrink-0` (was `flex-shrink-0`)
- `wrap-break-word` (was `break-words`)

---

## 🌙 Dark Mode

Automatically respects system preference:

```css
@media (prefers-color-scheme: dark) {
  body {
    background-color: #0f172a;
    color: #ffffff;
  }
}
```

Tailwind classes work automatically:
```tsx
<div className="dark:bg-slate-800">Content</div>
```

---

## 📱 Responsive Design

Message bubbles resize based on screen:

| Screen | Max Width |
|--------|-----------|
| Mobile | `max-w-xs` (20rem) |
| Tablet | `max-w-md` (28rem) |
| Desktop | `max-w-2xl` (42rem) |

Input always takes full width with padding.

---

## 💻 Syntax Highlighting

Uses **highlight.js** from CDN:

```html
<!-- app/layout.tsx -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css" />
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
```

**100+ languages supported**: JavaScript, TypeScript, Python, Java, SQL, HTML, CSS, Bash, Go, Rust, C++, PHP, and more.

**Usage**:
```tsx
import { highlightCode } from '@/utils/highlightCode';

const html = highlightCode('const x = 42;', 'javascript');
// Returns HTML with <span> tags for syntax coloring
```

---

## 🎬 Animations

**Framer Motion**:
```tsx
<motion.div
  initial={{ opacity: 0, x: 20 }}        // Start state
  animate={{ opacity: 1, x: 0 }}         // End state
  transition={{ duration: 0.3 }}         // Duration
>
  Content
</motion.div>
```

**CSS Animations** (in globals.css):
```css
@keyframes fadeIn { ... }
@keyframes slideInFromRight { ... }
.animate-fade-in { animation: fadeIn 0.3s ease-out; }
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Enter` / `Cmd+Enter` | Send message |
| `Shift+Enter` | New line in input |
| `Tab` | Focus next element |
| `Esc` | (Future: close modals) |

---

## 🔍 Data Flow

```
User Input
    ↓
ChatInput captures text
    ↓
Click Send → onSend(message)
    ↓
useChat.sendMessage()
    ↓
POST /api/devbuddy
    ↓
Edge Function receives
    ↓
Authenticate & forward to Algolia
    ↓
Algolia Agent Studio LLM
    ↓
Stream SSE chunks back
    ↓
Frontend parser (useChat)
    ↓
AppendMessage to UI
    ↓
Message appears with typing effect
    ↓
Copy/syntax highlight available
```

---

## 🧪 Testing

### Manual Testing

```bash
# 1. Start dev server
npm run dev

# 2. Send message
# Input: "Show me a React hook"
# Expected: Streaming response with code block

# 3. Copy code
# Click copy button
# Paste somewhere to verify
```

### Automated Testing (Future)

```bash
npm run test
```

---

## 🚀 Deployment

### Vercel (Recommended)

```bash
# 1. Push to GitHub
git push origin main

# 2. Deploy to Vercel
vercel

# 3. Add environment variables in Vercel dashboard
# ALGOLIA_AGENT_URL, ALGOLIA_API_KEY, ALGOLIA_APP_ID
```

**Result**: Live at `https://devbuddygo.netlify.app`

### Railway/Render/Other

See [DEPLOYMENT.md](./DEPLOYMENT.md) for Docker, Railway, Render instructions.

---

## 📊 Performance

- **Edge Runtime** - Vercel Edge Functions for global low-latency
- **Streaming** - Reduces time-to-first-byte (TTFB)
- **Code Splitting** - Automatic with Next.js
- **CSS Optimization** - Tailwind purges unused styles
- **Image Optimization** - Ready for future image features

---

## 🔐 Security

✅ Environment variables stored securely
✅ API keys never exposed to frontend
✅ HTML escaped in code blocks (XSS protection)
✅ Strict input validation
✅ HTTPS only in production

❌ Avoid hardcoding secrets in code
❌ Never commit `.env.local` to Git

---

## 🐛 Troubleshooting

### "Cannot find module" error

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Restart dev server
npm run dev
```

### Network error / 401 Unauthorized

- Check `.env.local` has correct Algolia credentials
- Verify API key has Agent Studio permissions
- Test with curl first

```bash
curl -X POST $ALGOLIA_AGENT_URL \
  -H "X-Algolia-API-Key: $ALGOLIA_API_KEY" \
  -H "X-Algolia-Application-Id: $ALGOLIA_APP_ID" \
  -H "Content-Type: application/json" \
  -d '{"messages":[]}'
```

### Syntax highlighting not working

- Check browser console for errors
- Hard refresh: `Ctrl+Shift+R`
- Verify CDN link in `app/layout.tsx`

### Messages not streaming

- Check Network tab: `/api/devbuddy` response should be `text/event-stream`
- Look for `data: {...}` events in response
- Check frontend console for parsing errors

---

## 📚 Resources

- **Next.js 16**: https://nextjs.org/docs
- **React 19**: https://react.dev
- **Tailwind CSS 4**: https://tailwindcss.com
- **Framer Motion**: https://framer.com/motion
- **highlight.js**: https://highlightjs.org
- **Algolia Agent Studio**: https://www.algolia.com/doc/

---

## 📖 Additional Guides

- **[IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)** - Technical architecture & component docs
- **[ALGOLIA_SETUP.md](./ALGOLIA_SETUP.md)** - Algolia credentials & configuration
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deploy to production & submission guide

---

## 📄 License

MIT - Use freely for personal and commercial projects.

---

## 🤝 Support

- Check the guides above
- Review inline comments in code
- Check browser DevTools for errors
- Test API with curl before debugging frontend

---

**Built for the Algolia Agent Studio Challenge 🏆**

**Live Demo**: https://devbuddygo.netlify.app/
**GitHub**: https://github.com/salekmasudparvez1/devBuddy

### 1) Install
```bash
git clone <repo-url>
cd <repo>
npm install
```

### 2) Environment
Create `.env.local` in the project root and provide these variables:

```dotenv
# Agent Studio endpoint (Agent response endpoint)
ALGOLIA_AGENT_URL="https://agent.algolia.com/v1/instances/<your-instance-id>/responses"

# Agent/Admin key (server only)
ALGOLIA_API_KEY="YOUR_AGENT_KEY"
ALGOLIA_APP_ID="YOUR_APP_ID"

# Optional (for InstantSearch widget): set these for client-side search
NEXT_PUBLIC_ALGOLIA_APP_ID="YOUR_APP_ID"
NEXT_PUBLIC_ALGOLIA_SEARCH_KEY="YOUR_SEARCH_ONLY_KEY"
NEXT_PUBLIC_ALGOLIA_INDEX="your_index_name"
```

Important: Keep `ALGOLIA_API_KEY` and `ALGOLIA_APP_ID` private (server-side). Use search-only keys for client-side InstantSearch.

### 3) Run locally
```bash
npm run dev
```
Open http://localhost:3000

---

## How streaming works ✨

- The frontend sends conversation history to `/api/devbuddy`.
- The Edge route proxies the request to your Algolia Agent Studio endpoint, requesting a streaming response.
- The backend forwards the stream (SSE/chunked) directly to the browser.
- The client reads the stream in real-time and appends incremental deltas to the assistant message (supports multi-part messages and code blocks).

This reduces latency and provides instant partial answers while the agent finishes.

---

## Files of interest 🔧

- `app/api/devbuddy/route.ts` — Backend Edge route; proxies to Algolia Agent Studio and forwards streaming chunks (Algolia-specific logic). (Backend)
- `app/hooks/useChat.tsx` — Client hook that manages messages, streaming parsing, multi-part support, and UI state. (Frontend)
- `app/page.tsx` — Main UI and composition (glass input, sticky header, auto-scroll, message layout). (Frontend UI)
- `app/components/Answer.tsx` — Renders agent responses and sources (multi-part handling). (Frontend UI)
- `app/components/InstantSearchWidget.tsx` — Optional consumer-facing InstantSearch widget (dynamic import, optional). (Frontend optional)

---

## Notes for judges & testers 🧪

- Streaming: type a question and watch the assistant produce partial answers in real-time. The progress bar indicates active streaming.
- History: use the Clear button to reset conversation history quickly.
- Mobile: UI is responsive and optimized for phones and tablets.

Test credentials: This repo does not ship with any Algolia credentials. Provide your own Agent Studio endpoint and API keys in `.env.local`. For a quick demo, use a test Agent Studio instance with a streaming-enabled endpoint and a search-only key for the InstantSearch widget.

---

## Optional: InstantSearch Chat Widget

If you provide `NEXT_PUBLIC_ALGOLIA_APP_ID`, `NEXT_PUBLIC_ALGOLIA_SEARCH_KEY`, and `NEXT_PUBLIC_ALGOLIA_INDEX` the InstantSearch widget will display. It is implemented with dynamic imports to avoid bundling when unused. Install `react-instantsearch-hooks-web` (already listed in package.json) for full client search.

---

## Deployment

This project is optimized for deployment on platforms that support Next.js Edge runtime (Vercel, Netlify Edge). Ensure env variables are set in the deployment environment.

---

## Contributing

Contributions and improvements are welcome. Please ensure types and comments are kept clear for reviewers.

---

## License

MIT

