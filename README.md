# ytsumify 🎥📝

**An automated, full-stack AI pipeline that converts YouTube URLs into structured Google Documents containing original transcripts and AI-generated summaries.**

**ytsumify** leverages the power of low-code workflow automation to orchestrate a seamless data pipeline. It bypasses paid APIs by extracting transcripts directly, processes the text using Google's Gemini LLM, automatically provisions and formats a Google Document, and streams the final summary back to any custom frontend via production webhooks.

---

## ⚡ Key Features

- **Zero-Cost Transcripts:** Utilizes advanced regex parsing and a free public endpoint to extract video transcripts without API rate limits or subscription costs.
- **Agentic AI Processing:** Deploys an n8n Tools Agent powered by **Google Gemini** that dynamically interprets instructions and executes external tools.
- **Automated Cloud Documentation:** Directly integrates with the Google Workspace ecosystem to generate, update, and format summaries inside Google Docs.
- **Headless & Frontend Ready:** Built on a live production Webhook architecture, allowing instant integration with React, Tailwind CSS, Lovable, or standard HTML/JS web applications.

---

## 🛠️ Tech Stack & Integrations

- **Orchestration:** n8n Workflow Automation
- **AI / LLM:** Google Gemini API (`gemini-1.5-pro` / `gemini-1.5-flash`)
- **Cloud Infrastructure:** Google Cloud APIs (Google Docs API via OAuth2)
- **Data Processing:** JavaScript, Regex (Regular Expressions), RESTful HTTP Requests

---

## 📐 Workflow Architecture

The pipeline executes the following sequence autonomously:

1. **`POST` Webhook Trigger:** Listens for a JSON payload containing the YouTube URL from the client frontend.
2. **Data Sanitization:** A regex function strips tracking parameters and isolates the exact 11-character Video ID.
3. **Transcript Retrieval:** An HTTP GET request fetches the raw text transcript.
4. **LLM Orchestration:** The transcript is passed to the Gemini AI Agent alongside a custom system prompt defining the output structure (Key themes, Action items, Notable data).
5. **Tool Execution:** The Agent utilizes Google Docs integration nodes to instantiate a new document and append the processed text.
6. **Client Response:** The workflow closes the loop by formatting the AI's output into a JSON response and sending it back to the requesting webhook.

---

## 🚀 Installation & Setup

### Prerequisites
- An active instance of **n8n** (Self-hosted or Cloud environment)
- **Google Cloud Console Project** with the Docs API enabled and OAuth2 credentials generated
- **Google Gemini API Key**

### Deployment Steps
1. Clone this repository or download the `ytsumify_workflow.json` file.
2. Open your n8n workspace, click **Add Workflow**, and select **Import from File** in the top-right menu.
3. Configure your credentials:
   - Connect your Gemini API key to the Language Model node.
   - Authenticate your Google Docs node using your Google OAuth2 credentials.
4. Toggle the workflow from *Inactive* to **Active**.
5. Double-click the initial Webhook node, select the **Production** URL, and copy it into your frontend application's `fetch()` request.

---

## 👨‍💻 About the Developer

Developed by **Sankalp M. Gaonkar** 
*Artificial Intelligence & Data Science*

Passionate about automating workflows, building intelligent data pipelines, and integrating cloud technologies to solve real-world problems.
