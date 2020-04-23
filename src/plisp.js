const plisp = function() {

  this.logger = (val) => console.log(val)
  
  this.parse = function(expr) {
    return JSON.parse(expr
      .split('\n').join('')
      .replace(/\(\)/g, '(_)')
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
  
  this.op = {
    'sleep': x => {
      return new Promise( (resol, reject) => {
          window.setTimeout(() => {
            resol()
          }, _op.float(x[0]))
      });
    },
    'combine': x => {
      return x.flatMap(
          (v, i) => x.slice(i+1).map( w => [v, w] )
      );
    },
    '/=': x => {
      if (x.length === 2) return x[0] !== x[1]
      let c = _op.combine(x)
      for (var i = 0; i < c.length-1; i++) {if (c[i][0] === c[i+1][1]) return false}
      return true
    },
    '=': x => {
      if (x.length === 1) return _op.bool(x[0])
      let len = x.length
      for (var i = 0; i < len-1; i++) {if (x[i] !== x[i+1]) return false}
      return true
    },
    '<': x => {
      let len = x.length
      let xf = x.map(_op.float)
      for (var i = 0; i < len-1; i++) {if (xf[i] >= xf[i+1]) return false}
      return true
    },
    '>': x => {
      let len = x.length
      let xf = x.map(_op.float)
      for (var i = 0; i < len-1; i++) {if (xf[i] <= xf[i+1]) return false}
      return true
    },
    '<=': x => {
      let len = x.length
      let xf = x.map(_op.float)
      for (var i = 0; i < len-1; i++) {if (xf[i] > xf[i+1]) return false}
      return true
    },
    '>=': x => {
      let len = x.length
      let xf = x.map(_op.float)
      for (var i = 0; i < len-1; i++) {if (xf[i] < xf[i+1]) return false}
      return true
    },
    'bool': x => {
      if (typeof x[0] == 'boolean') return x[0]
      return isNaN(_op.float(x[0])) || !!_op.float(x[0])
    },
    'getvar': (x, ctx) => {
      return ctx[x[0]] === undefined ? null : ctx[x[0]]
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
    'print': x => {this.logger(x) ; return null},
    '+': x => x.map(_op.float).reduce((a, c) => a + c, 0),
    'f': x => {
      return parseFloat(x[0])
    },
    'float': x => {
      if (isAtom(x)) return parseFloat(x)
      return x.map(v => {
        if (!isAtom(v)) {
          throw new this.InvalidType(`Cant convert ${typeof v} to float.`)
        }
        return parseFloat(v)
      })
    },
    '-': x => x.map(_op.float).reduce((a, c) => a - c),
    '*': x => x.map(_op.float).reduce((a, c) => a * c, 1),
    '/': x => x.map(_op.float).reduce((a, c) => a / c),
    'list': x => x,
    'incf': (x, ctx) => {
      let val = _op.float(ctx[x[0]])
      ctx[x[0]] = val + x.slice(1).map(_op.float).reduce((a, c) => a + c, 0)
      return val
    },
    'decf': (x, ctx) => {
      let val = _op.float(ctx[x[0]])
      ctx[x[0]] = val + x.slice(1).map(_op.float).reduce((a, c) => a - c, 0)
      return val
    },
    'return': () => new this.signals.return(),
    'nth': x => x[1][_op.float(x[0])],
    'len': x => x.reduce((a, c) => a+c.length, 0),
    'invert': x => {
      let res = []
      let theList = x[0]
      for (var i = theList.length - 1; i >= 0; i--) {res.push(theList[i])}
      return res
    }
  };
  const _op = this.op
  
  const isArray = (arg) => {
    if (!arg) return false
    return arg.constructor === Array
  };

  const isAtom = x => isArray(x) ? false :
    (typeof x === 'string')
    || (typeof x === 'number')
    || (typeof x === 'boolean')
    || (x === null)
    || (x === undefined)
    || isNaN(x)
    || !isFinite(x)


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

  this.InvalidType = function(message) {
     this.message = message;
     this.name = "InvalidType";
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

  this.funcs = {}

  this.run = (expr, ctx) => {
    ctx = ctx || {}
    const exprArr = isArray(expr) ? expr : this.parse(expr)
    
    // for list of operations
    if (isArray(exprArr[0])) {
      return exprArr.reduce((a, c) => a.then(() => this.eval(c, ctx)), Promise.resolve())
    }
    // for single operation
    return this.eval(exprArr, ctx)
  }

  this.eval = (expr, ctx) => {
    ctx = ctx || {}

    if (isArray(expr) && isArray(expr[0])) {
      return this.run(expr, ctx)
    }

    if (isArray(expr)) {
      let operName = expr[0];

      // code to string when using the ' character
      if (operName[0] === "'") return JSON.parse('["'+JSON.stringify(expr).slice(3))
      
      if (operName === 'defun') {
        this.funcs[expr[1]] = {
          args: expr[2],
          fun: expr[3]
        }
        return null
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
      
      let argsEval = expr.slice(1).map((val) => this.eval(val, ctx))
      return Promise.all(argsEval).then((values) => {
        return this.execOper(operName, values, ctx)
      })
    } else {
      return expr;
    }
  };

  this.execOper = (operName, values, ctx) => {
    // parallel operations is a dummy operator to allow
    // the execution of Promisse.all and dont get traped 
    // at isArray(expr) && isArray(expr[0])
    if (operName === 'parallel') return null
    
    // check for defined functions
    if (this.funcs[operName]) {
      let funObj = this.funcs[operName]
      let funCtx = _clone(ctx)
      for (let i = 0; i < funObj.args.length; i++) {
        funCtx[funObj.args[i]] = values[i]
      }
      return this.run(funObj.fun, funCtx)
    }

    // look for a registered function
    let oper = this.op[operName]

    if (oper) {
      return oper(values, ctx);
    }

    if (operName[0] === '&') {
      let oper = this.op['getvar'];
      return oper([operName.slice(1)].concat(values), ctx);
    }

    // node creation prefix char
    if (operName[0] === ':') {
      let oper = this.op[operName[0]];
      return oper([operName.slice(1)].concat(values), ctx);
    }

    throw new this.NotFoundException(`${operName}`);    
  }
  const _eval = this.eval
  const _clone = x => JSON.parse(JSON.stringify(x))

  this.fromNode = (node, attributeName) => {
    return this.run(node.getAttribute(attributeName), {rootNode: node})
  };

  this.load = (obj) => {
    Object.keys(obj).map((k) => {
      this.op[k] = obj[k]
    })
  }
}

export default plisp