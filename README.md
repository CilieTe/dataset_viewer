# Local Preference Dataset Viewer

A lightweight web interface for viewing and comparing LLM evaluation datasets with model comparison capabilities.

![Dataset Viewer Screenshot](./screenshot.png)

## Features

- 📊 **Multi-Dataset Support** - Load and browse multiple JSONL evaluation datasets
- 📤 **File Upload** - Upload JSONL files directly from the browser (drag & drop supported)
- 🤖 **Model Comparison** - Side-by-side comparison of multiple model outputs
- 📈 **Statistical Analysis** - Accuracy (Pass/Error/Irrelevant), Win Rate, and Score rankings
- 🎯 **Head-to-Head Comparison** - Compare two specific models across common samples
- 💬 **Conversation View** - Full conversation context with system/user/assistant messages
- 🏷️ **Tag Filtering** - View samples by error tags and categories
- 📝 **Guide Reviews** - Display AI evaluator feedback (G0, G1, etc.) with Pass/Error/Irrelevant classification
- 📱 **Responsive UI** - Clean, modern interface with Tailwind CSS
- 🚀 **Static Export** - Generate standalone HTML files for sharing

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
git clone <repository-url>
cd local-preference-dataset-viewer
npm install
```

### Running the Development Server

```bash
npm run dev
```

Then open http://localhost:3000 in your browser.

### Building Static HTML

Generate a standalone HTML file with all data embedded:

```bash
node build-static.js
```

This creates `viewer-static.html` which can be opened directly in a browser or shared with others without requiring a server.

## Dataset Format

Place your evaluation datasets in the `dataset/` folder as JSONL files. Each file should contain records with the following structure:

```json
{
  "id": "dialogue_001",
  "type": "compress",
  "dialog": [
    {"turn_index": 0, "role": "system", "content": "..."},
    {"turn_index": 1, "role": "user", "content": "..."},
    {
      "turn_index": 2,
      "role": "assistant",
      "content": "Ground truth response...",
      "evaluate": {
        "model-v1": {
          "content": "Model response...",
          "metrics": {
            "meteor": {"score": 0.85},
            "tool_acc": {"score": 1.0}
          }
        },
        "model-v2": {
          "content": "Another model response...",
          "metrics": {
            "meteor": {"score": 0.72},
            "tool_acc": {"score": 0.0}
          }
        }
      }
    }
  ],
  "tools": {...},
  "meta": {"chat_lang": "en"}
}
```

### Required Fields

- `id` - Unique identifier for the conversation
- `dialog` - Array of conversation turns
- `dialog[].role` - "system", "user", or "assistant"
- `dialog[].evaluate` - Model outputs with metrics (only on assistant turns)

### Metrics

- `meteor.score` - METEOR similarity score (0-1)
- `tool_acc.score` - Tool call accuracy (1 = correct, 0 = incorrect)
- `match_acc.score` - Match accuracy for response comparison

## Usage Guide

### Browsing Data

1. Select a dataset from the dropdown (or "All Datasets" to view everything)
2. Navigate through pages using Previous/Next buttons
3. Click on any row to view full conversation details

### Model Comparison

1. Select "Model A" and "Model B" from the comparison dropdowns
2. View the Head-to-Head Comparison card showing:
   - Win Rate (based on METEOR scores)
   - Accuracy comparison
   - Average METEOR scores

### Understanding Statistics

- **Accuracy (Pass)** - Percentage of samples where tool calls were correct
- **Win Rate (Best METEOR)** - Percentage of samples where this model had the highest METEOR score
- **METEOR Score** - Average METEOR similarity to ground truth

### Tie Handling

When multiple models achieve the same highest METEOR score on a sample, all tied models receive a win for that sample.

### Score Filtering

Samples where all models have METEOR = 0 are excluded from:
- Win Rate calculations
- METEOR Score averages

This is because METEOR = 0 typically indicates "not scored" rather than "zero similarity".

## Project Structure

```
local-preference-dataset-viewer/
├── dataset/                    # Place your JSONL datasets here
├── index.html                  # Main application (React + CDN)
├── server.ts                   # Express server with API endpoints
├── build-static.js             # Script to generate static HTML
├── viewer-static.html          # Generated static file (after build)
├── package.json
└── README.md
```

## API Endpoints

When running the development server:

- `GET /api/datasets` - List all available datasets
- `GET /api/models?dataset={name}` - List models in dataset
- `GET /api/schema-summary?dataset={name}` - Statistics summary
- `GET /api/rows?page={n}&page_size={20}&dataset={name}` - Paginated data
- `GET /api/compare?modelA={name}&modelB={name}&dataset={name}` - Head-to-head comparison

## Configuration

### Port

Default port is 3000. Set via environment variable:

```bash
PORT=8080 npm run dev
```

### Dataset Directory

Datasets are loaded from the `dataset/` folder by default. Modify `server.ts` or `build-static.js` to change this location.

## Troubleshooting

### Page loads but shows no data

- Check that JSONL files are in the `dataset/` folder
- Verify JSONL format matches the expected structure
- Check browser console for parsing errors

### CORS errors

If accessing from a different origin, ensure the server is running or use the static HTML export.

### Large datasets

For very large datasets (GBs), consider:
- Splitting into multiple JSONL files
- Increasing Node.js memory limit: `NODE_OPTIONS="--max-old-space-size=4096"`

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Requires ES2020 support and modern CSS features.

## Development

### Tech Stack

- **Frontend**: React 18, Tailwind CSS (via CDN)
- **Backend**: Express, TypeScript
- **Build**: tsx (TypeScript execution)

### Adding Features

The frontend code is embedded in `index.html` as JSX (processed by Babel standalone). Modify the React components directly in the `<script type="text/babel">` tag.

## License

MIT License - feel free to use for your own evaluation datasets!

## Contributing

Contributions welcome! Please ensure:
- Code follows existing style
- Changes work with both dev server and static export
- Test with multiple dataset formats

## Acknowledgments

- React Team for the excellent framework
- Tailwind CSS for utility-first styling
- METEOR metric creators for text similarity evaluation
