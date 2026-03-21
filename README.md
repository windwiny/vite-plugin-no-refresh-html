# vite-plugin-no-refresh-html

A Vite development server plugin that hot-updates JS files (both ESM modules and classic scripts) without refreshing the HTML page, preserving user data such as form inputs.

## Features

- 🔥 Hot update JS files referenced by `<script>` tags (with or without `type="module"`)
- 💾 Keep HTML page from refreshing when unchanged (preserves form input values)
- 🍞 Built-in Toast notification component (optional)

## Installation

```bash
npm install -D vite-plugin-no-refresh-html
# or
pnpm add -D vite-plugin-no-refresh-html
# or
yarn add -D vite-plugin-no-refresh-html
```

## Usage

Add the plugin in `vite.config.ts` or `vite.config.js`:

```js
import { defineConfig } from 'vite'
import { vitePluginNoRefreshHtml } from 'vite-plugin-no-refresh-html'

export default defineConfig({
  plugins: [
    vitePluginNoRefreshHtml({
      injectToast: true  // Whether to inject Toast component, default true
    })
  ]
})
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `injectToast` | `boolean` | `true` | Whether to automatically inject Toast component's CSS and JS into HTML |
| `onHotUpdate` | `function` | `undefined` | Callback executed in **browser** after module hot update (receives data object `{ gjs, mjs, timestamp }`) |
| `onHotUpdateDelay` | `number` | `500` | Delay in milliseconds to execute the callback after hot update (default 500ms) |


### Example with onHotUpdate Callback

```js
import { defineConfig } from 'vite'
import { vitePluginNoRefreshHtml } from 'vite-plugin-no-refresh-html'

export default defineConfig({
  plugins: [
    vitePluginNoRefreshHtml({
      injectToast: true,
      // This function is serialized and injected into the browser to verify the hot update after download
      onHotUpdate(ctx) {
        console.log('Hot updated:', ctx.gjs, ctx.mjs)
        console.log('Timestamp:', ctx.timestamp)
        // Custom logic after hot update (runs in browser)
        // window.file1_version?.()
      },
      onHotUpdateDelay: 500, // 500ms delay execution, wait for fetch finish
    })
  ]
})
```

**Note:** The `onHotUpdate` callback is serialized to a string and injected into the HTML page. It runs in the browser context, not on the server.

## How It Works

1. Plugin intercepts Vite's HMR update requests
2. For changes to JS files (both ESM modules and classic scripts), no page refresh is triggered
3. Dynamically creates new `<script>` tags to reload the changed JS files
4. Optionally displays Toast notifications to inform users

## Built-in Toast Component

The plugin provides a lightweight Toast notification component by default, which can be disabled with `injectToast: false`.

### Toast API

AI code

```javascript
// Success notification
toast.success('Operation successful!')

// Error notification
toast.error('An error occurred')

// Warning notification
toast.warning('Data has expired')

// Info notification
toast.info('This is a message')

// Custom configuration
toast.success('Operation completed', {
  duration: 5000,      // Display duration (ms), 0 means no auto-close
  position: 'top-right', // Position: top-right, top-left, top-center, bottom-right, bottom-left, bottom-center
  closable: true       // Whether to show close button
})

// Set default configuration
setToastDefaults({
  duration: 3000,
  position: 'top-center',
  closable: true
})
```

## Development Commands

```bash
# Development mode
npm run dev

# Build
npm run build

# Preview build result
npm run preview

# Code linting
npm run lint

# Run tests
npm run test
```

## File Structure

```
vite-plugin-no-refresh-html/
├── vite-plugin-no-refresh-html.js    # Plugin main file
├── public/
│   ├── toast.js           # Toast component JS
│   └── toast.css          # Toast component styles
├── demo/                  # Demo project directory
│   ├── index.html         # Demo main page
│   ├── toast-demo.html    # Toast demo page
│   ├── 1.js, 2.js...      # Test JS files
│   ├── package.json       # Demo project's package.json
│   └── vite.config.ts     # Demo project's Vite config
├── package.json
├── README.md              # English documentation
└── README_zh.md           # Chinese documentation
```

## Demo Project

Run the demo project to test the plugin:

```bash
cd demo
pnpm install
pnpm dev
```

Open browser to http://localhost:5173, then:
1. Enter some text in the input fields
2. Modify `1.js`, `2.js`, etc.
3. Observe that the page doesn't refresh but code hot-updates, input values remain intact

## Notes

- This plugin only works in Vite development server (`vite serve`) mode
- Production builds do not include this plugin's logic
- Toast component is served via `/@vite-plugin-no-refresh-html/` path with ETag caching mechanism

## License

ISC
