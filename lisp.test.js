import lisp from './lisp.js'


var lsp = new lisp()
lsp._out = ''
lsp.logger = (val) => lsp._out += val
lsp.maxStack = 1000

test('lisp 1 + 1 to equal 2', () => {
  let res = lsp.run('(+ 1 1)')
  return res.then((res) => {
    expect(res).toBe(2)
  })
});

test('nested unformated lisp to correct value', () => {
  let res = lsp.run('(  - 20 (+ 1 (* 3 3 ) 2))')
  return res.then((res) => {
    //expect(res).toBe(2)
    expect(res).toBe(8)
  })
});

test('async functions', () => {
  // set a async lisp function
  lsp.opers.get = (...x) => {
    return new Promise((resolve, reject) => {
      window.setTimeout(() => {
        resolve(10)
      }, 10)
    })
  }
  

  let res = lsp.run('(+ 1 (get))')
  return res.then((res) => {
    expect(res).toBe(11)
  })
});

test('created element to be span', () => {
  let res = lsp.run('(:span)')
  return res.then((res) => {
    expect(res.constructor).toBe(HTMLSpanElement)
  })
});

test('created element to be span with properties', () => {
  let res = lsp.run('(:span (list a=1))')
  return res.then((res) => {
    expect(res.outerHTML).toBe('<span a="1"></span>')
  })
});

test('created nested element with multiple properties and trailing =', () => {
  let res = lsp.run('(:span (list a=1) (:div (list x==2 y=abc)))')
  return res.then((res) => {
    //console.log(res.outerHTML)
    expect(res.outerHTML).toBe('<span a="1"><div x="=2" y="abc"></div></span>')
  })
});

test('NotFoundException when try to create unknow element', () => {
  let res = lsp.run('(xxx)')
  return res.then((res) => {
    //..
  }).catch((res) => {
    expect(res.name).toBe('NotFoundException')
  })
});

test('nested elements', () => {
  let res = lsp.run('(:span (:p) (:div (:a)) (:p))')
  return res.then((res) => {
    expect(res.outerHTML).toBe('<span><p></p><div><a></a></div><p></p></span>')
  })
});

test('to be neste lists', () => {
  let res = lsp.run('(list 1 2 3 (list a b c))')
  return res.then((res) => {
    expect(res).toEqual([ '1', '2', '3', [ 'a', 'b', 'c' ] ])    
  })
});

test('to float list', () => {
  let res = lsp.run('(float 3 4 5)')
  return res.then((res) => {
    expect(res).toEqual([3, 4, 5])
  })
});

test('if letter character to be true', () => {
  let res = lsp.run('(if a 1 2)')
  return res.then((res) => {
    expect(res).toEqual('1')
  })
});

test('if zero character to be false', () => {
  let res = lsp.run('(if 0 1 2)')
  return res.then((res) => {
    expect(res).toEqual('2')
  })
});

test('if non zero character to be true', () => {
  let res = lsp.run('(if 1 1 2)')
  return res.then((res) => {
    expect(res).toEqual('1')
  })
});

test('if false without else to be null', () => {
  let res = lsp.run('(if 0 1)')
  return res.then((res) => {
    expect(res).toBe(null)
  })
});

test('if true without else to be the value', () => {
  let res = lsp.run('(if 1 1)')
  return res.then((res) => {
    expect(res).toBe('1')
  })
});

test('if true without else to be the value', () => {
  let res = lsp.run('(if 1 1)')
  return res.then((res) => {
    expect(res).toBe('1')
  })
});

test('to evaluate the true condition', () => {
  let res = lsp.run('(ctx (if (+ 0 1) (setvar a 1) (setvar b 2)))')
  return res.then((res) => {
    expect(res).toEqual({a: '1'})
  })
});

test('to evaluate the else', () => {
  let res = lsp.run('(ctx (if (- 1 1) (setvar a 1) (setvar b 2)))')
  return res.then((res) => {
    expect(res).toEqual({b: '2'})
  })
});

test('to bool true', () => {
  let res = lsp.run('(bool 1)')
  return res.then((res) => {
    expect(res).toBe(true)
  })
});

