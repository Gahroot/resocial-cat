---
name: workflow-generator
description: "YOU MUST USE THIS SKILL when the user wants to create, build, or generate a workflow automation. Activate for requests like: 'create a workflow', 'build a workflow', 'generate a workflow', 'make a workflow', 'I want to automate', 'automate X to Y', 'schedule a task', 'monitor X and send to Y'. This skill searches for relevant modules, builds JSON config, validates, tests, and imports workflows to database. DO NOT use generic file reading/writing - use this skill instead for workflow generation tasks."
---

# Workflow Generator Skill

You are the **Workflow Generator**. Your job is to quickly generate workflow automations based on natural language requests from the user.

## When to Use This Skill

Activate this skill when the user expresses intent to create, build, or automate something, such as:
- "Create a workflow that..."
- "I want to automate..."
- "Monitor X and send to Y"
- "Schedule a task that..."
- "Build me an automation for..."
- "Set up a workflow to..."

## Pre-flight Check

**BEFORE starting workflow generation, verify that required services are running:**

```bash
# Check Docker containers
docker ps --filter "name=social-cat" --format "table {{.Names}}\t{{.Status}}"

# Check if Next.js dev server is running
curl -s http://localhost:3000/api/health || echo "Dev server not running"
```

**Required services:**
- ✅ `social-cat-postgres` - Must be "Up" and "healthy"
- ✅ `social-cat-redis` - Must be "Up" and "healthy"
- ✅ Next.js dev server - Must respond on `http://localhost:3000`

**If any service is not running:**

1. **Docker containers not running:**
   ```bash
   npm run docker:start
   ```

2. **Dev server not running:**
   ```bash
   npm run dev:full
   ```
   Wait for "Ready" or "Local: http://localhost:3000"

3. **Re-check services** after starting them

**Only proceed once all services are confirmed running.**

---

## Core Process

Follow these steps to generate a workflow:

### 1. Understand the Request

Parse the user's natural language request to identify:
- **What action/data** they want (e.g., "GitHub trending repos", "Reddit posts", "weather data")
- **What to do with it** (e.g., "send to Slack", "save to database", "generate summary")
- **When to run** (e.g., "daily at 9am", "every hour", "when triggered", "manually")

### 2. Check Examples First

**Before building from scratch, check if a similar workflow exists in `examples.md`:**

Common patterns:
- Chat workflows → Example #2 (AI-Powered Chatbot)
- Social monitor → Example #1 (Reddit to Slack)
- Data pipeline → Example #6 (Multi-Step Processing)
- Webhook handler → Example #5 (Customer Signup)
- E-commerce → Example #9 (Shopify Orders)

Use these as templates to speed up generation.

### 3. Search for Relevant Modules

Based on the request, search for relevant modules using:

```bash
npx tsx scripts/search-modules.ts "keyword"
```

**Examples:**
- Mention "GitHub" → search `"github"`
- Mention "Reddit" → search `"reddit"`
- Mention "OpenAI" → search `"openai"`
- Mention "Slack" → search `"slack"`
- Mention "email" → search `"email"`

**IMPORTANT: Pay attention to the function signature in search results!**

The search output shows:
- Function name
- Description
- **Signature** (this tells you parameter format!)
- Warning if it uses params wrapper
- Example usage

**IMPORTANT: Module Authentication Selection**

When you find multiple versions of a module (e.g., `searchVideos` vs `searchVideosWithApiKey`), choose based on operation type:

**Prefer API Key version (`*WithApiKey`) for:**
- Read-only operations: search, get, fetch, list, view
- Public data access
- Examples: `searchVideos`, `getVideoDetails`, `getTrendingRepositories`
- Implementation: Add `apiKey: "{{credential.SERVICE_api_key}}"` parameter

**Use OAuth version (without `WithApiKey`) for:**
- Write operations: post, upload, create, update, delete
- Private/authenticated data access
- Examples: `postTweet`, `uploadVideo`, `sendMessage`
- Implementation: Credentials auto-injected, just use the function

This ensures users only need OAuth when absolutely necessary.

### 4. Understand Parameter Format

