# Local Preference Dataset Viewer

A local web application for browsing and comparing multi-model evaluation datasets with advanced filtering and visualization features.

## Features

### Dataset Browsing
- Browse JSONL dataset files from local directories
- Multi-dataset support with automatic detection
- Pagination with configurable page sizes (10/20/50/100)
- Dark mode support

### Filtering System
- **Models Filter**: Multi-select filter for comparing specific models
- **Languages Filter**: Filter by available languages in the dataset
- **Datasets Filter**: Switch between different datasets
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

### Data Processing
- Automatic detection of available models, languages, and metrics
- "No Response" filtering (hides rows where all models have no response)
- Efficient server-side filtering and pagination

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
│   │   ├── DataTable.tsx      # Main data table component
│   │   └── Sidebar/
│   │       ├── FilterPanel.tsx # Filter controls
│   │       └── index.tsx
│   ├── hooks/
│   │   └── useFilters.ts      # Filter state management
│   ├── types/
│   │   └── filters.ts         # TypeScript type definitions
│   ├── App.tsx                # Main application component
│   └── main.tsx               # Entry point
├── server.ts                  # Express backend server
├── package.json
└── README.md
```

## Data Format

The app expects JSONL files with the following structure:

```json
{
  "turns": [
    {
      "role": "user",
      "content": "..."
    }
  ],
  "models": {
    "model_suffix": {
      "response": "...",
      "metrics": {
        "meteor": { "score": 0.85 },
        "tags": 1
      }
    }
  },
  "language": "en",
  "dataset": "dataset_name"
}
```

## Recent Updates

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