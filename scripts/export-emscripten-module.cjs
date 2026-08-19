/** Emscripten 只在 Node 分支里 module.exports；浏览器要补上才能拿到 Module */
module.exports = function exportEmscriptenModule(source) {
  return `${source}\nif (typeof module !== "undefined") module.exports = Module;\n`;
};