**CRITICAL: The executor has specific rules for how to pass parameters to functions.**

When you search for a module, look at its **function signature** to determine the correct format:

#### Format Decision Tree

**1. Object Destructuring in Parameters**
```typescript
// Signature: chat({ messages, model, provider })
```
→ Pass parameters directly as object properties:
```json
"inputs": {
  "messages": [...],
  "model": "gpt-4o-mini",
  "provider": "openai"
}
```

**2. Named Parameter with Type**
```typescript
// Signature: processData(options: DataOptions)
```
→ Wrap in parameter name:
```json
"inputs": {
  "options": {
    "data": [...],
    "format": "json"
  }
}
```

**3. Multiple Separate Parameters**
```typescript
// Signature: send(channel: string, text: string, urgent: boolean)
```
→ Use parameter names as keys:
```json
"inputs": {
  "channel": "#general",
  "text": "Hello",
  "urgent": false
}
```

**4. Params Wrapper Pattern**
```typescript
// Signature: transform(params: { items, count })
```
→ Wrap in "params":
```json
"inputs": {
  "params": {
    "items": [...],
    "count": 5
  }
}
```

**How to tell which format to use:**
- Look at the search results signature
- Object destructuring `{ param1, param2 }` → direct properties
- Named parameter `(options: Type)` → wrap with parameter name
- Params keyword `(params: { ... })` → wrap with "params"

**CRITICAL: AI SDK Module Parameter Format**

All AI SDK modules (`ai.ai-sdk.*`) use named parameter format:

```json
// ✅ ALWAYS use this format for AI SDK:
{
  "module": "ai.ai-sdk.generateText",
  "inputs": {
    "options": {
      "prompt": "Your prompt here",
      "model": "gpt-4o-mini",
      "provider": "openai",
      "temperature": 0.7,
      "maxTokens": 500
    }
  }
}
```

**Common AI SDK modules requiring `options` wrapper:**
- `ai.ai-sdk.generateText`
- `ai.ai-sdk.chat`
- `ai.ai-sdk.streamText`

**If you see parameter mismatch error for ANY `ai.ai-sdk.*` module, you forgot the `options` wrapper.**

### 4.5. Understanding Module Return Values

**CRITICAL: Different modules return different data structures. You MUST know what they return to reference them correctly.**

#### AI SDK Return Format

All AI SDK modules return an **object**, not a plain string:

```typescript
{
  content: string,        // The actual generated text
  usage: {
    promptTokens: number,
    completionTokens: number,
    totalTokens: number
  },
  finishReason: string,
  model: string,
  provider: string
}
```

**When referencing AI SDK outputs, access `.content`:**

```json
// Step 1: Generate text
{
  "id": "step1",
  "module": "ai.ai-sdk.generateText",
  "inputs": {
    "options": {
      "prompt": "Write a summary",
      "model": "gpt-4o-mini",
      "provider": "openai"
    }
  },
  "outputAs": "aiSummary"
}

// Step 2: Use the generated text
{
  "id": "step2",
  "module": "utilities.string-utils.wordCount",
  "inputs": {
    "str": "{{aiSummary.content}}"  // ✅ Access .content property
    // NOT: "{{aiSummary}}"          // ❌ This passes the whole object
  }
}
```

**Common mistakes:**
- ❌ `"str": "{{aiOutput}}"` → Passes object, causes "str.split is not a function"
- ✅ `"str": "{{aiOutput.content}}"` → Passes string correctly

#### Array Utilities Return Format

Array utilities return arrays or primitives:

- `range()` → `[1, 2, 3, 4, 5]`
- `sum()` → `15` (number)
- `pluck()` → `["value1", "value2"]` (array of values)
- `zipToObjects()` → `[{ id: 1, name: "A" }, { id: 2, name: "B" }]` (array of objects)

#### String Utilities Return Format

String utilities return strings or numbers:

- `concat()` → `"combined string"`
- `wordCount()` → `42` (number)
- `truncate()` → `"truncated text..."`

#### Special Case: zipToObjects

`zipToObjects` requires **all fields to be arrays of equal length**:

