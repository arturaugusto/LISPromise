const path = require('path');

module.exports = {
  entry: './src/lisp.js',
  mode: 'production',
  output: {
    filename: 'lisp.js',
    path: path.resolve(__dirname, 'dist'),
  },
};