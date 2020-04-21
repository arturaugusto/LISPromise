const lisp = function() {

  this.logger = (val) => console.log(val)
  
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
    'sleep': (...x) => {
      return new Promise( (resol, reject) => {
          window.setTimeout(() => {
            resol()
          }, parseFloat(x[0]))
      });
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
    'getvar': function(...x) {
      return this[x[0]] || null
    },
    'ctx': function(...x) {return this},
    'setvar': function(...x) {
      return this[x[0]] = x[1]
    },
    'print': (...x) => {this.logger(x) ; return null},
    '+': (...x) => x.map(v => parseFloat(v)).reduce((a, c) => a + c, 0),
    'float': (...x) => x.map(v => parseFloat(v)),
    '-': (...x) => x.map(v => parseFloat(v)).reduce((a, c) => a - c),
    '*': (...x) => x.map(v => parseFloat(v)).reduce((a, c) => a * c, 1),
    '/': (...x) => x.map(v => parseFloat(v)).reduce((a, c) => a / c),
    'list': (...x) => x,
    'incf': function(...x) {
      let val = parseFloat(this[x[0]])
      this[x[0]] = val + x.slice(1).map(v => parseFloat(v)).reduce((a, c) => a + c, 0)
      return val
    },
    'run': function(...x) {return x.reduce((a, c) => isArray(c) ? _eval(c, this) : c)},
    'return': (...x) => {
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
    const exprArr = isArray(expr) ? expr : this.parse(expr)
    return this.eval(exprArr, ctx)
  }

  this.eval = (expr, ctx) => {
    ctx = ctx || {}

    if (isArray(expr)) {

      let operName = expr[0];

      // code to string when using the ' character
      if (operName[0] === "'") return '["'+JSON.stringify(expr).slice(3)
      
      // code flow operations
      if (operName === 'nextTick') {
        return this.eval(expr[1], ctx).then((res) => {
          return null
        })
      }      

      if (operName === 'dolist') {
        let theList = expr[1][1]
        let theExpr = expr[2]
        let varName = expr[1][0]
        return this.eval(theList, ctx).then((listValues) => {
          return listValues.map((v) => [['setvar', varName, v], theExpr])
        }).then((code) => {
          return this.eval(code, ctx)
        }).then(() => null)
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

  this.load = (obj) => {
    Object.keys(obj).map((k) => {
      this.opers[k] = obj[k]
    })
  }
}

export default lisp