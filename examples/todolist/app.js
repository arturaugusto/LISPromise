import wlisp from '../../src/wlisp.js'
var lsp = new wlisp()
document.getElementById('root')
  .addEventListener('click', (e) => lsp.fromNode(e.target, 'lisp'))
