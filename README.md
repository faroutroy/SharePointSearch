[README.md](https://github.com/user-attachments/files/25389129/README.md)
# 🔍 Custom SPFx Search Web Part

A fully custom SharePoint Framework (SPFx) web part built with React + TypeScript that lets users search across SharePoint List Items and Document Libraries — all inline on the page, no third-party library required.

---

📸 What It Looks Like

```
┌──────────────────────────────────────────────────────────┐
│  Search                                                   │
│  ┌─────────────────────────────────────────┬──────────┐  │
│  │ 🔍  Search list items and documents...  │  Search  │  │
│  └─────────────────────────────────────────┴──────────┘  │
│                                                           │
│  All (12)    List Items (5)    Documents (7)              │
│  ─────────────────────────────────────────               │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ 📋  Annual Budget Report                        >   │  │
│  │      List Item  📂 Finance  👤 John D.  🕒 1/12/25  │  │
│  ├─────────────────────────────────────────────────────┤  │
│  │ 📕  Q4 Financial Report.pdf                     >   │  │
│  │      PDF  📂 Documents  👤 Jane S.  🕒 2/01/25  45KB│  │
│  └─────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

---

📁 Project Structure

```
spfx-custom-search/
├── src/
│   └── webparts/
│       └── customSearch/
│           ├── CustomSearchWebPart.ts          ← SPFx entry point
│           ├── CustomSearchWebPart.manifest.json
│           ├── models/
│           │   └── ISearchResult.ts            ← TypeScript interfaces
│           ├── services/
│           │   └── SearchService.ts            ← All SharePoint REST API calls
│           └── components/
│               ├── ICustomSearchProps.ts       ← Props interface
│               ├── CustomSearch.tsx            ← Main React component
│               └── CustomSearch.module.scss    ← Scoped SCSS styles
├── config/
│   ├── config.json                             ← Bundle config
│   └── package-solution.json                  ← Package/deploy config
├── package.json
├── tsconfig.json
└── gulpfile.js
```

---

🏗️ Architecture Overview

```
CustomSearchWebPart.ts  (SPFx entry)
        │
        │  renders
        ▼
CustomSearch.tsx  (React Component)
        │
        │  calls
        ▼
SearchService.ts  (REST API layer)
        │
        ├── searchListItems()   → /_api/search/query  ContentClass:STS_ListItem
        ├── searchDocuments()   → /_api/search/query  IsDocument:1
        └── searchAll()         → runs both in parallel (Promise.all)
```

---

⚙️ How the Search API Works

The web part uses SharePoint's built-in Search REST API endpoint:

```
GET {siteUrl}/_api/search/query
  ?querytext='<query> ContentClass:STS_ListItem'
  &selectproperties='Title,Path,Author,Write,...'
  &rowlimit=20
```

List Items Query
```
querytext = '{userQuery} ContentClass:STS_ListItem'
```
This targets only SharePoint list items (not documents).

Documents Query
```
querytext = '{userQuery} IsDocument:1'
```
This targets only files stored in document libraries.

Both searches run in parallel using `Promise.all` for speed.

---

🚀 Getting Started

Prerequisites
- Node.js 18.x
- SharePoint Online tenant
- SPFx 1.18 development environment set up

1. Setup Dev Environment (if not done)
```bash
npm install -g @microsoft/generator-sharepoint yo gulp-cli
```

2. Clone / Set Up the Project
```bash
# Create new SPFx project using Yeoman
yo @microsoft/sharepoint

# When prompted:
# ✅ Solution name: spfx-custom-search
# ✅ Baseline packages: SharePoint Online only
# ✅ Component type: WebPart
# ✅ Web part name: CustomSearch
# ✅ Framework: React

# Then replace the generated files with the files in this repository
```

3. Install Dependencies
```bash
npm install
```

4. Run Locally (SharePoint Workbench)
```bash
gulp serve
```
Then navigate to:
```
https://{your-tenant}.sharepoint.com/_layouts/15/workbench.aspx
```

5. Build & Package for Deployment
```bash
# Production build + package
gulp bundle --ship
gulp package-solution --ship

# The .sppkg file will be at:
# sharepoint/solution/spfx-custom-search.sppkg
```

6. Deploy to SharePoint
1. Go to your App Catalog site
2. Navigate to Apps for SharePoint
3. Upload `spfx-custom-search.sppkg`
4. Check ✅ "Make this solution available to all sites in the organization"
5. Click Deploy

7. Add to a Page
1. Edit any modern SharePoint page
2. Click + to add a web part
3. Search for "Custom Search"
4. Add and configure via the property pane

---

🎛️ Property Pane Options

| Property | Description | Default |
|---|---|---|
| Title | Heading shown above the search box | `"Search"` |
| Placeholder | Input field placeholder text | `"Search list items and documents..."` |

---

🔍 Features

| Feature | Details |
|---|---|
| Dual Search | Searches list items AND document libraries simultaneously |
| Debounce | Auto-searches 400ms after typing stops (min 2 chars) |
| Tab Filter | Filter results: All / List Items / Documents |
| File Icons | Visual icons for PDF, Word, Excel, PowerPoint, etc. |
| Result Cards | Title, type badge, site/library, author, modified date, file size |
| Clickable Results | Each card opens the item/document in a new tab |
| Clear Button | ✕ button to instantly reset search |
| Error Handling | Friendly error state if API call fails |
| Empty State | Helpful messaging when no results found |
| Loading State | Animated dots while searching |
| Keyboard | Enter = search, Escape = clear |
| Scoped CSS | SCSS modules — no style leakage into the page |

---

🔧 Key Files Explained

`SearchService.ts`
The entire SharePoint data layer lives here. Two methods:
- `searchListItems(query)` — calls `_api/search/query` with `ContentClass:STS_ListItem`
- `searchDocuments(query)` — calls `_api/search/query` with `IsDocument:1`
- `searchAll(query)` — runs both in `Promise.all` and merges results

Uses `SPHttpClient` from `@microsoft/sp-http` — the SPFx-safe way to make authenticated REST calls to SharePoint.

`CustomSearch.tsx`
The main React component manages:
- `query` state — bound to the input
- `results` state — array of `ISearchResult`
- `activeTab` state — 'all' | 'list' | 'document'
- Debounce timer on input changes
- Calls `SearchService.searchAll()` on search

`CustomSearchWebPart.ts`
The SPFx entry point. Passes `this.context` down to the React component so it has access to `spHttpClient` and `pageContext`.

---

🛠️ Extending the Web Part

Add more search scopes (e.g., Pages/News)
In `SearchService.ts`, add a new method:
```ts
public async searchPages(query: string): Promise<ISearchResult[]> {
  const encodedQuery = encodeURIComponent(
    `${query} ContentClass:STS_ListItem_WebPageLibrary`
  );
  // ... same pattern as searchListItems
}
```

Add a scope selector (current site vs. all sites)
Add `sourceid` to the search query:
```ts
// Search only the current site collection
`&sourceid='B09A7990-05EA-4AF9-81EF-EDFAB16C4E31'`
```

Add result highlighting
Extract `HitHighlightedSummary` from the search result cells for snippet text under each result.

---

📝 REST API Quick Reference

| Goal | Query Parameter |
|---|---|
| List items only | `ContentClass:STS_ListItem` |
| Documents only | `IsDocument:1` |
| Pages / Wiki | `ContentClass:STS_ListItem_WebPageLibrary` |
| Specific list | `ListId:{guid}` |
| Specific site | `SPSiteUrl:{url}` |
| File type filter | `FileType:pdf` |
| Select fields | `&selectproperties='Title,Path,...'` |
| Limit results | `&rowlimit=20` |
| Sort by date | `&sortlist='Write:descending'` |

---

✅ Permissions Required

The web part uses the authenticated user's session — no additional API permissions are needed in `package-solution.json`. Users will only see results they have read access to, which is enforced automatically by SharePoint Search's security trimming.

---

🤝 License
MIT
