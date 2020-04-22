import plisp from '../src/plisp.js'


var lsp = new plisp()
lsp._out = ''
lsp.logger = (val) => lsp._out += val
lsp.maxStack = 1000

test('to loop', () => {
  let res = lsp.run(`(((setvar c 0) (loop (if (< (incf c 1) 9) (print aqui) (return) ) ) ) (ctx))`)
  return res.then((res) => {
    expect(res).toEqual({ c: 10 })
  })
});

test('to loop on nested return', () => {
  let res = lsp.run(`(((setvar c 0) (loop (if (< (incf c 1) 4) (print aqui) (list (list (return) x)) ) ) ) (ctx))`)
  return res.then((res) => {
    expect(res).toEqual({ c: 5 })
  })
});

test('to nested loop count to 100', () => {
  let program = `
( 
  (setvar count 0)
  (setvar a 0)
  (loop 
    (if 
      (< (incf a 1) 10)
      (
        (setvar b 0)
        (loop 
          (if 
            (< (incf b 1) 10)
            (incf count 1)
            (return)
          )
        )
      )
      (return)
    )
  )
  (ctx)
)`
  let programStr = program.split('\n').join('')
  let res = lsp.run(programStr)
  return res.then((res) => {
    expect(res).toEqual({ count: 100, a: 11, b: 11 })
  })
});

test('to loop until max stack error', () => {
  let res = lsp.run(`(loop (print infloop))`)
  return res.then((res) => {
    //...
  }).catch((err) => {
    expect(err).toBeInstanceOf(lsp.MaxStackError)
  })
});


test('dolist', () => {
  let res = lsp.run(`((setvar res 0) (dolist (x (list 1 2 3) ) (incf res (getvar x) ) )(ctx))`)
  return res.then((res) => {
    expect(res).toEqual({ res: 6, x: '3' })
  })
});


test('proper way to nested dolist', () => {
  let program = `
( 
  (setvar c 0)
  (setvar a (list 2 2)) 
  (setvar b (list 2 2)) 
  (dolist (i (getvar a) ) 
    (dolist (j (getvar b) )
      (incf c (getvar i) (getvar j))
    )
  )
  (ctx)
)`


  let programStr = program.split('\n').join('')
  let res = lsp.run(programStr)
  return res.then((res) => {
    expect(res).toEqual({ c: 16, a: [ '2', '2' ], b: [ '2', '2' ], i: '2', j: '2' })
  })
});

test('nested dolist', () => {
  let program = `
( 
  (setvar c 0)
  (dolist (i (list 2 2) ) (dolist (j (list 2 2) ) (incf c (getvar i) (getvar j)) ) )
  (ctx)
)`

  let programStr = program.split('\n').join('')
  let res = lsp.run(programStr)
  return res.then((res) => {
    expect(res).toEqual({ c: 16, i: '2', j: '2' })
  })
});
