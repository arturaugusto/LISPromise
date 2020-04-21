var isArray = (arg) => {
  if (!arg) return false
  return arg.constructor === Array
};

export default {
  '^': function(x, ctx) {
    let node = x[0]
    let operationName = x[1]
    let argument = x[2]
    let operation = node[operationName]
    if (typeof operation === 'function') {
      return operation.call(node, argument)
    }
    return operation
  },
  ':': (x, ctx) => {
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