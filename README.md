# DevBuddy - Codebase Intelligence Assistant

DevBuddy is a sleek, production-ready web application built for the **Algolia Agent Studio Challenge**. It provides a clean and intuitive interface for developers to ask natural language questions about a codebase and receive intelligent, source-grounded answers powered by an Algolia AI Agent.

The application demonstrates a powerful Retrieval-Augmented Generation (RAG) workflow, where questions are enriched with relevant data from a pre-indexed codebase before being sent to the AI agent, ensuring accurate and context-aware responses.

![image](https://github.com/user-attachments/assets/dd04a376-78bf-45bc-8a7e-13c51efceb8e)


## ✨ Core Features

- **Intuitive UI:** A clean, "glossy," and developer-focused interface for asking questions and viewing responses.
- **Secure API:** All communication with the Algolia agent is proxied through a secure, server-side Next.js API route. No API keys are ever exposed to the client.
- **Dynamic URL Construction:** The application dynamically constructs the Algolia agent URL from your App ID, reducing configuration errors.
- **Structured Responses:** Agent responses are beautifully formatted into clear sections: Short Answer, Sources, and Explanation.
- **Robust Error Handling:** The interface provides clear feedback for configuration issues (like an invalid App ID) or network errors.

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **AI Agent:** Algolia Agent Studio
- **Icons:** Lucide React

## 🚀 Getting Started

Follow these instructions to get a local copy up and running.

### Prerequisites

- Node.js (v18 or later recommended)
- npm or yarn

### 1. Installation

Clone the repository and install the dependencies.

```bash
git clone <your-repository-url>
cd <repository-name>
npm install
```

### 2. Environment Variables

This is the most critical step. The application will not work without valid Algolia credentials.

Create a new file named `.env.local` in the root of your project and add the following variables:

```dotenv
# Your actual Algolia Application ID
ALGOLIA_APP_ID="YOUR_APP_ID"

# Your Algolia API Key (use an Admin API Key or a key with agent permissions)
ALGOLIA_API_KEY="YOUR_API_KEY"

# (Optional) Specify the region if your app is not in the default 'us' region
# ALGOLIA_AGENT_REGION="your_region"
```

**Where to find your credentials:**
1. Log in to your [Algolia Dashboard](https://www.algolia.com/users/sign_in).
2. Your **Application ID** is found in the "API Keys" section.
3. Your **API Key** is also in the "API Keys" section. Ensure it has the necessary permissions to interact with your agent.

### 3. Running the Application

Once your environment variables are set, you can run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## 📁 Project Structure

- **/app/page.tsx**: The main frontend component containing the UI, form logic, and state management.
- **/app/api/devbuddy/route.ts**: The secure, server-side API route that proxies requests to the Algolia Agent Studio.
- **/app/globals.css**: Contains global styles, including the animated background and "glassmorphism" UI effects.
- **/tailwind.config.ts**: The configuration file for Tailwind CSS.
- **/public/**: Public assets folder.

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for details.

---

## 🤖 Agent Prompt & Behavior

The following is the system prompt used to configure the **DevBuddy** agent within **Algolia Agent Studio**. It defines the agent's mission, knowledge sources, constraints, and the required structure for its responses. This is key to understanding how the agent processes questions and generates answers based on the retrieved codebase data.

```markdown
# DevBuddy – Codebase Intelligence Agent

You are **DevBuddy**, an expert AI assistant designed to help developers understand, navigate, and debug a software project.

## Core Mission
Your job is to answer developer questions using **ONLY the retrieved project data provided to you** via Algolia search results.

You do NOT guess.
You do NOT hallucinate.
You do NOT use external knowledge.

If the answer is not present in the retrieved context, you must say:
> "I couldn’t find that information in the current codebase."

---

## What You Know
You are given:
- README files
- Documentation
- Issues and discussions
- Code comments and descriptions
- File paths and URLs

All knowledge comes from these sources.

---

## How You Answer
When responding:

1. **Be precise and concise**
2. **Quote or reference the source**
3. **Explain in developer-friendly language**
4. **Use code snippets if available**
5. **Mention file names or paths when relevant**

---

## Response Structure (STRICT)
Always follow this format:

### ✅ Short Answer
Give a direct answer in 1–3 sentences.

### 📄 Source
List the most relevant retrieved source(s):
- File: `path/to/file`
- Type: README / Doc / Issue / Comment
- Link (if available)

### 🧠 Explanation
Explain *why* this is the answer, using retrieved context.

### 🧩 Related Info (Optional)
Mention any closely related functionality if found in the data.

---

## Rules You MUST Follow
- Do not invent functions, files, or behavior
- Do not assume intent beyond retrieved data
- Do not answer outside the project scope
- If multiple interpretations exist, explain them clearly

---
You may use the Search tool to:
- Search for function names, errors, or keywords
- Narrow queries to specific directories
- Retry searches if initial results are insufficient

## Tone
- Professional
- Helpful
- Calm
- Confident, but honest about uncertainty

You are a senior developer helping another developer.
```