```json
// ❌ WRONG - String values get treated as character arrays
{
  "fieldArrays": {
    "id": [1, 2, 3],
    "title": ["Post 1", "Post 2", "Post 3"],
    "summary": "{{aiSummary.content}}"  // This creates 100+ objects!
  }
}

// ✅ CORRECT - Repeat the value for each row
{
  "fieldArrays": {
    "id": [1, 2, 3],
    "title": ["Post 1", "Post 2", "Post 3"],
    "summary": ["{{aiSummary.content}}", "{{aiSummary.content}}", "{{aiSummary.content}}"]
  }
}
```

### 5. Determine Trigger Type

Based on the user's request, select the appropriate trigger:

- **manual** - "Run on demand", "click to run", no schedule mentioned
- **chat** - "Answer questions", "chatbot", "respond to messages"
- **cron** - "Daily", "every hour", "weekly", "at 9am", scheduled
- **webhook** - "API endpoint", "when called via HTTP", "external trigger"
- **telegram** - "Telegram bot", "when someone messages on Telegram"
- **discord** - "Discord bot", "when someone messages on Discord"
- **chat-input** - "Form with fields", "collect input", "custom fields"

For cron schedules, common patterns:
- `0 9 * * *` - Daily at 9 AM
- `0 */6 * * *` - Every 6 hours
- `0 0 * * 1` - Every Monday at midnight
- `*/15 * * * *` - Every 15 minutes

### 6. Build the Workflow JSON

Construct the workflow JSON with:

```json
{
  "version": "1.0",
  "name": "Descriptive Workflow Name",
  "description": "What this workflow does",
  "trigger": {
    "type": "manual|chat|cron|webhook|telegram|discord|chat-input",
    "config": {
      // Trigger-specific config
    }
  },
  "config": {
    "steps": [
      {
        "id": "step1",
        "module": "category.module.function",
        "inputs": {
          // Function parameters
        },
        "outputAs": "variableName"
      }
    ]
  },
  "metadata": {
    "requiresCredentials": ["service1", "service2"]
  }
}
```

**Critical Rules:**

1. **Module paths must be lowercase:** `social.twitter.postTweet` (NOT `Social.Twitter.PostTweet`)
2. **Variable syntax:**
   - Trigger inputs: `{{trigger.inputVariable}}`
   - Step outputs: `{{outputAs}}` (just the outputAs name, NO step ID!)
   - Example: If step has `"outputAs": "tweets"`, reference it as `{{tweets}}`
3. **Provide ALL parameters:** Even optional ones (executor checks parameter count strictly)
4. **Chat workflows:** Always use `ai.ai-sdk.chat` with messages array
5. **Trigger goes at TOP LEVEL:** Same level as `config`, NOT inside it

**Example Variable Usage:**
```json
{
  "steps": [
    {
      "id": "fetch",
      "module": "social.reddit.getTopPosts",
      "inputs": { "subreddit": "singularity", "limit": 10 },
      "outputAs": "posts"
    },
    {
      "id": "summarize",
      "module": "ai.openai.generateText",
      "inputs": {
        "prompt": "Summarize these posts: {{posts}}",
        "model": "gpt-4o-mini"
      },
      "outputAs": "summary"
    },
    {
      "id": "send",
      "module": "communication.slack.postMessage",
      "inputs": {
        "channel": "#general",
        "text": "{{summary}}"
      }
    }
  ]
}
```

### 7. Save the Workflow File

Generate a filename based on the workflow name (lowercase, hyphenated):
- "GitHub Trending Digest" → `github-trending-digest.json`
- "Reddit Monitor" → `reddit-monitor.json`

**CRITICAL: Save to `workflow/{filename}` relative to the current working directory.**

**DO NOT save to temp directories** (`/tmp/`, `/var/tmp/`, etc.) as this will cause:
- Import failures
- Validation errors
- Diff comparison failures
- Script execution issues

**Correct path format:**
```
workflow/github-trending-digest.json
```

**NOT:**
```
/tmp/workflow/github-trending-digest.json  ❌
~/workflow/github-trending-digest.json     ❌
```

The `workflow/` directory should be relative to the project root (current working directory).

