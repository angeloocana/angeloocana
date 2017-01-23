var getBabelRelayPlugin = require('babel-relay-plugin');
var schemaData = require('./dist/server/data/schema.json').data;

module.exports = getBabelRelayPlugin(schemaData);
