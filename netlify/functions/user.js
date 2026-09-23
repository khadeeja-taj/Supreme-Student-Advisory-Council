'use strict';
const adapt = require('./_adapter');
exports.handler = adapt(require('../../api/users/[id]'));
