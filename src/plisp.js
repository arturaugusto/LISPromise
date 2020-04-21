const plisp = function() {

  this.logger = (val) => console.log(val)
  
  this.parse = function(expr) {
    return JSON.parse(expr
      .split('\n').join('')
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
    'sleep': (x, ctx) => {
      return new Promise( (resol, reject) => {
          window.setTimeout(() => {
            resol()
          }, parseFloat(x[0]))
      });
    },
    'combine': (x, ctx) => {
      return x.flatMap(
          (v, i) => x.slice(i+1).map( w => [v, w] )
      );
    },
    '/=': (x, ctx) => {
      if (x.length === 2) return x[0] !== x[1]
      let c = this.opers.combine(x, ctx)
      for (var i = 0; i < c.length-1; i++) {if (c[i][0] === c[i+1][1]) return false}
      return true
    },
    '=': (x, ctx) => {
      if (x.length === 1) return this.opers.bool(x[0])
      for (var i = 0; i < x.length-1; i++) {if (x[i] !== x[i+1]) return false}
      return true
    },
    '<': (x, ctx) => {
      for (var i = 0; i < x.length-1; i++) {if (x[i] >= x[i+1]) return false}
      return true
    },
    '>': (x, ctx) => {
      for (var i = 0; i < x.length-1; i++) {if (x[i] <= x[i+1]) return false}
      return true
    },
    '<=': (x, ctx) => {
      for (var i = 0; i < x.length-1; i++) {if (x[i] > x[i+1]) return false}
      return true
    },
    '>=': (x, ctx) => {
      for (var i = 0; i < x.length-1; i++) {if (x[i] < x[i+1]) return false}
      return true
    },
    'bool': (x, ctx) => {
      if (typeof x[0] == 'boolean') return x[0]
      return isNaN(parseFloat(x[0])) || !!parseFloat(x[0])
    },
    'getvar': (x, ctx) => {
      return ctx[x[0]] || null
    },
    'ctx': (x, ctx) => {
      if (x.length !== 0) {
        throw new this.UnexpectedArgument(`ctx expects 0 arguments and got ${x.length}`)
      }
      return ctx
    },
    'setvar': (x, ctx) => {
      return ctx[x[0]] = x[1]
    },
    'print': (x, ctx) => {this.logger(x) ; return null},
    '+': (x, ctx) => x.map(v => parseFloat(v)).reduce((a, c) => a + c, 0),
    'float': (x, ctx) => x.map(v => parseFloat(v)),
    '-': (x, ctx) => x.map(v => parseFloat(v)).reduce((a, c) => a - c),
    '*': (x, ctx) => x.map(v => parseFloat(v)).reduce((a, c) => a * c, 1),
    '/': (x, ctx) => x.map(v => parseFloat(v)).reduce((a, c) => a / c),
    'list': (x, ctx) => x,
    'incf': (x, ctx) => {
      let val = parseFloat(ctx[x[0]])
      ctx[x[0]] = val + x.slice(1).map(v => parseFloat(v)).reduce((a, c) => a + c, 0)
      return val
    },
    'run': (x, ctx) => {
      return x.reduce((a, c) => isArray(c) ? _eval(c, ctx) : c)},
    'return': (x, ctx) => {
      return new this.signals.return()
    }
  };

  var isArray = (arg) => {
    if (!arg) return false
    return arg.constructor === Array
  };

  /**
  Deep search inside the array for an instance of `signal`
  and return true or false if found or not
  */
  var hasSignal = (arr, signal) => arr.flat(Infinity)
    .reduce((a, c) => a || (c instanceof signal), false)
  ;

  this.UnexpectedArgument = function(message) {
     this.message = message;
     this.name = "UnexpectedArgument";
  };

  this.signals = {
    'return': function() {this.type = 'return'}
  }

  this.NotFoundException = function(message) {
     this.message = message;
     this.name = "NotFoundException";
  };

  this.maxStack = 10000
  this.stackCount = 0
  this.MaxStackError = function(message) {
     this.message = message;
     this.name = "MaxStackError";
  };

  this.run = (expr, ctx) => {
    ctx = ctx || {}
    const exprArr = isArray(expr) ? expr : this.parse(expr)
    
    // for list of operations
    if (isArray(exprArr[0])) {
      return exprArr.reduce((a, c, i) => a.then(() => this.eval(c, ctx)), Promise.resolve())
    }
    // for single operation
    return this.eval(exprArr, ctx)
  }

  this.eval = (expr, ctx) => {
    ctx = ctx || {}

    if (isArray(expr)) {
      let operName = expr[0];

      // code to string when using the ' character
      if (operName[0] === "'") return '["'+JSON.stringify(expr).slice(3)
      
      if (operName === 'dolist') {
        let theList = expr[1][1]
        let theExpr = expr[2]
        let varName = expr[1][0]
        return this.run(theList, ctx).then((listValues) => {
          return this.run(listValues.map((v) => [['setvar', varName, v], theExpr]), ctx)
        })
      }

      if (operName === 'loop') {
        this.stackCount++
        if (this.stackCount >= this.maxStack) {
          throw new this.MaxStackError(`stackCount: ${this.stackCount}`);
        }
        return this.eval(expr[1], ctx).then((res) => {
          if (hasSignal([res], this.signals.return)) {
            this.stackCount = 0
            return null
          }
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
          return oper(values, ctx);
        }

        if (operName[0] === '&') {
          let oper = this.opers['getvar'];
          return oper([operName.slice(1)].concat(values), ctx);
        }

        // node creation prefix char
        if (operName[0] === ':') {
          let oper = this.opers[operName[0]];
          return oper([operName.slice(1)].concat(values), ctx);
        }

        throw new this.NotFoundException(`${operName}`);
      }).catch((err) => {
        //console.log(expr)
        //console.log(err)
      })
    } else {
      return expr;
    }
  };
  const _eval = this.eval

  this.fromNode = (node, attributeName) => {
    return this.run(node.getAttribute(attributeName), {rootNode: node})
  };

  this.load = (obj) => {
    Object.keys(obj).map((k) => {
      this.opers[k] = obj[k]
    })
  }
}

export default plisp