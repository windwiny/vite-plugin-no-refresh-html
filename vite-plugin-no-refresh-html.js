import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * @callback OnHotUpdateCallback
 * @param {object} data - any data
 * @returns {void|Promise<void>}
 */

/**
 * @typedef {Object} VitePluginNoRefreshHtmlOptions
 * @property {boolean} [injectToast] - Whether to inject toast-related links in HTML (default true)
 * @property {OnHotUpdateCallback} [onHotUpdate] - Callback executed after module hot update
 */

/**
 * @param {VitePluginNoRefreshHtmlOptions} [options]
 * @return {import('vite').Plugin}
 */
export function vitePluginNoRefreshHtml(options = {}) {
    const { injectToast = true, onHotUpdate, onHotUpdateDelay = 500, useOpenerSaveInput = true } = options;
    const hookPath = "/@vite-plugin-no-refresh-html@/client-html-hook.js";  // not same as assetPath
    const vhookPath = "\0" + hookPath;

    // Get plugin directory path (supports npm package installation scenario)
    const __dirname = path.join(path.dirname(fileURLToPath(import.meta.url)), 'public');
    const assetPath = "/@vite-plugin-no-refresh-html/"

    return {
        name: "vite-plugin-no-refresh-html",
        apply: "serve",

        configureServer(server) {
            server.middlewares.use(
                createAssetMiddleware(__dirname, assetPath)
            );
        },

        resolveId(source) {
            if (source === hookPath) {
                return vhookPath;
            }
        },

        load(id) {
            if (id === vhookPath) {
                return client_hook_js;
            }
        },

        transformIndexHtml(html, ctx) {
            console.debug(`[no-refresh-html] transformIndexHtml add hook ${ctx.originalUrl}`);
            const result = [`<script type="module" src="${hookPath}"></script>`];
            if (injectToast) {
                result.push(`<link rel="stylesheet" href="${assetPath}toast.css">
                <script src="${assetPath}toast.js"></script>`);
            }
            if (useOpenerSaveInput) {
                result.push(`<script src="${assetPath}use_opener_save_input_values.js"></script>`);
            }
            if (onHotUpdate && typeof onHotUpdate === 'function') {
                let fnstr = onHotUpdate.toString();
                /** WARN Function.prototype.toString style
                ;[
                  { ff(a) {return a.length} },
                  { ff: function(a) {return a.length} },
                  { ff: (a) => {return a.length} },
                ].forEach((x, i) => {
                    console.log('style:' + i, typeof x.ff === 'function', x.ff.toString())
                })
                style:0 true ff(a) {return a.length}
                style:1 true function(a) {return a.length}
                style:2 true (a) => {return a.length}
                */
                if (!fnstr.match(/^function\W/)) {
                    try {
                        new Function(fnstr);
                        // ok then style:2
                    } catch (error) {
                        // style:0
                        fnstr = 'function ' + fnstr;
                    }
                }
                result.push(`<script>
                  var _vite_plugin_onHotUpdateDelay = ${onHotUpdateDelay}
                  if (typeof _vite_plugin_onHotUpdateDelay === 'number') {
                    _vite_plugin_onHotUpdateDelay = 500;
                  }
                  var _vite_plugin_onHotUpdate = ${fnstr}
                </script>`);
            }
            return html + "\n" + result.join("\n");
        },

        hotUpdate(ctx) {
            if (ctx.modules.length && ctx.modules[0].environment === "client") {
                ctx.modules.forEach((module) => {
                    if (module.environment != "client") return;
                    const uu = new URL(module.url, "http://127.0.0.1");
                    const url2 = uu.pathname;

                    if (uu.searchParams.get("_vite_plugin_no_refresh_html_ver") != null) return;

                    console.debug(`>> [no-refresh-html] ${ctx.timestamp} hotUpdate pathname ${module.url}`);
                    ctx.server.ws.send({
                        event: "no-refresh-html:js",
                        type: "custom",
                        data: { url: module.url, ti: ctx.timestamp },
                    });
                });
                return [];
            }
        },
    };
}

