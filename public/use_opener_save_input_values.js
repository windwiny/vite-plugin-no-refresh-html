// use Opener window save input/select/textarea value

function getFromOpener(url) {
    const op = window.opener;
    if (!op || op === window) {
        return;
    }

    if (!url) {
        url = window.location.href;
    }

    window._vposi_lastupdate = Date.now();
    console.debug(` cli getFromOpener url: ${url}`);
    op.postMessage({
        type: "get",
        url: url,
    }, "*");
}

function saveToOpener() {
    const op = window.opener;
    if (!op || op === window) {
        return;
    }

    const input_values = [];
    const tas = document.querySelectorAll("textarea");
    tas.forEach((x) => {
        input_values.push({
            tag: "textarea",
            name: x.name,
            id: x.id,
            value: x.value,
        });
    });

    const selects = document.querySelectorAll("select");
    selects.forEach((x) => {
        input_values.push({
            tag: "select",
            name: x.name,
            id: x.id,
            value: x.options[x.selectedIndex].text,
        });
    });

    const inputs = document.querySelectorAll("input");
    inputs.forEach((x) => {
        let vv
        if (x.type === "checkbox" || x.type === "radio") {
            vv = x.checked;
        } else {
            vv = x.value;
        }
        input_values.push({
            tag: "input",
            type: x.type,
            name: x.name,
            id: x.id,
            value: vv,
        });
    });

    console.debug(` cli saveToOpener data: `, input_values);
    op.postMessage({
        type: "save",
        url: window.location.href,
        input_values,
    }, "*");
}

function restoreInputValues(input_values) {
    const no_used = {};
    input_values.forEach((v) => {
        if (!v.id) {
            no_used[v.name] ??= [];
            no_used[v.name].push(v);
            return
        }

        const el = document.getElementById(v.id);
        if (!el) {
            console.warn(` [restore] id "${v.id}" not found`);
            return;
        }

        if (v.tag === "textarea") {
            el.value = v.value;
            console.debug(` [restore] textarea#${v.id} value len: ${v.value.length}`);
        } else if (v.tag === "select") {
            const i = Array.from(el.options).findIndex((y) => y.text === v.value);
            el.selectedIndex = i >= 0 ? i : 0;
            console.debug(` [restore] select#${v.id} index: ${i}`);
        } else if (v.tag === "input") {
            if (v.type === "checkbox" || v.type === "radio") {
                el.checked = v.value;
                console.debug(` [restore] input#${v.id} checked: ${v.value}`);
            } else {
                el.value = v.value;
                console.debug(` [restore] input#${v.id} value len: ${v.value.length}`);
            }
        } else {
            console.warn(` [restore] tag "${v.tag}" not support`);
        }
    });

    Object.entries(no_used).forEach(([name, vs]) => {
        const els = document.querySelectorAll(`input[name="${name}"]`);
        if (els.length === 0) {
            console.warn(` [restore] name "${name}" not found`);
            return;
        }

        els.forEach((el, idx) => {
            const v = vs[idx]?.value ?? "";
            if (v != undefined) {
                if (el.type === "checkbox" || el.type === "radio") {
                    el.checked = v;
                    console.debug(` [restore] input name:${el.name} checked: ${v}`);
                } else {
                    el.value = v;
                    console.debug(` [restore] input name:${el.name} value len: ${v.length}`);
                }
            }
        });
    });
}

var _vite_plugin_opener_save_input;
_vite_plugin_opener_save_input ??= new Map();

window.addEventListener("message", (e) => {
    if (!e.data) {
        return;
    }

    console.debug(`get message`, e);

    if (e.data.type === "get") {
        let input_values = _vite_plugin_opener_save_input.get(e.source);
        let ll;
        if (!input_values) {
            const ss = Array.from(_vite_plugin_opener_save_input).filter(([k, v]) => k.location.href === e.data.url);
            if (ss.length >= 1) {
                ll = ss[0];
            }
            if (ss.length > 1) {
                for (let i = 1; i < ss.length; i++) {
                    if (ss[i][0]._vposi_lastupdate > ll[0]._vposi_lastupdate) {
                        ll = ss[i];
                    }
                }
            }
            if (ll) {
                input_values = ll[1];
            }
        }
        e.source.postMessage({
            type: "return",
            input_values: input_values ?? [],
        }, "*");
        console.debug(` message "get" `, e.data.url, ll?.[0]?._vposi_lastupdate, input_values);
    } else if (e.data.type === "save") {
        console.debug(` message "save" `, e.data.url, e.data.input_values);
        _vite_plugin_opener_save_input.set(e.source, e.data.input_values);
    } else if (e.data.type === "return") {
        console.debug(` message "return" `, e.data.input_values);
        restoreInputValues(e.data.input_values);
    } else {
        console.error(` message type "${e.data.type}" not support`);
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const divMsg = document.createElement("div");
    const divM1 = document.createElement("div");
    const btnClose = document.createElement("span");
    btnClose.innerHTML = "X";
    btnClose.style.float = "right";
    btnClose.style.cursor = "pointer";
    btnClose.style.width = "5ch";
    btnClose.style.textAlign = "center";
    btnClose.title = "close";
    btnClose.addEventListener("click", () => {
        if (int1) clearInterval(int1);
        divMsg.remove();
    })
    divM1.id = "opener_save_input_info";
    divM1.style.display = "inline-block";
    divMsg.style.border = "1px solid red";
    divMsg.appendChild(divM1);
    divMsg.appendChild(btnClose);
    document.body.insertAdjacentElement("afterbegin", divMsg);

    var int1 = setInterval(() => {
        let t1, bg, saved;
        if (window.opener) {
            t1 = "opener by \"" + window.opener.location.href + "\"";
            bg = "lightyellow";
        } else {
            t1 = "not opener, this page input values cannot auto save and restore";
            bg = "darkorange";
        }

        saved = `<table>${Array.from(_vite_plugin_opener_save_input.keys().map((w) =>
            `<tr><td>${w.location.href}</td> <td>${new Date(w._vposi_lastupdate ?? 0).toLocaleTimeString()}</td> <td>${w.closed ? 'closed' : 'open'}</td> </tr>`)
        ).join("")}
        </table>`

        divMsg.style.backgroundColor = bg;
        divM1.innerHTML = `:${new Date().getSeconds()} ,  ${t1} ,  saved pages: ${saved}`
    }, 1000)
    getFromOpener();
});

window.addEventListener("beforeunload", () => {
    saveToOpener();
});
