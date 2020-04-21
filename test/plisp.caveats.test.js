import plisp from '../src/plisp.js'

var lsp = new plisp()

test('parallel operations sharing same context', () => {
  /**
  As Promise.all can run in parallel sharing the same context, 
  at this example the (getvar a) can't get the (list 2 2) from a, seting
  c to null.
  */
  let res = lsp.run(`(
    (
      (setvar a (list 2 2))
      (setvar c (getvar a))
    )
    (ctx)
)`)
  return res.then((res) => {
    expect(res).toEqual({ a: [ '2', '2' ], c: null })
  })
});


test('operations sharing same context with promise chain', () => {
  var ctx = {}
  return lsp.run('(setvar a (list 2 2))', ctx).then(() => {
    return lsp.run('(setvar c (getvar a))', ctx)
  }).then(() => {
    return lsp.run('(ctx)', ctx)
  }).then((res) => {
    expect(res).toEqual({ a: [ '2', '2' ], c: [ '2', '2' ] })
  })
});

test('operations line by line', () => {
  let res = lsp.run(`(
  (setvar a (list 2 2))
  (setvar c (getvar a))
  (ctx)
)`)
  return res.then((res) => {
    expect(res).toEqual({ a: [ '2', '2' ], c: [ '2', '2' ] })
  })
});