Save using the Write tool with the relative path.

### 7.5. Auto-Fix Common Issues

**CRITICAL: After generating the workflow JSON, ALWAYS run the auto-fix script:**

```bash
npx tsx scripts/auto-fix-workflow.ts workflow/{filename}
```

This automatically detects and fixes:
- ✅ AI SDK missing `options` wrapper
- ✅ AI SDK outputs missing `.content`
- ✅ zipToObjects string fields (converts to arrays)
- ✅ Array function parameter mismatches
- ✅ Variable name typos (spaces, case)
- ✅ Module path case sensitivity (category/namespace lowercase, function camelCase preserved)
- ✅ Common function name case errors (e.g., `generatetext` → `generateText`)

**If fixes are found, apply them:**
```bash
npx tsx scripts/auto-fix-workflow.ts workflow/{filename} --write
```

The script will show you exactly what it fixed with before/after examples.

### 7.6. Pre-Submission Checklist (Manual Verification)

**After auto-fix, verify these edge cases manually:**

✅ **AI SDK modules have `options` wrapper:**
```json
"inputs": {
  "options": {  // ✅ Must have this for ai.ai-sdk.*
    "prompt": "...",
    "model": "gpt-4o-mini"
  }
}
```

✅ **AI SDK outputs use `.content` when passed to string functions:**
```json
// If step outputs AI text as "summary":
"str": "{{summary.content}}"  // ✅ Correct
// NOT: "{{summary}}"           // ❌ Passes object
```

✅ **Variable names have NO SPACES:**
```json
"outputAs": "shuffledNumbers"   // ✅ Correct
// NOT: "shuffled Numbers"       // ❌ Typo breaks references
```

✅ **Variable references match outputAs exactly:**
```json
// Step 1:
"outputAs": "redditPosts"
// Step 2:
"array": "{{redditPosts}}"      // ✅ Exact match
// NOT: "{{reddit_posts}}"       // ❌ Case/naming mismatch
```

✅ **zipToObjects fields are all arrays of equal length:**
```json
"fieldArrays": {
  "id": [1, 2, 3],
  "name": ["A", "B", "C"],
  "score": [10, 20, 30],
  "summary": ["{{text}}", "{{text}}", "{{text}}"]  // ✅ Array
  // NOT: "summary": "{{text}}"                    // ❌ String
}
```

✅ **Array function parameters match signature:**
- `intersection` → `{ "arrays": [...] }`
- `difference` → `{ "arr1": "...", "arr2": "..." }`
- `union` → `{ "arr1": "...", "arr2": "..." }`

✅ **Module paths are lowercase:**
```json
"module": "social.twitter.postTweet"  // ✅
// NOT: "Social.Twitter.PostTweet"    // ❌
```

**If you catch any of these issues, fix them BEFORE saving.**

### 8. Auto-Fix and Validate the Workflow

**Step 8a: Run Auto-Fix (REQUIRED)**

```bash
npx tsx scripts/auto-fix-workflow.ts workflow/{filename}
```

If fixes are found, review them and apply:
```bash
npx tsx scripts/auto-fix-workflow.ts workflow/{filename} --write
```

**Step 8b: Validate Schema**

```bash
npx tsx scripts/validate-workflow.ts workflow/{filename}
```

If validation fails, fix the issues and re-validate.

**Step 8c: Validate Output Display (REQUIRED)**

```bash
npx tsx scripts/validate-output-display.ts workflow/{filename}
```

This validates that your `outputDisplay` configuration matches the final step's return type:
- ✅ Table/list displays require array returns
- ✅ Text/markdown displays require string returns
- ✅ Number displays require number returns
- ✅ AI SDK object returns need `.content` for text display
- ✅ Table displays must have `columns` configuration

**Common fixes:**
- **Object → Table**: Add `zipToObjects` step or use `"type": "json"`
- **Object → Text**: Use `returnValue: "{{var.content}}"` for AI SDK outputs
- **Missing columns**: Add `columns` array to outputDisplay

**Why this order?**
Auto-fix → Schema Validate → Output Display Validate ensures all systematic issues are caught before testing.

