// demo/3.tsx - Test hot update for TSX files
console.log('3.tsx loaded')

interface J {
    v: number
    s: string
}
function clickMe3(): J {
    const msg = '3.tsx: clickMe3 was called!'
    window.toast?.success(msg)
    console.log(msg)
    return { v: 3, s: '3.tsx result' }
}

window.clickMe3 = clickMe3
