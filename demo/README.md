# vite-plugin-no-refresh-html Demo

This is the demo project for the vite-plugin-no-refresh-html plugin.

## Quick Start

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

## Testing

1. Open browser to http://localhost:5173
2. Enter some text in the input fields
3. Modify `1.js`, `2.js`, `3.tsx`, or `5.ts` files
4. Observe: The page won't refresh, but code will hot-update, and input values remain intact

## Files

- `index.html` - Main page, references multiple JS/TS files
- `1.js`, `2.js` - Plain JS files (referenced via `<script>` tags)
- `3.tsx`, `5.ts` - TypeScript files
- `m1.ts` - ES Module file (referenced via `<script type="module">`)
- `toast-demo.html` - Toast component demo page

## Plugin Configuration

Edit `vite.config.ts` to modify plugin options:

```js
import { vitePluginNoRefreshHtml } from '../vite-plugin-no-refresh-html.js'

export default defineConfig({
    plugins: [
        vitePluginNoRefreshHtml({
            injectToast: true  // Whether to inject Toast component
        }),
    ],
})
```
