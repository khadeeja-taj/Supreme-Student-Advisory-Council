'use strict';
const adapt = require('./_adapter');
exports.handler = adapt(require('../../api/competitions/[id]/register'));
