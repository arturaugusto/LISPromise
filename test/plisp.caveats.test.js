import plisp from '../src/plisp.js'

var lsp = new plisp()

test('parallel operations sharing same context', () => {
  /**
  As Promise.all run in parallel sharing the same context, 
  at this example the (getvar a) can't get the (list 2 2) from a, seting
  c to null.
  */
  let res = lsp.run(`(
    (parallel
      (setvar a (list 2 2))
      (setvar c (getvar a))
    )
    (ctx)
)`)
  return res.then((res) => {
    expect(res).toEqual({ a: [ '2', '2' ], c: null })
  })
});


test('serial operations sharing same context', () => {
  let res = lsp.run(`(
    (
      (setvar a (list 2 2))
      (setvar c (getvar a))
    )
    (ctx)
)`)
  return res.then((res) => {
    expect(res).toEqual({ a: [ '2', '2' ], c: [ '2', '2' ] })
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

test('get 123 because its serial', () => {
  let res = lsp.run('(((setvar x 123)(setvar y 123)(&x)))')
  return res.then((res) => {
    expect(res).toBe('123')
  })
});

/*
test('get null, because of ...', () => {
  let res = lsp.run('((... (setvar x 123) (&x)))')
  return res.then((res) => {
    //console.log(res)
    expect(res).toBe(null)
  })
});
*/