### 9. Test the Workflow

**Testing helps catch errors early. However, test script limitations mean not all workflows can be fully tested.**

**For non-chat workflows:**
```bash
npx tsx scripts/test-workflow.ts workflow/{filename}
```

Or use dry-run for complex workflows:
```bash
npx tsx scripts/test-workflow.ts workflow/{filename} --dry-run
```

**You must see "✅ Workflow executed successfully!" before importing.**

**For chat workflows (trigger.type = "chat"):**

Testing often fails due to test script limitations with trigger variable injection and AI SDK message formatting. If you see:
- ✅ Validation passed
- ❌ Test failed with "Invalid prompt" or "ModelMessage[]" errors

**You can proceed to import.** The workflow will work correctly in production with proper credentials.

**IMPORTANT: For complex test workflows (20+ steps with multiple integrations):**

Prefer **deterministic data generation** over external APIs to avoid test flakiness:

✅ **Use these for testing:**
- `utilities.array-utils.range` - Generate number sequences
- `utilities.array-utils.fill` - Create arrays with repeated values
- `utilities.array-utils.zipToObjects` - Build structured data
- Hard-coded arrays and values

❌ **Avoid these in complex tests:**
- `social.reddit.*` - API structure can vary
- `social.hackernews.*` - External API dependencies
- `communication.rss.*` - Feed availability issues
- Any external API that might be rate-limited or down

**Why:** External APIs can fail or return unexpected structures, making it hard to debug whether the issue is your workflow logic or the API. Use deterministic data for testing, then swap in real APIs after confirming the workflow structure works.

**Common test failures and fixes:**

| Error | Cause | Fix |
|-------|-------|-----|
| Wrong variable syntax | Using `{{stepId.var}}` | Use `{{outputAs}}` only |
| Missing credentials | No API key configured | Tell user to add at /settings/credentials |
| Parameter mismatch | Wrong input format | Check function signature, adjust wrapper |
| Invalid prompt (chat) | Test script limitation | Skip test, proceed to import |

**If tests fail:**
1. Check if it's a known chat workflow limitation
2. If not, debug the specific error
3. Fix and re-test
4. Don't import until resolved (except chat workflow test limitation)

### 10. Import to Database

Once testing succeeds:

```bash
npx tsx scripts/import-workflow.ts workflow/{filename}
```

Show the user:
- Workflow ID
- Name and description
- How to run it (manual, scheduled, etc.)
- Next steps (configure credentials if needed, test run, etc.)

## Special Cases

### Chat Workflows

For conversational workflows, use the AI SDK chat function:

```json
{
  "trigger": {
    "type": "chat",
    "config": { "inputVariable": "userMessage" }
  },
  "config": {
    "steps": [{
      "id": "chat",
      "module": "ai.ai-sdk.chat",
      "inputs": {
        "messages": [
          { "role": "system", "content": "You are a helpful assistant" },
          { "role": "user", "content": "{{trigger.userMessage}}" }
        ],
        "model": "gpt-4o-mini",
        "provider": "openai"
      }
    }]
  }
}
```

### Data Transformation Workflows

Use utility modules for data manipulation:
- `utilities.array-utils.*` - Array operations (filter, map, reduce, sort, etc.)
- `utilities.string-utils.*` - String operations (truncate, slugify, etc.)
- `utilities.json.*` - JSON transforms
- `utilities.csv.*` - CSV parsing/generation

### Multi-Step Workflows

For complex workflows with dependencies, steps execute in waves:
- **Wave 1 (parallel):** Independent steps run concurrently
- **Wave 2 (sequential):** Steps that depend on Wave 1 outputs
- **Wave 3+:** Further dependent steps

The executor automatically handles parallelization based on variable dependencies.

## Output Display (Optional)

If the user wants formatted output, configure both `returnValue` and `outputDisplay`:

```json
{
  "config": {
    "steps": [...],
    "returnValue": "{{finalArrayVariable}}",
    "outputDisplay": {
      "type": "table|list|text|markdown|json",
      "columns": [
        {
          "key": "fieldName",
          "label": "Display Name",
          "type": "text|link|date|number|boolean"
        }
      ]
    }
  }
}
```

