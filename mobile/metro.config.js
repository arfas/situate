const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Completely disable external file creation for node: modules
config.server = config.server || {};
config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    // Block requests for node: protocol externals
    if (req.url && req.url.includes('node:')) {
      res.statusCode = 404;
      res.end('Not found');
      return;
    }
    return middleware(req, res, next);
  };
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Return stub for node: imports
  if (moduleName.startsWith('node:')) {
    return {
      filePath: path.join(__dirname, 'node-stub.js'),
      type: 'sourceFile',
    };
  }
  
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
