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
    '^': function(...x) {
      let node = x[0]
      let operationName = x[1]
      let argument = x[2]
      let operation = node[operationName]      
      if (typeof operation === 'function') {
        return operation.call(node, argument)
      }
      return operation
    },
    'combine': (...x) => {
      return x.flatMap(
          (v, i) => x.slice(i+1).map( w => [v, w] )
      );
    },
    '/=': (...x) => {
      if (x.length === 2) return x[0] !== x[1]
      let c = this.opers.combine.apply(this, x)
      for (var i = 0; i < c.length-1; i++) {if (c[i][0] === c[i+1][1]) return false}
      return true
    },
    '=': (...x) => {
      for (var i = 0; i < x.length-1; i++) {if (x[i] !== x[i+1]) return false}
      return true
    },
    '<': (...x) => {
      for (var i = 0; i < x.length-1; i++) {if (x[i] >= x[i+1]) return false}
      return true
    },
    '>': (...x) => {
      for (var i = 0; i < x.length-1; i++) {if (x[i] <= x[i+1]) return false}
      return true
    },
    '<=': (...x) => {
      for (var i = 0; i < x.length-1; i++) {if (x[i] > x[i+1]) return false}
      return true
    },
    '>=': (...x) => {
      for (var i = 0; i < x.length-1; i++) {if (x[i] < x[i+1]) return false}
      return true
    },
    'getvar': function(...x) {return this[x[0]] || null},
    'ctx': function(...x) {return this},
    'setvar': function(...x) {return this[x[0]] = x[1]},
    'if': (...x) => isNaN(parseFloat(x[0])) || !!parseFloat(x[0]) ? x[1] : x[2] || null,
    'print': (...x) => console.log(x) || null,
    '+': (...x) => x.map(v => parseFloat(v)).reduce((a, c) => a + c, 0),
    'float': (...x) => x.map(v => parseFloat(v)),   
    '-': (...x) => x.map(v => parseFloat(v)).reduce((a, c) => a - c),
    '*': (...x) => x.map(v => parseFloat(v)).reduce((a, c) => a * c, 1),
    '/': (...x) => x.map(v => parseFloat(v)).reduce((a, c) => a / c),
    'list': (...x) => x,
    ':': (...x) => {
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
  };

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
          return oper.apply(ctx, values);
        }

        // node creation prefix char
        if (operName[0] === ':') {
          let oper = this.opers[operName[0]];
          return oper.apply(ctx, [operName.slice(1)].concat(values));
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