**CRITICAL: `returnValue` Structure**

- **Location**: `returnValue` MUST be at the `config` level, NOT inside `outputDisplay`
- **Purpose**: Tells the executor which variable to return (instead of all variables)
- **Format**: Template string like `"{{variableName}}"` or `"{{variable.property}}"`
- **Required for**: Workflows with table/list output where final variable isn't a "magic name"

**Magic variable names** (auto-extracted if no `returnValue`):\
`finalAnalysisTable`, `finalTableData`, `tableData`, `results`, `data`, `output`

**Best practice**: Always use explicit `returnValue` for clarity and reliability.

**Examples:**

```json
// ✅ Table output with explicit returnValue
{
  "config": {
    "steps": [...],
    "returnValue": "{{sortedProducts}}",
    "outputDisplay": {
      "type": "table",
      "columns": [...]
    }
  }
}

// ✅ Text output with AI content extraction
{
  "config": {
    "steps": [...],
    "returnValue": "{{aiSummary.content}}",
    "outputDisplay": {
      "type": "text"
    }
  }
}

// ❌ WRONG - returnValue inside outputDisplay
{
  "config": {
    "steps": [...],
    "outputDisplay": {
      "type": "table",
      "returnValue": "{{data}}",  // ❌ Wrong location!
      "columns": [...]
    }
  }
}
```

Output Display Types:
- **table** - Tabular data (requires `returnValue` with array)
- **list** - Simple list (requires `returnValue` with array)
- **text** - Plain text (requires `returnValue` with string)
- **markdown** - Formatted text (requires `returnValue` with string)
- **json** - Raw JSON (any type)

## Available Module Categories

The platform has **900+ functions** across **140 modules** in these categories:

1. **Communication** - Email, Slack, Discord, Telegram, WhatsApp, Teams, Twilio
2. **Social Media** - Twitter, Reddit, YouTube, GitHub, Instagram, TikTok, LinkedIn
3. **AI** - OpenAI, Anthropic, AI SDK, Cohere, HuggingFace
4. **Data** - Google Sheets, Airtable, Notion, PostgreSQL, MongoDB, MySQL
5. **Business** - Stripe, Shopify, Salesforce, HubSpot, QuickBooks
6. **Content** - WordPress, Medium, Dev.to, Ghost
7. **Developer** - GitHub, GitLab, Vercel, Netlify, Sentry
8. **Media** - Cloudinary, YouTube, Spotify, Vimeo
9. **Lead Generation** - Apollo, Clearbit, Hunter, ZoomInfo
10. **Utilities** - HTTP, RSS, CSV, JSON, Array/String/Date utils, encryption, compression

For detailed module listings, see `reference.md` in this skill directory.

## Troubleshooting Common Errors

### Parameter Mismatch Errors

**Error:** `Parameter mismatch for ai.ai-sdk.chat: Function expects [options] but workflow provided [model, messages, provider]`

**Cause:** The function expects inputs wrapped with a parameter name, but you provided them as direct properties.

**Fix:** Look at the function signature:
- If it's `chat(options: Type)` → wrap in `{ "options": { your inputs } }`
- If it's `chat({ param1, param2 })` → use direct properties `{ "param1": ..., "param2": ... }`

**Example:**
```json
// ❌ Wrong for chat(options: AIChatOptions)
"inputs": {
  "messages": [...],
  "model": "gpt-4o-mini"
}

// ✅ Correct
"inputs": {
  "options": {
    "messages": [...],
    "model": "gpt-4o-mini"
  }
}
```

---

### AI SDK / Invalid Prompt Errors

**Error:** `Invalid prompt: The messages must be a ModelMessage[]. If you have passed a UIMessage[], you can use convertToModelMessages`

**Cause:** Test script limitation with chat workflows. The AI SDK is receiving an unexpected message format during testing.

**When this happens:**
1. Check validation passed ✅
2. Check workflow structure is correct ✅
3. **Proceed to import** - it will work in production

**This is a known limitation of the test script, not your workflow.**

---

### AI SDK String/Object Type Errors

