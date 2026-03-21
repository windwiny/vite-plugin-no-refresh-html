// demo/4.ts - Test hot update for TS files
console.log('4.ts loaded 4')

function func4(msg: string) {
    const msg2 = '4.ts: func4  msg len: ' + msg.length
    window.toast?.info(msg2)
    console.log(msg2)
    return 'func4 result: ' + msg2
}

window.func4 = func4
