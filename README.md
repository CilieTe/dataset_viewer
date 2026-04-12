# Local Preference Dataset Viewer

A local web application for browsing and comparing multi-model evaluation datasets with advanced filtering and visualization features.

## Features

### Dataset Browsing
- Browse JSONL dataset files from local directories
- Multi-dataset support with automatic detection
- Pagination with configurable page sizes (10/20/50/100)
- Dark mode support

### Filtering System
- **Models Filter**: Multi-select filter for comparing specific models with drag-and-drop reordering
- **Languages Filter**: Filter by available languages in the dataset
- **Datasets Filter**: Switch between different datasets
- **Turn Filter**: Multi-select filter for conversation turns with Select All/Clear All
- **Metric Source Filter**: Select different evaluation metrics (METEOR, Tool Accuracy, Tags, etc.)
- **Score Range Filter**: Filter rows by score range (for numeric metrics)
- **Evaluation Tags Filter**: Three checkboxes for -1 (Error), 0 (Invalid), 1 (Pass) with OR logic
- **Search**: Full-text search across conversations
- **Auto-refresh**: All filter changes automatically trigger data refresh

### Dynamic Metric Display
- **Evaluation Tags**: Color-coded status display (Green=Pass, Red=Error, Gray=Invalid)
- **Numeric Metrics**: Score display with color gradient based on value
- **No Metric Source**: Clear placeholder when selected metric is unavailable for a row

### Visualization
- Side-by-side model comparison in cards
- Conversation context with truncation (shows only relevant turns)
- Score visualization with color gradients
- Response highlighting for multi-turn conversations
- **Evaluation View**: Comprehensive evaluation dashboard with tag statistics and model comparison
- **Tag Distribution**: Visual bar charts showing Pass/Error/Invalid/Null distribution per model
- **Model Ranking**: Auto-sorted by Pass rate with rank badges (gold/silver/bronze)

### Data Processing
- Automatic detection of available models, languages, and metrics
- "No Response" filtering (hides rows where all models have no response)
- Efficient server-side filtering and pagination
- **Export Filtered Data**: Export filtered datasets as JSONL with all current filters applied
- **Metadata Display**: Shows ID, language, turn number, and node_remark from laep data

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Backend**: Express.js (server.ts)

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
cd local-preference-dataset-viewer
npm install
```

### Running the App

```bash
npm run dev
```

This starts both the frontend (Vite dev server) and backend (Express server).

The app will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

## Project Structure

```
local-preference-dataset-viewer/
├── src/
│   ├── components/
│   │   ├── DataTable.tsx         # Main data table component
│   │   ├── EvaluationView.tsx    # Evaluation dashboard with tag statistics
│   │   ├── ConversationDrawer.tsx # Conversation detail drawer
│   │   └── Sidebar/
│   │       ├── DatasetPanel.tsx  # Dataset selection and export
│   │       ├── FilterPanel.tsx   # Filter controls
│   │       └── index.tsx
│   ├── hooks/
│   │   └── useFilters.ts         # Filter state management
│   ├── types/
│   │   └── filters.ts            # TypeScript type definitions
│   ├── App.tsx                   # Main application component
│   └── main.tsx                  # Entry point
├── server.ts                     # Express backend server
├── package.json
└── README.md
```

## Data Format

The app expects JSONL files with the following structure:

```json
{
  "id": "session_id",
  "type": "conversation_type",
  "meta": {
    "chat_lang": "en"
  },
  "dialog": [
    {
      "turn_index": 1,
      "role": "user",
      "content": "..."
    },
    {
      "turn_index": 2,
      "role": "assistant",
      "content": "...",
      "tags": ["tag1", "tag2"],
      "laep": {
        "remark": "Evaluation note"
      },
      "evaluate": {
        "model_suffix": {
          "content": "Model response",
          "metrics": {
            "meteor": { "score": 0.85 },
            "tags": 1
          }
        }
      }
    }
  ]
}
```

### Supported Fields
- **id**: Session identifier
- **type**: Conversation type/category
- **meta.chat_lang**: Language code (e.g., "en", "zh")
- **dialog**: Array of conversation turns
- **dialog[].turn_index**: Turn number (1, 2, 3...)
- **dialog[].role**: "user" or "assistant"
- **dialog[].content**: Message content
- **dialog[].tags**: Array of tag strings
- **dialog[].laep.remark**: Evaluation remark/note
- **dialog[].evaluate**: Model outputs with metrics
- **dialog[].evaluate[model].metrics**: Metric scores (tags: -1/0/1/null, meteor: 0-1, etc.)

## Recent Updates

### v1.5.0 (2026-04-12)
- **Tag Statistics Enhancement**: Added manner controls to include/exclude Invalid and Null values in Pass rate calculations
- **Dynamic Progress Bars**: Tag distribution bars now adjust based on manner settings
- **Model Ranking**: Tag Distribution by Model now auto-sorts by Pass rate (descending) with rank badges
- **Turn Select All**: Added "Select All" / "Clear All" button for Turn filter
- **Export Filtered JSONL**: Sidebar Datasets panel now supports exporting filtered data
- **Metadata Display**: Added node_remark display from laep.remark field
- **Updated Links**: GitHub and Documentation links now point to CilieTe/dataset_viewer

### v1.4.0 (2026-04-12)
- **Evaluation View**: New evaluation page with Overview, Comparison, Analysis, and Tag Statistics tabs
- **Tag Value Mapping**: Fixed null tag values to display correctly (gray) instead of as Invalid (yellow)
- **Model Comparison**: Side-by-side model comparison with winner highlighting

### v1.3.0 (2026-04-12)
- **Column Reordering**: Drag-and-drop column reordering for model comparison
- **Turn Filter**: Multi-select filter for conversation turns
- **Search Enhancement**: Full-text search with highlighting

### v1.2.0 (2026-03-27)
- **Evaluation Tags Filter**: Added three-checkbox filter with OR logic for -1, 0, 1 values
- **Auto-refresh Filtering**: All filter changes now automatically trigger data refresh
- **Unified Metric Fields**: Consistent `score_${metricKey}_${suffix}` naming across all metrics
- **No Metric Source Display**: Clear placeholder when selected metric is unavailable

### v1.1.0 (2026-03-27)
- Dynamic UI based on Metric Source selection
- Context truncation (shows only relevant conversation turns)
- No Response filtering (hides rows where all models have no response)
- Dark mode improvements

### v1.0.0
- Initial release with basic dataset browsing and filtering