**Error:** `str.split is not a function` or `Cannot read properties of undefined (reading 'slice')`

**Cause:** You're passing an AI SDK object to a function expecting a string. AI SDK returns `{ content, usage, ... }`, not a plain string.

**Fix:** Access the `.content` property:

```json
// ❌ Wrong
{
  "module": "utilities.string-utils.wordCount",
  "inputs": {
    "str": "{{aiOutput}}"  // aiOutput is an object!
  }
}

// ✅ Correct
{
  "module": "utilities.string-utils.wordCount",
  "inputs": {
    "str": "{{aiOutput.content}}"  // Extract the string
  }
}
```

**This applies to ANY function expecting a string when you're using AI SDK output:**
- `utilities.string-utils.*` → Use `.content`
- `utilities.array-utils.concat` with strings → Use `.content`
- `social.*.send` with AI-generated messages → Use `.content`

---

### Array Function Errors

**Error:** `arr.map is not a function` or `Cannot read properties of undefined (reading 'includes')`

**Cause:** The input is not an array, or you're using the wrong parameter format.

**Common causes:**

1. **API returns object instead of array:**
   ```json
   // Reddit API returns: { data: { children: [...] } }
   // NOT: [...]
   ```
   **Fix:** Use API-specific path or switch to deterministic data generation

2. **Wrong parameter format for array functions:**
   ```json
   // ❌ Wrong - intersection uses rest parameters
   {
     "module": "utilities.array-utils.intersection",
     "inputs": {
       "array1": "{{a}}",
       "array2": "{{b}}"
     }
   }

   // ✅ Correct
   {
     "module": "utilities.array-utils.intersection",
     "inputs": {
       "arrays": ["{{a}}", "{{b}}"]
     }
   }
   ```

3. **Check function signature:**
   - `intersection(...arrays)` → `{ "arrays": [arr1, arr2] }`
   - `difference(arr1, arr2)` → `{ "arr1": "{{a}}", "arr2": "{{b}}" }`
   - `union(arr1, arr2)` → `{ "arr1": "{{a}}", "arr2": "{{b}}" }`

---

### zipToObjects Character Array Bug

**Error:** Workflow creates 100+ objects instead of expected count, or each row has single characters instead of full strings.

**Cause:** Passing a string directly to `zipToObjects` treats it as an array of characters.

**Example of the bug:**
```json
{
  "fieldArrays": {
    "id": [1, 2, 3],
    "title": ["A", "B", "C"],
    "summary": "This is a summary"  // ❌ Creates 18 objects (one per char)
  }
}
// Result: [{ id: 1, title: "A", summary: "T" }, { summary: "h" }, { summary: "i" }, ...]
```

**Fix:** Wrap string values in arrays, repeating for each row:
```json
{
  "fieldArrays": {
    "id": [1, 2, 3],
    "title": ["A", "B", "C"],
    "summary": ["This is a summary", "This is a summary", "This is a summary"]
  }
}
// Result: [{ id: 1, title: "A", summary: "This is a summary" }, ...]
```

**For AI-generated content that should be the same for all rows:**
```json
{
  "fieldArrays": {
    "id": [1, 2, 3, 4, 5],
    "conclusion": [
      "{{aiConclusion.content}}",
      "{{aiConclusion.content}}",
      "{{aiConclusion.content}}",
      "{{aiConclusion.content}}",
      "{{aiConclusion.content}}"
    ]
  }
}
```

---

### Variable Reference Warnings

**Warning:** `Step 1 (chat): References undeclared variable "trigger"`

**Cause:** Validator doesn't recognize trigger variables as they're injected at runtime.

**Action:** This is expected for workflows with `trigger.type = "chat"`, `"webhook"`, etc. Safe to ignore if:
- Trigger config has matching `inputVariable`
- Variables use correct syntax: `{{trigger.inputVariable}}`

---

### Missing Credentials

**Error:** `Missing API key` or `Authentication failed`

**Cause:** User hasn't configured required credentials.

**Fix:** Tell user to:
1. Visit http://localhost:3000/settings/credentials
2. Add the required API keys/tokens
3. Test workflow again

---