var client_hook_js = `
// Client-side HMR hook script

if (import.meta.hot) {
    let NORH = {};
    window._vite_plugin_no_refresh_html = NORH;

    import.meta.hot.off("no-refresh-html:js");

    import.meta.hot.on("no-refresh-html:js", (data) => {
        console.debug("[no-refresh-html-client] receive no-refresh-html:js", data);

        for (let item of document.querySelectorAll("script[id]")) {
            if (item.id.startsWith("_vite_plugin_no_refresh_html_")) {
                item.remove();
                continue;
            }
        }

        const url = data?.url;
        const gjs = [];
        const mjs = [];
        const tt = new Date().valueOf();
        if (url) {
            for (let item of document.querySelectorAll("script[src]")) {
                const uu = new URL(item.src);
                if (url === uu.pathname + uu.search) {
                    if (item.type === "module") {
                        mjs.push(url);
                    } else {
                        gjs.push(url);
                    }
                }
            }
            NORH[url] ??= 0;
            NORH[url]++;
        }

        let ii = 0;
        gjs.forEach((url) => {
            const msg = "  js src reload " + url
            console.debug(msg);
            window.toast?.success(msg);
            const ss = document.createElement("script");
            ss.src = url;
            ss.id = "_vite_plugin_no_refresh_html_" + tt + "_" + ii++;
            document.body.appendChild(ss);
            NORH[url + "_g"] ??= 0;
            NORH[url + "_g"]++;
        });
        mjs.forEach((url) => {
            const uu = new URL(url, "http://127.0.0.1");
            uu.searchParams.set("_vite_plugin_no_refresh_html_ver", tt);
            const url2 = uu.pathname + uu.search;
            if (uu.searchParams.has("html-proxy") && uu.searchParams.has("index")) {
                // TODO FIXME  skip, script type=module in html vite generated js
                const msg = "  SKIP " + url
                console.debug(msg);
                return;
            }
            const msg = "  module js reimport " + url2
            console.debug(msg);
            window.toast?.success(msg);

            const ss = document.createElement("script");
            ss.type = "module";
            ss.innerHTML = 'import * as xx from "' + url2 + '"';
            ss.id = "_vite_plugin_no_refresh_html_" + tt + "_" + ii++;
            document.body.appendChild(ss);
            NORH[url + "_m"] ??= 0;
            NORH[url + "_m"]++;
        });
        if (window._vite_plugin_onHotUpdate && (gjs.length || mjs.length)) {
            setTimeout(() => {
                window._vite_plugin_onHotUpdate({
                    gjs: gjs.join(', '),
                    mjs: mjs.join(', '),
                    timestamp: tt,
                });
            }, window._vite_plugin_onHotUpdateDelay);
        }
    });

    console.debug("[no-refresh-html-client] ", import.meta.hot);
}
`;


/**
 * Create static file serving middleware (with ETag caching)
 * @param {string} dir - Directory to serve files from
 * @param {string} urlPrefix - URL prefix for matching requests
 */
function createAssetMiddleware(dir, urlPrefix) {
    const generateETag = (stats) => {
        return `"${stats.mtimeMs}-${stats.size}"`;
    };

    const contentTypes = {
        ".js": "application/javascript",
        ".mjs": "application/javascript",
        ".cjs": "application/javascript",
        ".css": "text/css",
        ".json": "application/json",
        ".txt": "text/plain",
    };

    return (req, res, next) => {
        const url = req.url;

        if (!url.startsWith(urlPrefix)) {
            next();
            return;
        }

        const filename = url.slice(urlPrefix.length);
        const filePath = path.join(dir, filename);

        // Security check: ensure file is within the specified directory
        const normalizedPath = path.normalize(filePath);
        if (!normalizedPath.startsWith(dir)) {
            res.statusCode = 403;
            res.end("Forbidden");
            return;
        }

        if (!fs.existsSync(filePath)) {
            next();
            return;
        }

        const stats = fs.statSync(filePath);
        const etag = generateETag(stats);
        const ifNoneMatch = req.headers["if-none-match"];

        // Check if client cache is valid
        if (ifNoneMatch === etag) {
            console.debug(`[no-refresh-html] 304 Not Modified: ${filename}`);
            res.statusCode = 304;
            res.end();
            return;
        }

        // Read file from disk on each request to avoid memory usage
        const content = fs.readFileSync(filePath);
        const ext = path.extname(filename).toLowerCase();
        const contentType = contentTypes[ext] || "application/octet-stream";

        res.setHeader("Content-Type", contentType);
        res.setHeader("ETag", etag);
        res.setHeader("Cache-Control", "public, max-age=31536000");
        res.end(content);
    };
}

export default vitePluginNoRefreshHtml
