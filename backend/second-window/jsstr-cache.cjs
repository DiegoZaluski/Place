const fs = require('fs');
const path = require('path');
/*Reads the js file to be executed in executeJavaScript, maintains a single call.*/
const pathForExecuteJavaScript = path.join(__dirname, 'for-executeJavaScript.js');

const jsstrcache = fs.readFileSync(pathForExecuteJavaScript, 'utf8');
module.exports = jsstrcache;
