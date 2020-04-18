const path = require('path');

module.exports = {
  entry: './src/lisp.js',
  output: {
    filename: 'lisp.js',
    path: path.resolve(__dirname, 'dist'),
  },
};