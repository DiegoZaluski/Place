const path = require('path');
const fs = require('fs');
/*Reads the js file to be executed in executeJavaScript, maintains a single call.*/
const pathForExecuteJavaScript = path.join(__dirname, 'for-executeJavaScript.js');;

const stringJS = () => {
  const fd = fs.openSync(pathForExecuteJavaScript, 'r');
  try {
    return fs.readFileSync(fd, 'utf8');
  } finally {
    fs.closeSync(fd);
  }
};
const jsstrcache = stringJS()
module.exports = jsstrcache