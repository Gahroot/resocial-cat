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
        "module": "social.reddit.getTopPosts",
        "inputs": {
          "subreddit": "singularity",
          "limit": 5,
          "timeframe": "day"
        },
        "outputAs": "posts"
      },
      {
        "id": "send",
        "module": "communication.slack.postMessage",
        "inputs": {
          "channel": "#tech-news",
          "text": "Top posts from r/singularity:\n{{posts}}"
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
    ]
  },
  "metadata": {
    "requiresCredentials": ["openai"]
  }
}
```

---

## 3. Data Collection → Storage

**Pattern:** Fetch API data → Transform → Save to database/sheet

```json
{
  "version": "1.0",
  "name": "GitHub Trending to Sheets",
  "description": "Save trending GitHub repos to Google Sheets daily",
  "trigger": {
    "type": "cron",
    "config": {
      "schedule": "0 10 * * *",
      "timezone": "UTC"
    }
  },
  "config": {
    "steps": [
      {
        "id": "fetch",
        "module": "social.github.getTrendingRepositories",
        "inputs": {
          "language": "javascript",
          "since": "daily"
        },
        "outputAs": "repos"
      },
      {
        "id": "save",
        "module": "data.googlesheets.addRow",
        "inputs": {
          "spreadsheetId": "YOUR_SHEET_ID",
          "range": "Sheet1!A:D",
          "values": "{{repos}}"
        }
      }
    ]
  },
  "metadata": {
    "requiresCredentials": ["github", "googlesheets"]
  }
}
```

---

## 4. Content Generation → Multi-Channel Publishing

**Pattern:** Generate content → Post to multiple platforms

```json
{
  "version": "1.0",
  "name": "Daily Motivation Post",
  "description": "Generate motivational quote and post to Twitter and LinkedIn",
  "trigger": {
    "type": "cron",
    "config": {
      "schedule": "0 8 * * *",
      "timezone": "America/Los_Angeles"
    }
  },
  "config": {
    "steps": [
      {
        "id": "generate",
        "module": "ai.openai.generateText",
        "inputs": {
          "prompt": "Generate a short, inspiring motivational quote (max 200 chars)",
          "model": "gpt-4o-mini",
          "maxTokens": 100
        },
        "outputAs": "quote"
      },
      {
        "id": "twitter",
        "module": "social.twitter.postTweet",
        "inputs": {
          "text": "{{quote}}"
        }
      },
      {
        "id": "linkedin",
        "module": "social.linkedin.postUpdate",
        "inputs": {
          "text": "{{quote}}"
        }
      }
    ]
  },
  "metadata": {
    "requiresCredentials": ["openai", "twitter", "linkedin"]
  }
}
```

---

## 5. Webhook Trigger → Processing

**Pattern:** Receive webhook → Process data → Take action

```json
{
  "version": "1.0",
  "name": "Customer Signup Handler",
  "description": "Send welcome email when customer signs up via webhook",
  "trigger": {
    "type": "webhook",
    "config": {
      "method": "POST",
      "path": "/webhook/customer-signup"
    }
  },
  "config": {
    "steps": [
      {
        "id": "send",
        "module": "communication.email.sendHtmlEmail",
        "inputs": {
          "from": "welcome@company.com",
          "to": "{{trigger.email}}",
          "subject": "Welcome to Our Platform!",
          "html": "<h1>Welcome {{trigger.name}}!</h1><p>Thanks for signing up.</p>"
        }
      },
      {
        "id": "slack",
        "module": "communication.slack.postMessage",
        "inputs": {
          "channel": "#signups",
          "text": "New signup: {{trigger.name}} ({{trigger.email}})"
        }
      }
    ]
  },
  "metadata": {
    "requiresCredentials": ["resend", "slack"]
  }
}
```

---

## 6. Multi-Step Data Processing

**Pattern:** Fetch → Filter → Transform → Output

```json
{
  "version": "1.0",
  "name": "YouTube Video Analysis",
  "description": "Search YouTube videos, analyze, and generate report",
  "trigger": {
    "type": "manual"
  },
  "config": {
    "steps": [
      {
        "id": "search",
        "module": "social.youtube.searchVideosWithApiKey",
        "inputs": {
          "query": "AI news 2025",
          "maxResults": 10,
          "apiKey": "{{credential.youtube_api_key}}"
        },
        "outputAs": "videos"
      },
      {
        "id": "filter",
        "module": "utilities.array-utils.filter",
        "inputs": {
          "array": "{{videos}}",
          "condition": "item.viewCount > 10000"
        },
        "outputAs": "popularVideos"
      },
      {
        "id": "analyze",
        "module": "ai.openai.generateText",
        "inputs": {
          "prompt": "Analyze these YouTube videos and identify key trends:\n{{popularVideos}}",
          "model": "gpt-4o-mini",
          "maxTokens": 500
        },
        "outputAs": "analysis"
      },
      {
        "id": "send",
        "module": "communication.email.sendHtmlEmail",
        "inputs": {
          "from": "reports@company.com",
          "to": "team@company.com",
          "subject": "YouTube AI News Analysis",
          "html": "<h2>Trends Report</h2><p>{{analysis.content}}</p>"
        }
      }
    ],
    "returnValue": "{{analysis.content}}",
    "outputDisplay": {
      "type": "markdown"
    }
  },
  "metadata": {
    "requiresCredentials": ["youtube_api_key", "openai", "resend"]
  }
}
```

---

## 7. Telegram Bot with Commands

**Pattern:** Telegram message → Process command → Respond

```json
{
  "version": "1.0",
  "name": "Telegram Info Bot",
  "description": "Respond to Telegram messages with useful info",
  "trigger": {
    "type": "telegram",
    "config": {
      "inputVariable": "message"
    }
  },
  "config": {
    "steps": [
      {
        "id": "respond",
        "module": "ai.ai-sdk.chat",
        "inputs": {
          "messages": [
            {
              "role": "system",
              "content": "You are a helpful assistant. Answer questions concisely."
            },
            {
              "role": "user",
              "content": "{{trigger.message}}"
            }
          ],
          "model": "gpt-4o-mini",
          "provider": "openai"
        },
        "outputAs": "response"
      },
      {
        "id": "send",
        "module": "communication.telegram.sendMessage",
        "inputs": {
          "chatId": "{{trigger.chatId}}",
          "text": "{{response}}",
          "parseMode": "Markdown"
        }
      }
    ]
  },
  "metadata": {
    "requiresCredentials": ["telegram_bot_token", "openai"]
  }
}
```

---

## 8. RSS Feed Monitor

**Pattern:** Fetch RSS → Filter new items → Notify

```json
{
  "version": "1.0",
  "name": "Tech News Monitor",
  "description": "Monitor TechCrunch RSS and send new articles to Discord",
  "trigger": {
    "type": "cron",
    "config": {
      "schedule": "0 */2 * * *",
      "timezone": "UTC"
    }
  },
  "config": {
    "steps": [
      {
        "id": "fetch",
        "module": "utilities.rss.parseFeed",
        "inputs": {
          "url": "https://techcrunch.com/feed/",
          "limit": 5
        },
        "outputAs": "articles"
      },
      {
        "id": "format",
        "module": "utilities.array-utils.map",
        "inputs": {
          "array": "{{articles}}",
          "transform": "item.title + ' - ' + item.link"
        },
        "outputAs": "formatted"
      },
      {
        "id": "send",
        "module": "communication.discord.sendEmbed",
        "inputs": {
          "channelId": "YOUR_CHANNEL_ID",
          "embed": {
            "title": "Latest Tech News",
            "description": "{{formatted}}",
            "color": 5814783,
            "timestamp": true
          }
        }
      }
    ]
  },
  "metadata": {
    "requiresCredentials": ["discord"]
  }
}
```

---

## 9. E-commerce Automation

**Pattern:** New order webhook → Process → Fulfill

```json
{
  "version": "1.0",
  "name": "Shopify Order Fulfillment",
  "description": "Process new Shopify orders automatically",
  "trigger": {
    "type": "webhook",
    "config": {
      "method": "POST",
      "path": "/webhook/shopify-order"
    }
  },
  "config": {
    "steps": [
      {
        "id": "notify",
        "module": "communication.slack.postMessage",
        "inputs": {
          "channel": "#orders",
          "text": "New order #{{trigger.orderId}} from {{trigger.customerName}}"
        }
      },
      {
        "id": "email",
        "module": "communication.email.sendHtmlEmail",
        "inputs": {
          "from": "orders@shop.com",
          "to": "{{trigger.customerEmail}}",
          "subject": "Order Confirmation #{{trigger.orderId}}",
          "html": "<h1>Thank you!</h1><p>Your order is being processed.</p>"
        }
      },
      {
        "id": "fulfill",
        "module": "business.shopify.fulfillOrder",
        "inputs": {
          "orderId": "{{trigger.orderId}}",
          "trackingNumber": "{{trigger.trackingNumber}}"
        }
      }
    ]
  },
  "metadata": {
    "requiresCredentials": ["slack", "resend", "shopify"]
  }
}
```

---

## 10. Lead Generation Pipeline

**Pattern:** Search leads → Enrich data → Save → Notify

```json
{
  "version": "1.0",
  "name": "Weekly Lead Generation",
  "description": "Find and enrich leads, save to Airtable",
  "trigger": {
    "type": "cron",
    "config": {
      "schedule": "0 9 * * 1",
      "timezone": "America/New_York"
    }
  },
  "config": {
    "steps": [
      {
        "id": "search",
        "module": "leadgen.apollo.searchPeople",
        "inputs": {
          "title": "CTO",
          "industry": "Technology",
          "companySize": "50-200",
          "limit": 10
        },
        "outputAs": "leads"
      },
      {
        "id": "enrich",
        "module": "leadgen.clearbit.enrichPerson",
        "inputs": {
          "emails": "{{leads}}"
        },
        "outputAs": "enrichedLeads"
      },
      {
        "id": "save",
        "module": "data.airtable.createRecord",
        "inputs": {
          "baseId": "YOUR_BASE_ID",
          "tableId": "Leads",
          "fields": "{{enrichedLeads}}"
        }
      },
      {
        "id": "notify",
        "module": "communication.slack.postMessage",
        "inputs": {
          "channel": "#sales",
          "text": "Added {{enrichedLeads.length}} new leads to Airtable!"
        }
      }
    ]
  },
  "metadata": {
    "requiresCredentials": ["apollo", "clearbit", "airtable", "slack"]
  }
}
```

---

## Common Patterns Summary

1. **Monitor → Notify** - Social/RSS → Slack/Discord/Email
2. **Chatbot** - Chat trigger → AI → Response
3. **Data Collection** - API → Transform → Storage
4. **Content Publishing** - Generate → Multi-platform post
5. **Webhook Handler** - Webhook → Process → Action
6. **Data Pipeline** - Fetch → Filter → Transform → Output
7. **Bot Interaction** - Telegram/Discord → AI → Reply
8. **Feed Monitor** - RSS → Filter → Notification
9. **E-commerce** - Order webhook → Fulfill → Notify
10. **Lead Gen** - Search → Enrich → Save → Alert

## 11. AI Content Generation with String Processing

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
    ]
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

## 12. Table Generation with zipToObjects

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

## Validation Workflow Example

After generating ANY workflow, follow this validation pipeline:

```bash
# Step 1: Auto-fix common issues
npx tsx scripts/auto-fix-workflow.ts workflow/my-workflow.json

