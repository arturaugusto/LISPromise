const path = require('path');

module.exports = {
  entry: './src/plisp.js',
  mode: 'production',
  output: {
    filename: 'plisp.js',
    path: path.resolve(__dirname, 'dist'),
  },
};