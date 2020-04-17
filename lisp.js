const wlisp = function() {


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
  
  this.signals = {
    'return': function() {this.type = 'return'}
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
      if (x.length === 1) return this.opers.bool(x[0])
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
    'bool': (...x) => {
      if (typeof x[0] == 'boolean') return x[0]
      return isNaN(parseFloat(x[0])) || !!parseFloat(x[0])
    },
    'getvar': function(...x) {return this[x[0]] || null},
    'ctx': function(...x) {return this},
    'setvar': function(...x) {return this[x[0]] = x[1]},
    //'print': (...x) => console.log(x) || null,
    'print': (...x) => null,
    '+': (...x) => x.map(v => parseFloat(v)).reduce((a, c) => a + c, 0),
    'float': (...x) => x.map(v => parseFloat(v)),   
    '-': (...x) => x.map(v => parseFloat(v)).reduce((a, c) => a - c),
    '*': (...x) => x.map(v => parseFloat(v)).reduce((a, c) => a * c, 1),
    '/': (...x) => x.map(v => parseFloat(v)).reduce((a, c) => a / c),
    'list': (...x) => x,
    'incf': function(...x) {
      let val = parseFloat(this[x[0]])
      this[x[0]] = val + parseFloat(x[1])
      return val
    },
    'run': function(...x) {for (var i = 0; i < x.length; i++) {_eval(x[i], this)}},
    'return': (...x) => {
      return new this.signals.return()
    },
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

  var isArray = (arg) => {
    if (arg === null) return false
    if (arg === undefined) return false
    return arg.constructor === Array
  };
  var isPromise = (arg) => arg.constructor === Promise;

  /**
  Deep search inside the array for an instance of `signal`
  and return true or false if found or not
  */
  var hasSignal = (arr, signal) => arr.flat(Infinity)
    .reduce((a, c) => a || (c instanceof signal), false)
  ;

  this.NotFoundException = function(message) {
     this.message = message;
     this.name = "NotFoundException";
  };

  this.MaxStackError = function(message) {
     this.message = message;
     this.name = "MaxStackError";
  };

  this.run = (expr, ctx) => {
    const exprArr = isArray(expr) ? expr : this.parse(expr)
    return this.eval(exprArr, ctx)
  }

  this._maxStack = 10

  this.eval = (expr, ctx) => {
    ctx = ctx || {}

    if (isArray(expr)) {
      let operName = expr[0];

      // code flow operations

      if (operName === 'loop') {
        return this.eval(expr[1], ctx).then((res) => {
          if (hasSignal([res], this.signals.return)) return null
          return this.eval(['loop', expr[1]], ctx)
        })
      }

      if (operName === 'if') {
        let trueCheck = this.eval(['bool', expr[1]], ctx)
        return trueCheck.then((res) => {
          if (res) {
            return this.eval(expr[2], ctx)
          } else {
            if (expr[3]) {
              return this.eval(expr[3], ctx)
            }
            return null
          }
        })
      }

      let args
      if (isArray(operName)) {
        operName = 'run'
        args = expr
      } else {
        args = expr.slice(1)
      }

      let argsEval = args.map((val) => this.eval(val, ctx))
      return Promise.all(argsEval).then((values) => {
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
  const _eval = this.eval

  this.fromNode = (node, attributeName) => {
    return this.run(node.getAttribute(attributeName), {rootNode: node})
  };

}

export default wlisp