import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/**
 * @callback OnHotUpdateCallback
 * @param {object} data - any data
 * @returns {void|Promise<void>}
 */

/**
 * @typedef {Object} VitePluginNCNHOptions
 * @property {boolean} [injectToast] - Whether to inject toast-related links in HTML (default true)
 * @property {OnHotUpdateCallback} [onHotUpdate] - Callback executed after module hot update
 */

/**
 * @param {VitePluginNCNHOptions} [options]
 * @return {import('vite').Plugin}
 */
export function vitePluginNCNH(options = {}) {
    const { injectToast = true, onHotUpdate } = options;
    const hookPath = "/@vite-plugin-ncnh/client-html-hook.js";
    const vhookPath = "\0" + hookPath;

    // Get plugin directory path (supports npm package installation scenario)
    const __dirname = path.join(path.dirname(fileURLToPath(import.meta.url)), 'public');
    const otherPath = "/@vite-plugin-ncnh/"

    return {
        name: "vite-plugin-NCNH-nomodulejs-change-norefresh-html",
        apply: "serve",

        configureServer(server) {
            server.middlewares.use(
                createAssetMiddleware(__dirname, otherPath)
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
            console.debug(`[vite-plugin-NCNH] transformIndexHtml add hook ${ctx.originalUrl}`);
            let result = `<script type="module" src="${hookPath}" vite=ignore></script>`;
            if (injectToast) {
                result += `<link rel="stylesheet" href="${otherPath}toast.css" vite=ignore>
                <script src="${otherPath}toast.js" vite=ignore></script>`;
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
                        eval(fnstr);
                        // ok then style:2
                    } catch (error) {
                        // style:0
                        fnstr = 'function ' + fnstr;
                    }
                }
                result += `\n<script vite=ignore>\n  var _vite_plugin_onHotUpdate = ${fnstr}
                </script>`;
            }
            return html + result;
        },

        hotUpdate(ctx) {
            if (ctx.modules.length && ctx.modules[0].environment === "client") {
                ctx.modules.forEach((module) => {
                    if (module.environment != "client") return;
                    const uu = new URL(module.url, "http://127.0.0.1");
                    const url2 = uu.pathname;

                    if (uu.searchParams.get("_vite_plugin_ncnh_ver") != null) return;

                    console.debug(`>> [vite-plugin-NCNH] ${ctx.timestamp} hotUpdate pathname ${module.url}`);
                    ctx.server.ws.send({
                        event: "ncnh:js",
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
    let NCNH = {};
    window._vite_plugin_ncnh = NCNH;

    import.meta.hot.off("ncnh:js");

    import.meta.hot.on("ncnh:js", (data) => {
        console.debug("[ncnh-client] receive ncnh:js", data);

        for (let item of document.querySelectorAll("script[id]")) {
            if (item.id.startsWith("_vite_plugin_ncnh_")) {
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
            NCNH[url] ??= 0;
            NCNH[url]++;
        }

        let ii = 0;
        gjs.forEach((url) => {
            const ss = document.createElement("script");
            ss.src = url;
            ss.id = "_vite_plugin_ncnh_" + tt + "_" + ii++;
            document.body.appendChild(ss);
            const msg = "  js src reload " + url
            console.debug(msg);
            window.toast?.success(msg);
            NCNH[url + "_g"] ??= 0;
            NCNH[url + "_g"]++;
        });
        mjs.forEach((url) => {
            const uu = new URL(url, "http://127.0.0.1");
            uu.searchParams.set("_vite_plugin_ncnh_ver", tt);
            const url2 = uu.pathname + uu.search;

            const ss = document.createElement("script");
            ss.type = "module";
            ss.innerHTML = 'import * as xx from "' + url2 + '"';
            ss.id = "_vite_plugin_ncnh_" + tt + "_" + ii++;
            document.body.appendChild(ss);
            const msg = "  module js reimport " + url2
            console.debug(msg);
            window.toast?.success(msg);
            NCNH[url + "_m"] ??= 0;
            NCNH[url + "_m"]++;
        });
        if (window._vite_plugin_onHotUpdate && (gjs.length || mjs.length)) {
            window._vite_plugin_onHotUpdate({
                gjs: gjs.join(', '),
                mjs: mjs.join(', '),
                timestamp: tt,
            });
        }
    });

    console.debug("[ncnh-client] ", import.meta.hot);
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
            console.debug(`[vite-plugin-NCNH] 304 Not Modified: ${filename}`);
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
