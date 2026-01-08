const fsPromise = require('fs').promises;
const path = require('path');
const { COLORS } = require('../../utils/ansiColors.cjs'); 
/*Reads the js file to be executed in executeJavaScript, maintains a single call.*/
const pathForExecuteJavaScript = path.join(__dirname, 'for-executeJavaScript.js');
try { module.exports = (async () => await fsPromise.readFile(pathForExecuteJavaScript, 'utf8'))() } 
catch { console.error(RED+'[jsstr-cache.cjs]: The string to remove the scrollbar was not loaded successfully.'+RESET);}
