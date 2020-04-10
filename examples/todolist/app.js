import wlisp from '../../wlisp.js'
var lsp = new wlisp()
//var x = lsp.run('(print lala)')
document.getElementById('root')
  .addEventListener('click', (e) => lsp.fromNode(e.target, 'lisp'))
