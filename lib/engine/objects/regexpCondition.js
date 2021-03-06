/*
 * Kuzzle, a backend software, self-hostable and ready to use
 * to power modern apps
 *
 * Copyright 2015-2021 Kuzzle
 * mailto: support AT kuzzle.io
 * website: http://kuzzle.io
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const RE2 = require('re2');

/**
 * Stores a regular expression condition,
 * pre-compiling the regular expression in the
 * process.
 *
 * @class RegexpCondition
 * @param {string} pattern - regexp pattern
 * @param subfilter
 * @param {string} [flags] - regexp flags
 */
class RegExpCondition {
  constructor (config, pattern, subfilter, flags) {
    this.regexp = config.regExpEngine === 're2'
      ? new RE2(pattern, flags)
      : new RegExp(pattern, flags);

    this.stringValue = this.regexp.toString();
    this.subfilters = new Set([subfilter]);
  }
}

module.exports = { RegExpCondition };