test('to bool false', () => {
  let res = lsp.run('(bool 0)')
  return res.then((res) => {
    expect(res).toBe(false)
  })
});

test('to bool bool type true', () => {
  let res = lsp.run('(bool (= 1 1))')
  return res.then((res) => {
    expect(res).toBe(true)
  })
});

test('to bool bool type false', () => {
  let res = lsp.run('(bool (= 1 2))')
  return res.then((res) => {
    expect(res).toBe(false)
  })
});

test('print return null and out text', () => {
  let res = lsp.run('(print lala)')
  return res.then((res) => {
    expect(res).toBe(null)
    expect(lsp._out).toBe('lala')
  })
});

test('setvar be the value to x and return ctx', () => {
  let res = lsp.run('(ctx (setvar x val))')
  return res.then((res) => {
    //console.log(res)
    expect(res).toEqual({x: 'val'})
  })
});

test('dont polute ctx', () => {
  let p1 = lsp.run('(ctx (setvar x val))')
  return p1.then((res) => {
    expect(res).toEqual({x: 'val'})
    return lsp.run('(ctx (setvar y otherval))')
  }).then((res) => {
    expect(res).toEqual({y: 'otherval'})
  })
});

test('set array', () => {
  let res = lsp.run('(ctx (setvar x (list 1 2 3)))')
  return res.then((res) => {
    //console.log(res)
    expect(res).toEqual({x: ['1', '2', '3']})
  })
});

test('get the var', () => {
  let res = lsp.run('(getvar x (setvar x 123))')
  return res.then((res) => {
    //console.log(res)
    expect(res).toBe('123')
  })
});

test('get undefined var return null', () => {
  let res = lsp.run('(getvar y (setvar x 123))')
  return res.then((res) => {
    //console.log(res)
    expect(res).toBe(null)
  })
});

test('to run code like `el.appendChild(document.createElement("span"))`', () => {
  document.body.innerHTML = `
<span id="root" lisp="(^ (getvar rootNode) appendChild (:div (list bla=x) (:span)))"></span>`

  let el = document.getElementById('root')
  let res = lsp.fromNode(el, 'lisp')
  return res.then((res) => {
    expect(res.constructor).toBe(HTMLDivElement)
    expect(el.innerHTML).toBe('<div bla="x"><span></span></div>')
  })
});

test('to run code from node property and remove `el.remove()`', () => {
  document.body.innerHTML = `
<div><span id="root" lisp="(^ (getvar rootNode) remove)"></span></div>`

  let el = document.getElementById('root')
  let res = lsp.fromNode(el, 'lisp')
  return res.then((res) => {
    expect(res).toBe(undefined)
    expect(document.body.innerHTML).toBe('\n<div></div>')
  })
});

test('to run code from node and get parent node `el.parentNode`', () => {
  document.body.innerHTML = `
<div><span id="root" lisp="(^ (getvar rootNode) parentNode)"></span></div>`

  let el = document.getElementById('root')
  let res = lsp.fromNode(el, 'lisp')
  return res.then((res) => {
    expect(res.outerHTML).toBe('<div><span id="root" lisp="(^ (getvar rootNode) parentNode)"></span></div>')
    expect(document.body.innerHTML).toBe('\n<div><span id="root" lisp="(^ (getvar rootNode) parentNode)"></span></div>')
  })
});

test('true to be equal', () => {
  let res = lsp.run('(= 1 1)')
  return res.then((res) => {
    expect(res).toBe(true)
  })
});

test('true to be equal multiple', () => {
  let res = lsp.run('(= 1 1 1)')
  return res.then((res) => {
    expect(res).toBe(true)
  })
});

test('false to be equal multiple', () => {
  let res = lsp.run('(= 1 1 2)')
  return res.then((res) => {
    expect(res).toBe(false)
  })
});

test('true to be >', () => {
  let res = lsp.run('(> 2 1 0)')
  return res.then((res) => {
    expect(res).toBe(true)
  })
});

test('false to be <', () => {
  let res = lsp.run('(< 1 1 2)')
  return res.then((res) => {
    expect(res).toBe(false)
  })
});

test('true to be <=', () => {
  let res = lsp.run('(<= 1 1 1)')
  return res.then((res) => {
    expect(res).toBe(true)
  })
});

