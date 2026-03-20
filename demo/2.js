// demo/2.js - Test hot update for plain JS files
console.log('2.js loaded')

function clickMe2() {
    const msg = '2.js: clickMe2 was called!'
    window.toast?.success(msg)
    console.log(msg)
}


window.clickMe2 = clickMe2
