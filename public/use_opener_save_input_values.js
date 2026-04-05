// use Opener window save input and textarea value

function getFromOpener() {
    const op = window.opener;
    if (!op || op === window) {
        return;
    }

    console.debug(` cli getFromOpener url: ${window.location.href}`);
    op.postMessage({
        type: "get",
        url: window.location.href,
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
_vite_plugin_opener_save_input ??= {};

window.addEventListener("message", (e) => {
    if (!e.data) {
        return;
    }

    if (e.data.type === "get") {
        const input_values = _vite_plugin_opener_save_input[e.data.url] ?? [];
        e.source.postMessage({
            type: "return",
            input_values,
        }, "*");
        console.debug(` message "get" `, e.data.url, input_values);
    } else if (e.data.type === "save") {
        console.debug(` message "save" `, e.data.url, e.data.input_values);
        _vite_plugin_opener_save_input[e.data.url] = e.data.input_values;
    } else if (e.data.type === "return") {
        console.debug(` message "return" `, e.data.input_values);
        restoreInputValues(e.data.input_values);
    } else {
        console.error(` message type "${e.data.type}" not support`);
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const d = document.createElement("div");
    d.id = "opener_save_input_info";
    d.style.border = "1px solid red";
    document.body.insertAdjacentElement("afterbegin", d);
    setInterval(() => {
        const t = window.opener ? "OPENER:" + window.opener.location.href : "NOT HAVE OPENER, this page input values cannot auto save and restore"
        const bg = window.opener ? 'lightyellow' : 'orange'
        d.title = t;
        d.style.backgroundColor = bg;
        d.innerHTML = `:${new Date().getSeconds()} ,    saved pages:[ ${Object.keys(_vite_plugin_opener_save_input).join(",")} ]`
    }, 1000)
    getFromOpener();
});

window.addEventListener("beforeunload", () => {
    saveToOpener();
});