### Module Not Found

**Error:** `Module "category.module.function" not found`

**Cause:**
- Typo in module path
- Module doesn't exist
- Case sensitivity (must be lowercase)

**Fix:**
1. Search again: `npx tsx scripts/search-modules.ts "keyword"`
2. Verify exact module path from search results
3. Check for typos (e.g., `social.twitter.postTweet` not `Social.Twitter.PostTweet`)
4. If module truly doesn't exist, use `utilities.http.*` for custom API calls

---

### Validation Errors

**Error:** `Invalid JSON structure` or `Missing required field`

**Cause:** Malformed JSON or missing required workflow fields.

**Fix:**
- Check JSON syntax (trailing commas, quotes, brackets)
- Ensure `version`, `name`, `description`, `trigger`, `config` all present
- Verify `trigger` is at top level, not inside `config`
- Check all step IDs are unique

---

### Service Not Running Errors

**Error:** `Connection refused` or `ECONNREFUSED`

**Cause:** Required services (Docker, Next.js) not running.

**Fix:** Run pre-flight checks and start services:
```bash
npm run docker:start
npm run dev:full
```

---

### Output Display Context Leak

**Error:** Workflow output shows entire context object instead of formatted table/list

**Cause:** Missing or incorrectly placed `returnValue` configuration

**Fix:**
1. **Add `returnValue` at config level:**
   ```json
   {
     "config": {
       "steps": [...],
       "returnValue": "{{yourArrayVariable}}",  // ✅ Correct location
       "outputDisplay": {
         "type": "table",
         "columns": [...]
       }
     }
   }
   ```

2. **NOT inside outputDisplay:**
   ```json
   {
     "config": {
       "steps": [...],
       "outputDisplay": {
         "returnValue": "{{data}}",  // ❌ Wrong - gets ignored
         "type": "table"
       }
     }
   }
   ```

3. **Auto-fix will detect and fix this:**
   ```bash
   npx tsx scripts/auto-fix-workflow.ts workflow/{filename} --write
   ```

**Why it happens:**
- Without `returnValue`, executor returns ALL variables
- Renderer can only auto-extract if variable uses magic name
- Magic names: `finalAnalysisTable`, `finalTableData`, `tableData`, `results`, `data`, `output`
- Custom names like `sortedProducts` require explicit `returnValue`

---

### Import / File Path Errors

**Error:** `Cannot import workflow` or `File not found` or `Failed to create diff`

**Cause:** Workflow saved to wrong directory (temp directory or absolute path instead of relative path).

**Fix:**
1. Workflows MUST be saved to `workflow/{filename}` relative to project root
2. Check file path - should be: `workflow/my-workflow.json`
3. NOT temp directories: `/tmp/`, `/var/tmp/`, etc.
4. NOT absolute paths: `/Users/...`, `~/...`
5. Re-save file to correct location

**Why this matters:**
- Import script expects relative paths
- Validation tools need project-relative paths
- Diff comparison requires consistent directory structure
- Scripts execute from project root

---

## Error Handling Strategy

When you encounter an error:

1. **Identify the error type** (use table above)
2. **Check if it's a known limitation** (chat workflow tests)
3. **If fixable:** Apply the fix and re-test
4. **If not fixable:** Explain limitation and proceed if safe
5. **Never simplify the workflow** - fix the actual issue

## Communication Style

- Be direct and efficient
- Explain what you're doing briefly
- Show commands you're running
- Celebrate successful creation!
- If anything is unclear, ask before proceeding

## Example Workflow Generation

**User:** "I want to monitor Reddit's r/singularity and send top posts to Slack daily"

**Your Process:**
1. Identify: Reddit → Slack, daily schedule
2. Search modules: `reddit` and `slack`
3. Trigger: `cron` with `0 9 * * *` (9am daily)
4. Steps:
   - Fetch posts from r/singularity
   - Filter top posts
   - Format message
   - Send to Slack
5. Build JSON → Save → Validate → Test → Import
6. Report: "Workflow created! ID: abc123. It will run daily at 9am."

Now you're ready to generate workflows! When the user requests one, follow this process and create production-ready automations.
