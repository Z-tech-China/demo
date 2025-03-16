const path = require('path');

module.exports = function override(config, env) {
  // 添加 @ 别名指向 src 目录
  config.resolve.alias = {
    ...config.resolve.alias,
    '@': path.resolve(__dirname, 'src'),
  };
  return config;
};