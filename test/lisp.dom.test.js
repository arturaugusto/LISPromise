import lisp from '../src/lisp.js'
import lispdom from '../src/lisp.dom.js'

var lsp = new lisp()
lsp.load(lispdom)

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

test('nested elements', () => {
  let res = lsp.run('(:span (:p) (:div (:a)) (:p))')
  return res.then((res) => {
    expect(res.outerHTML).toBe('<span><p></p><div><a></a></div><p></p></span>')
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