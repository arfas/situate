// Custom transformer that handles node: protocol imports
const upstreamTransformer = require('@expo/metro-config/babel-transformer');

module.exports.transform = function({ src, filename, options }) {
  // Replace node: protocol imports with stub
  if (src.includes('node:')) {
    src = src.replace(/require\(['"]node:[^'"]+['"]\)/g, 'require("./node-stub.js")');
    src = src.replace(/from\s+['"]node:[^'"]+['"]/g, 'from "./node-stub.js"');
  }
  
  return upstreamTransformer.transform({ src, filename, options });
};
