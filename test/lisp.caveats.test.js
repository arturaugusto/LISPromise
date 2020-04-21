import lisp from '../src/lisp.js'

var lsp = new lisp()


test('parallel operations sharing same context', () => {
  /**
  As Promise.all can run in parallel sharing the same context, 
  at this example the (getvar a) can't get the (list 2 2) from a, seting
  c to null.
  */
  let res = lsp.run(`(ctx (setvar a (list 2 2))(setvar c (getvar a)))`)
  return res.then((res) => {
    expect(res).toEqual({ a: [ '2', '2' ], c: null })
  })
});