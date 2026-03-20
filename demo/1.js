// demo/1.js - Test hot update for plain JS files
console.log('1.js loaded')

function clickMe1() {
    const msg = '1.js: clickMe1 was called! 11'
    window.toast?.success(msg)
    console.log(msg)
}

window.clickMe1 = clickMe1
