# Module Reference

This document provides an overview of available modules across all categories. For complete function signatures, use `npx tsx scripts/search-modules.ts "keyword"`.

## Quick Category Index

1. [Communication](#communication) - 60+ functions
2. [Social Media](#social-media) - 80+ functions
3. [AI & Machine Learning](#ai--machine-learning) - 40+ functions
4. [Data & Storage](#data--storage) - 50+ functions
5. [Business & Commerce](#business--commerce) - 60+ functions
6. [Content Management](#content-management) - 30+ functions
7. [Developer Tools](#developer-tools) - 40+ functions
8. [Media & Assets](#media--assets) - 35+ functions
9. [Lead Generation](#lead-generation) - 25+ functions
10. [Utilities](#utilities) - 250+ functions

---

## Communication

### Email (communication.email.*)
- `sendEmail` - Send email via Resend
- `sendTextEmail` - Simple text email
- `sendHtmlEmail` - HTML formatted email

### Slack (communication.slack.*)
- `postMessage` - Post to channel
- `sendText` - Simple text message
- `uploadFile` - Upload file
- `addReaction` - React to message

### Discord (communication.discord.*)
- `sendMessage` - Send to channel
- `sendEmbed` - Rich embed message
- `sendFile` - Upload file
- `addReaction` - React to message

### Telegram (communication.telegram.*)
- `sendMessage` - Send message
- `sendPhoto` - Send photo
- `sendDocument` - Send file
- `editMessageText` - Edit message
- `deleteMessage` - Delete message

### WhatsApp (communication.whatsapp.*)
- `sendMessage` - Send message
- `sendTemplate` - Use message template
- `sendMedia` - Send media file

### Teams (communication.teams.*)
- `sendMessage` - Send to channel
- `sendCard` - Adaptive card
- `sendMention` - Mention user

### Twilio (communication.twilio.*)
- `sendSMS` - Send text message
- `makeCall` - Voice call
- `sendWhatsApp` - WhatsApp via Twilio

---

## Social Media

### Twitter/X (social.twitter.*)
- `postTweet` - Post tweet
- `createThread` - Tweet thread
- `replyToTweet` - Reply to tweet
- `searchTweets` - Search tweets
- `getUserTimeline` - Get user tweets

### Reddit (social.reddit.*)
- `getTopPosts` - Top posts from subreddit
- `getHotPosts` - Hot posts
- `searchSubreddit` - Search in subreddit
- `postToSubreddit` - Submit post
- `commentOnPost` - Add comment

### YouTube (social.youtube.*)
- `searchVideos` / `searchVideosWithApiKey` - Search videos (prefer WithApiKey for read-only)
- `getVideoDetails` / `getVideoDetailsWithApiKey` - Video info
- `getChannelDetails` / `getChannelDetailsWithApiKey` - Channel info
- `uploadVideo` - Upload video (OAuth required)
- `postComment` - Comment on video (OAuth required)

### GitHub (social.github.*)
- `getTrendingRepositories` - Trending repos
- `searchRepositories` - Search repos
- `getRepositoryDetails` - Repo info
- `createIssue` - Create issue
- `createPullRequest` - Create PR
- `getUserRepositories` - List user repos

### Instagram (social.instagram.*)
- `postPhoto` - Upload photo
- `postStory` - Post story
- `getRecentMedia` - Recent posts
- `searchHashtag` - Search by hashtag

### TikTok (social.tiktok.*)
- `uploadVideo` - Upload video
- `searchVideos` - Search videos
- `getUserVideos` - Get user videos

### LinkedIn (social.linkedin.*)
- `postUpdate` - Share update
- `searchJobs` - Job search
- `getProfile` - Get profile data

---

## AI & Machine Learning

### OpenAI (ai.openai.*)
- `generateText` - Text completion
- `chat` - Chat completion
- `generateImage` - DALL-E image
- `createEmbedding` - Text embeddings
- `transcribeAudio` - Whisper transcription

### Anthropic Claude (ai.anthropic.*)
- `generateText` - Claude text generation
- `chat` - Claude chat
- `streamChat` - Streaming chat

### AI SDK (ai.ai-sdk.*)
- `chat` - Universal chat (OpenAI, Anthropic, etc.)
- `generateText` - Universal text generation
- `streamText` - Streaming text

### Cohere (ai.cohere.*)
- `generateText` - Cohere generation
- `createEmbedding` - Embeddings
- `rerank` - Rerank results

### HuggingFace (ai.huggingface.*)
- `generateText` - Text generation
- `generateImage` - Image generation
- `textToSpeech` - TTS
- `speechToText` - STT

---

## Data & Storage

### Google Sheets (data.googlesheets.*)
- `addRow` - Append row
- `readSheet` - Read sheet data
- `updateCell` - Update cell
- `createSheet` - New sheet
- `deleteRows` - Delete rows

### Airtable (data.airtable.*)
- `createRecord` - Create record
- `listRecords` - List records
- `updateRecord` - Update record
- `deleteRecord` - Delete record

### Notion (data.notion.*)
- `createPage` - Create page
- `queryDatabase` - Query database
- `updatePage` - Update page
- `searchPages` - Search pages

### PostgreSQL (data.postgresql.*)
- `query` - Execute SQL query
- `insert` - Insert records
- `update` - Update records
- `delete` - Delete records

### MongoDB (data.mongodb.*)
- `find` - Find documents
- `insertOne` - Insert document
- `updateOne` - Update document
- `deleteOne` - Delete document

### MySQL (data.mysql.*)
- `query` - Execute query
- `insert` - Insert data
- `update` - Update data
- `delete` - Delete data

---

## Business & Commerce

### Stripe (business.stripe.*)
- `createCharge` - Create charge
- `createCustomer` - New customer
- `listCustomers` - List customers
- `createSubscription` - New subscription
- `cancelSubscription` - Cancel subscription

### Shopify (business.shopify.*)
- `createProduct` - Create product
- `listOrders` - List orders
- `updateInventory` - Update inventory
- `fulfillOrder` - Fulfill order

### Salesforce (business.salesforce.*)
- `createLead` - Create lead
- `updateAccount` - Update account
- `queryRecords` - SOQL query
- `createOpportunity` - New opportunity

### HubSpot (business.hubspot.*)
- `createContact` - New contact
- `updateDeal` - Update deal
- `createTicket` - Support ticket
- `searchContacts` - Search contacts

### QuickBooks (business.quickbooks.*)
- `createInvoice` - New invoice
- `createCustomer` - New customer
- `getInvoiceDetails` - Invoice info
- `recordPayment` - Record payment

---

## Content Management

### WordPress (content.wordpress.*)
- `createPost` - Create post
- `updatePost` - Update post
- `listPosts` - List posts
- `deletePost` - Delete post

### Medium (content.medium.*)
- `createPost` - Publish post
- `getUserPosts` - Get user posts

### Dev.to (content.devto.*)
- `createArticle` - Publish article
- `updateArticle` - Update article
- `listArticles` - List articles

### Ghost (content.ghost.*)
- `createPost` - Create post
- `updatePost` - Update post
- `listPosts` - List posts

---

## Developer Tools

### GitHub (developer.github.*)
(See Social Media > GitHub for repository functions)

### Vercel (developer.vercel.*)
- `deployProject` - Deploy project
- `listDeployments` - List deployments
- `getDeploymentDetails` - Deployment info

### Netlify (developer.netlify.*)
- `deploySite` - Deploy site
- `listSites` - List sites
- `updateSite` - Update site

### Sentry (developer.sentry.*)
- `listIssues` - List errors
- `getIssueDetails` - Error details
- `resolveIssue` - Mark resolved

---

## Media & Assets

### Cloudinary (media.cloudinary.*)
- `uploadImage` - Upload image
- `transformImage` - Transform image
- `uploadVideo` - Upload video
- `generateThumbnail` - Video thumbnail

### Spotify (media.spotify.*)
- `searchTracks` - Search songs
- `getPlaylist` - Get playlist
- `createPlaylist` - New playlist
- `addToPlaylist` - Add tracks

### Vimeo (media.vimeo.*)
- `uploadVideo` - Upload video
- `getVideoDetails` - Video info
- `updateVideo` - Update video

---

## Lead Generation

### Apollo (leadgen.apollo.*)
- `searchPeople` - Find people
- `searchCompanies` - Find companies
- `enrichPerson` - Enrich data

### Clearbit (leadgen.clearbit.*)
- `enrichCompany` - Company data
- `enrichPerson` - Person data
- `prospectSearch` - Find prospects

### Hunter (leadgen.hunter.*)
- `findEmail` - Find email address
- `verifyEmail` - Verify email
- `domainSearch` - Search domain

---

## Utilities

### HTTP (utilities.http.*)
- `makeRequest` - HTTP request
- `get` - GET request
- `post` - POST request
- `put` - PUT request
- `delete` - DELETE request

### Array Utils (utilities.array-utils.*)
- `filter` - Filter array
- `map` - Map array
- `reduce` - Reduce array
- `sort` - Sort array
- `unique` - Remove duplicates
- `flatten` - Flatten nested arrays
- `chunk` - Split into chunks
- `sum` - Sum numbers
- `average` - Calculate average
- `range` - Generate range

### String Utils (utilities.string-utils.*)
- `truncate` - Truncate string
- `slugify` - Create slug
- `capitalize` - Capitalize
- `camelCase` - Convert to camelCase
- `kebabCase` - Convert to kebab-case
- `snakeCase` - Convert to snake_case

### Date Utils (utilities.date-utils.*)
- `formatDate` - Format date
- `addDays` - Add days
- `subtractDays` - Subtract days
- `daysBetween` - Calculate difference
- `parseDate` - Parse date string

### JSON (utilities.json.*)
- `parse` - Parse JSON
- `stringify` - Stringify object
- `transform` - Transform JSON
- `merge` - Merge objects

### CSV (utilities.csv.*)
- `parse` - Parse CSV
- `generate` - Generate CSV
- `transform` - Transform data

### RSS (utilities.rss.*)
- `parseFeed` - Parse RSS feed
- `getFeedItems` - Get feed items

### Encryption (utilities.encryption.*)
- `encrypt` - Encrypt data
- `decrypt` - Decrypt data
- `hash` - Hash data
- `generateKey` - Generate key

### Validation (utilities.validation.*)
- `validateEmail` - Validate email
- `validateURL` - Validate URL
- `validateJSON` - Validate JSON
- `validatePhone` - Validate phone

---

## Usage Notes

### Authentication Methods

**API Key Functions (Suffix: `WithApiKey`)**
- Use for read-only operations
- Require `apiKey: "{{credential.SERVICE_api_key}}"` parameter
- Preferred for public data access

**OAuth Functions (No suffix)**
- Use for write operations
- Credentials auto-injected
- Required for private/authenticated data

### Variable References

**Trigger Variables:**
```json
"{{trigger.inputVariable}}"
```

**Step Outputs:**
```json
"{{outputAs}}"  // Just the outputAs name, NO step ID
```

### Module Search

To find exact function signatures:
```bash
npx tsx scripts/search-modules.ts "keyword"
```

Examples:
- `"twitter"` - Find Twitter functions
- `"openai"` - Find OpenAI functions
- `"array"` - Find array utilities
- `"email"` - Find email functions

---

**Total:** 900+ functions across 140+ modules in 16 categories.

For the most up-to-date module information, always search using `scripts/search-modules.ts`.
