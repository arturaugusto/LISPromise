import wlisp from './wlisp.js'


var lsp = new wlisp()

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
  lsp.opers.get = {
    exec: (...x) => {
      return new Promise((resolve, reject) => {
        window.setTimeout(() => {
          resolve(10)
        }, 10)
      })
    }
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

test('print return null', () => {
  let res = lsp.run('(print lala)')
  return res.then((res) => {
    expect(res).toBe(null)
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


test('to run code from node property and appendChild', () => {
  document.body.innerHTML = `
<span id="root" lisp="(^ (getvar rootNode) appendChild (:div (list bla=x) (:span)))"></span>`

  let el = document.getElementById('root')
  let res = lsp.fromNode(el, 'lisp')
  return res.then((res) => {
    //console.log(el.innerHTML)
    expect(el.innerHTML).toBe('<div bla="x"><span></span></div>')
  })
});