test('false to be <=', () => {
  let res = lsp.run('(<= 2 1 2)')
  return res.then((res) => {
    expect(res).toBe(false)
  })
});

test('true to be >=', () => {
  let res = lsp.run('(>= 3 2 1)')
  return res.then((res) => {
    expect(res).toBe(true)
  })
});

test('true to be >= two itens', () => {
  let res = lsp.run('(>= 3 2)')
  return res.then((res) => {
    expect(res).toBe(true)
  })
});

test('false to be >=', () => {
  let res = lsp.run('(>= 1 2 1)')
  return res.then((res) => {
    expect(res).toBe(false)
  })
});

test('true to be /=', () => {
  let res = lsp.run('(/= 1 2)')
  return res.then((res) => {
    expect(res).toBe(true)
  })
});

test('false to be /=', () => {
  let res = lsp.run('(/= 2 2)')
  return res.then((res) => {
    expect(res).toBe(false)
  })
});

test('false to be all different', () => {
  let res = lsp.run('(/= 2 1 2)')
  return res.then((res) => {
    expect(res).toBe(false)
  })
});

test('true to be all different', () => {
  let res = lsp.run('(/= 1 2 3)')
  return res.then((res) => {
    expect(res).toBe(true)
  })
});

test('true to be all combinations', () => {
  let res = lsp.run('(combine 1 2 3)')
  return res.then((res) => {
    expect(res).toEqual([ [ '1', '2' ], [ '1', '3' ], [ '2', '3' ] ])
  })
});

test('true to be the combination', () => {
  let res = lsp.run('(combine 1 2)')
  return res.then((res) => {
    expect(res).toEqual([ [ '1', '2' ] ])
  })
});

test('to run multiple', () => {
  let res = lsp.run(`(ctx (run (setvar x a)(setvar y b)))`)
  return res.then((res) => {
    expect(res).toEqual({'x': 'a', 'y': 'b'})
  })
});

test('to run multiple without run', () => {
  let res = lsp.run(`(ctx ( (setvar x a) (setvar y b) ) )`)
  return res.then((res) => {
    expect(res).toEqual({'x': 'a', 'y': 'b'})
  })
});


test('to incf', () => {
  let res = lsp.run(`(ctx (run (setvar x 1) (incf x 2)))`)
  return res.then((res) => {
    expect(res).toEqual({'x': 3})
  })
});

test('to incf non existing var returning NaN', () => {
  let res = lsp.run(`(ctx (run (incf x 2)))`)
  return res.then((res) => {
    expect(res).toEqual({'x': NaN})
  })
});

test('to incf return its before value', () => {
  let res = lsp.run(`(ctx (run (setvar x 0) (setvar y (incf x 1)) ))`)
  return res.then((res) => {
    expect(res).toEqual({ x: 1, y: 0 })
  })
});

test('to set r false', () => {
  let res = lsp.run(`(ctx (run (setvar x 0) (setvar r (< (getvar x (incf x 5)) 5))))`)
  return res.then((res) => {
    expect(res).toEqual({ x: 5, r: false })
  })
});

test('to loop', () => {
  let res = lsp.run(`(ctx (run (setvar c 0) (loop (if (< (incf c 1) 9) (print aqui) (return) ) ) ) )`)
  return res.then((res) => {
    expect(res).toEqual({ c: 10 })
  })
});

test('to loop on nested return', () => {
  let res = lsp.run(`(ctx (run (setvar c 0) (loop (if (< (incf c 1) 4) (print aqui) (list (list (return) x)) ) ) ) )`)
  return res.then((res) => {
    expect(res).toEqual({ c: 5 })
  })
});

test('to nested loop count to 100', () => {
  let program = `
(ctx 
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
    console.log(lsp._out)
    expect(err).toBeInstanceOf(lsp.MaxStackError)
  })
});

test.only('sleep the specified time', () => {
  let ini = Date.now()
  let res = lsp.run(`((sleep 50) (setvar x ok))`)
  return res.then((res) => {
    expect(Date.now() - ini).toBeGreaterThanOrEqual(50)
  })
});
