const wlisp = function() {

  var isArray = (arg) => arg.constructor === Array;
  var isPromise = (arg) => arg.constructor === Promise;

  this.parse = function(expr) {
    return JSON.parse(expr
      .replace(/\(/g, ' __LBRACKETS__ ')
      .replace(/\)/g, ' __RBRACKETS__ ')
      .trim()
      .split(' ')
      .filter((x) => x.length)
      .map((x) => '"'+x+'"')
      .toString()
      .replace(/"__LBRACKETS__",/g, '[')
      .replace(/,"__RBRACKETS__"/g, ']')
    )
  }
  
  this.opers = {
    '^':  {exec: function(...x) {return x[0][x[1]](x[2])}},
    'getvar':  {exec: function(...x) {return this[x[0]] || null}},
    'ctx':  {exec: function(...x) {return this}},
    'setvar':  {exec: function(...x) {return this[x[0]] = x[1]}},
    'if':  {exec: (...x) => isNaN(parseFloat(x[0])) || !!parseFloat(x[0]) ? x[1] : x[2] || null},
    'print':  {exec: (...x) => console.log(x) || null},
    '+':    {exec: (...x) => x.map(v => parseFloat(v)).reduce((a, c) => a + c, 0)},
    'float':    {exec: (...x) => x.map(v => parseFloat(v))},    
    '-':    {exec: (...x) => x.map(v => parseFloat(v)).reduce((a, c) => a - c)},
    '*':    {exec: (...x) => x.map(v => parseFloat(v)).reduce((a, c) => a * c, 1)},
    '/':    {exec: (...x) => x.map(v => parseFloat(v)).reduce((a, c) => a / c)},
    'list':    {exec: (...x) => x},
    ':': {
      exec: (...x) => {
        let el = document.createElement(x[0])
        let props = x.slice(1)
        for (var i = 0; i < props.length; i++) {

          // detect html elements
          if (!isArray(props[i])) {
            el.appendChild(props[i])
            continue
          } else {
            // expect props[i] to be an array with name=prop
            // eg: ['value=abc'], ['id=123']]
            for (var j = 0; j < props[i].length; j++) {
              let nameVal = props[i][j]
              let index = nameVal.indexOf('=')
              let name = nameVal.slice(0, index)
              let val = nameVal.slice(index+1)
              el.setAttribute(name, val)
            }
          }
        }
        return el
      }
    }
  };

  /*'create_element': {exec: (...x) => Array.from(x
    .reduce((a, c) => a.appendChild(document.createElement(c))
      .parentElement, document.createElement('span')).children)
  }*/

  this.NotFoundException = function(message) {
     this.message = message;
     this.name = "NotFoundException";
  };

  this.run = (expr, ctx) => {
    const exprArr = isArray(expr) ? expr : this.parse(expr)
    return this.eval(exprArr, ctx)
  }

  this.eval = (expr, ctx) => {
    ctx = ctx || {}

    if (isArray(expr)) {
      let operName = expr[0];
      let args = expr.slice(1).map((val) => this.eval(val, ctx));
      return Promise.all(args).then((values) => {
        // look for a registered function
        let oper = this.opers[operName];

        if (oper) {
          return oper.exec.apply(ctx, values);
        }

        // node creation prefix char
        if (operName[0] === ':') {
          let oper = this.opers[operName[0]];
          return oper.exec.apply(ctx, [operName.slice(1)].concat(values));
        }

        throw new this.NotFoundException(`${operName}`);
        
      })      
    } else {
      return expr;
    }
  };

  this.fromNode = (node, attributeName) => {
    return this.run(node.getAttribute(attributeName), {rootNode: node})
  };

}

export default wlisp