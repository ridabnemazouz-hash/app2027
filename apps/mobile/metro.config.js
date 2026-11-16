const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const repositoryRoot = path.resolve(projectRoot, '../..');
const config = getDefaultConfig(projectRoot);
config.watchFolders = [repositoryRoot];
config.resolver.nodeModulesPaths = [path.join(repositoryRoot, 'node_modules')];

module.exports = config;
