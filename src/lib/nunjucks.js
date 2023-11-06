const nunjucks = require('nunjucks');

const env = new nunjucks.Environment(new nunjucks.FileSystemLoader('src/views'));

module.exports = env;
