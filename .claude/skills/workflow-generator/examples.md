# Workflow Examples

Common workflow patterns to reference when generating new workflows.

## 1. Social Media Monitor → Notification

**Pattern:** Fetch social content → Filter/process → Send notification

```json
{
  "version": "1.0",
  "name": "Reddit Top Posts to Slack",
  "description": "Fetch top posts from r/singularity and send to Slack",
  "trigger": {
    "type": "cron",
    "config": {
      "schedule": "0 9 * * *",
      "timezone": "America/New_York"
    }
  },
  "config": {
    "steps": [
      {
        "id": "fetch",
        "module": "social.reddit.getSubredditPosts",
        "inputs": {
          "subreddit": "singularity",
          "sort": "top",
          "limit": 5
        },
        "outputAs": "posts"
      },
      {
        "id": "send",
        "module": "communication.slack.postMessage",
        "inputs": {
          "options": {
            "channel": "#tech-news",
            "text": "Top posts from r/singularity:\n{{posts}}"
          }
        }
      }
    ]
  },
  "metadata": {
    "requiresCredentials": ["reddit", "slack"]
  }
}
```

---

## 2. AI-Powered Chatbot

**Pattern:** User message → AI processing → Response

```json
{
  "version": "1.0",
  "name": "Math Tutor Bot",
  "description": "Answer math questions using OpenAI",
  "trigger": {
    "type": "chat",
    "config": {
      "inputVariable": "userMessage"
    }
  },
  "config": {
    "steps": [
      {
        "id": "chat",
        "module": "ai.ai-sdk.chat",
        "inputs": {
          "options": {
            "messages": [
              {
                "role": "system",
                "content": "You are a helpful math tutor. Explain concepts clearly with examples."
              },
              {
                "role": "user",
                "content": "{{trigger.userMessage}}"
              }
            ],
            "model": "gpt-4o-mini",
            "provider": "openai"
          }
        }
      }
    ]
  },
  "metadata": {
    "requiresCredentials": ["openai"]
  }
}
```

---

## 3. AI Content Generation with String Processing

**Pattern:** Generate AI text → Process/format → Use in downstream steps

**CRITICAL: AI SDK returns objects with `.content` property, not plain strings!**

```json
{
  "version": "1.0",
  "name": "AI Content Analyzer",
  "description": "Generate AI analysis and count words",
  "trigger": {
    "type": "manual"
  },
  "config": {
    "steps": [
      {
        "id": "generate",
        "module": "ai.ai-sdk.generateText",
        "inputs": {
          "options": {
            "prompt": "Write a 50-word summary about AI trends in 2025",
            "model": "gpt-4o-mini",
            "provider": "openai",
            "temperature": 0.7,
            "maxTokens": 200
          }
        },
        "outputAs": "aiSummary"
      },
      {
        "id": "countWords",
        "module": "utilities.string-utils.wordCount",
        "inputs": {
          "str": "{{aiSummary.content}}"
        },
        "outputAs": "wordCount"
      },
      {
        "id": "truncate",
        "module": "utilities.string-utils.truncate",
        "inputs": {
          "str": "{{aiSummary.content}}",
          "maxLength": 100,
          "suffix": "..."
        },
        "outputAs": "shortSummary"
      }
    ],
    "returnValue": "{{shortSummary}}",
    "outputDisplay": {
      "type": "text"
    }
  },
  "metadata": {
    "requiresCredentials": ["openai"]
  }
}
```

**Key points:**
- AI SDK modules ALWAYS use `"inputs": { "options": { ... } }`
- AI outputs ALWAYS use `.content` when passing to string functions
- Never pass AI object directly: `"{{aiOutput}}"` ❌
- Always extract content: `"{{aiOutput.content}}"` ✅

---

## 4. Table Generation with zipToObjects

**Pattern:** Generate data → Build table with multiple columns

**CRITICAL: ALL fields in zipToObjects must be arrays of equal length!**

```json
{
  "version": "1.0",
  "name": "Product Analysis Table",
  "description": "Generate table with AI analysis for multiple products",
  "trigger": {
    "type": "manual"
  },
  "config": {
    "steps": [
      {
        "id": "generateIds",
        "module": "utilities.array-utils.range",
        "inputs": {
          "start": 1,
          "end": 6,
          "step": 1
        },
        "outputAs": "productIds"
      },
      {
        "id": "aiAnalysis",
        "module": "ai.ai-sdk.generateText",
        "inputs": {
          "options": {
            "prompt": "Write a 1-sentence market analysis for tech products",
            "model": "gpt-4o-mini",
            "provider": "openai"
          }
        },
        "outputAs": "marketAnalysis"
      },
      {
        "id": "buildTable",
        "module": "utilities.array-utils.zipToObjects",
        "inputs": {
          "fieldArrays": {
            "id": [1, 2, 3, 4, 5],
            "name": ["Product A", "Product B", "Product C", "Product D", "Product E"],
            "category": ["Electronics", "Software", "Hardware", "Services", "Cloud"],
            "score": [95, 87, 92, 88, 91],
            "analysis": [
              "{{marketAnalysis.content}}",
              "{{marketAnalysis.content}}",
              "{{marketAnalysis.content}}",
              "{{marketAnalysis.content}}",
              "{{marketAnalysis.content}}"
            ]
          }
        },
        "outputAs": "productTable"
      }
    ],
    "returnValue": "{{productTable}}",
    "outputDisplay": {
      "type": "table",
      "columns": [
        { "key": "id", "label": "ID", "type": "number" },
        { "key": "name", "label": "Product", "type": "text" },
        { "key": "category", "label": "Category", "type": "text" },
        { "key": "score", "label": "Score", "type": "number" },
        { "key": "analysis", "label": "AI Analysis", "type": "text" }
      ]
    }
  },
  "metadata": {
    "requiresCredentials": ["openai"]
  }
}
```

**Key points:**
- zipToObjects requires ALL fields as arrays of same length
- Passing a string `"{{text}}"` creates array of characters ❌
- Repeat the value for each row: `["{{text}}", "{{text}}", ...]` ✅
- AI content needs `.content`: `["{{ai.content}}", "{{ai.content}}"]` ✅
- outputDisplay defines how table is rendered

---

## Key Principles

- **Variable syntax:** Use `{{outputAs}}` not `{{stepId.outputAs}}`
- **Trigger at top level:** Same level as `config`
- **All parameters:** Provide all parameters, even optional ones
- **Module paths:** Always lowercase (e.g., `social.twitter.postTweet`)
- **Authentication:** Use `*WithApiKey` for read operations when available
- **Credentials:** List all required credentials in `metadata.requiresCredentials`
- **AI SDK format:** Always wrap in `"options": { ... }`
- **AI SDK output:** Always use `.content` property for text
- **zipToObjects:** All fields must be arrays of equal length
- **returnValue:** ALWAYS specify what to return to avoid exposing internal variables
- **Output display:** Match type to final step return type
- **ALWAYS validate:** Run auto-fix → schema → output display → test → import

Use these examples as templates when generating new workflows!