# If fixes found, apply them
npx tsx scripts/auto-fix-workflow.ts workflow/my-workflow.json --write

# Step 2: Validate schema
npx tsx scripts/validate-workflow.ts workflow/my-workflow.json

# Step 3: Validate output display
npx tsx scripts/validate-output-display.ts workflow/my-workflow.json

# Step 4: Test execution
npx tsx scripts/test-workflow.ts workflow/my-workflow.json

# Step 5: Import
npx tsx scripts/import-workflow.ts workflow/my-workflow.json
```

**What each script catches:**

**Auto-fix** (catches & fixes automatically):
- ✅ AI SDK missing `options` wrapper
- ✅ AI SDK outputs missing `.content`
- ✅ zipToObjects string fields (converts to arrays)
- ✅ Array function parameter mismatches
- ✅ Variable name typos (spaces, case)
- ✅ Module path case sensitivity

**Schema validation** (manual fixes required):
- Module paths exist
- Variable references valid
- Required parameters present
- JSON structure correct

**Output display validation** (manual fixes required):
- Table/list displays → array returns
- Text/markdown displays → string returns
- Number displays → number returns
- AI SDK objects → `.content` for text
- Table displays → columns configured

**Execution test** (catches runtime errors):
- Parameter type mismatches
- Credential issues
- Logic errors

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
- **Output display:** Match type to final step return type
- **ALWAYS validate:** Run auto-fix → schema → output display → test → import

Use these examples as templates when generating new workflows!
