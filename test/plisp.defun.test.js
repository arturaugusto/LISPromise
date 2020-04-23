import plisp from '../src/plisp.js'

var lsp = new plisp()
lsp.maxStack = 1000

test('to defun and execute it', () => {
  let res = lsp.run(`((defun foo () (+ 1 1)) (foo))`)
  return res.then((res) => {
    expect(res).toEqual(2)
  })
});

test('to defun and execute it with arguments', () => {
  let res = lsp.run(`((defun foo (x) (+ (&x) 1)) (foo 3))`)
  return res.then((res) => {
    expect(res).toEqual(4)
  })
});

test('to defun and execute it with arguments dont change golbal', () => {
  let res = lsp.run(`((setvar x 8)(defun foo (x) ((setvar bla 123)(+ (&x) 1))) (foo 3) (&x))`)
  return res.then((res) => {
    expect(res).toEqual('8')
  })
});

test('to defun factorial', () => {
  let res = lsp.run(`(
      (defun factorial (n) 
        (
          (setvar res (f 1))
          (setvar count (f 1))
          (setvar n (f (&n)))
          (loop 
            (if
              (< (incf count 1) (&n))
              (setvar res (* (&count) (&res)))
              (return)
            )
          )
          (&res)
        )
      )
      
      (float
        (factorial 0)
        (factorial 1)
        (factorial 5)
        (factorial 10)
      )
      
    )`)
  return res.then((res) => {
    expect(res).toEqual([ 1, 1, 120, 3628800 ])
  })
});
