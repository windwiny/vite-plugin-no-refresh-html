// demo/5.ts - Test hot update for TS files
console.log('5.ts loaded')

function func4(msg: string) {
    const msg2 = '4.ts: func4  msg len: ' + msg.length
    window.toast?.info(msg2)
    console.log(msg2)
    return 'func4 result: ' + msg2
}

window.func4 = func4
