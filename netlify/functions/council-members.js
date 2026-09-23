'use strict';
const adapt = require('./_adapter');
exports.handler = adapt(require('../../api/council-members/index'));
