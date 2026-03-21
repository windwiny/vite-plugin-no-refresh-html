// demo/m1.ts - Test hot update for module JS files
console.log('m1.ts loaded as module')

export function modfunc1(s: string) {
    const msg = 'module m1.ts: modfunc1 called! msg len: ' + s.length
    console.log(msg)
    window.toast?.info(msg)
    return 'msg ' + msg
}

window.modfunc1 = modfunc1
console.log('m1.ts exports modfunc1:', typeof modfunc1)
