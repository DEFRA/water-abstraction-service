/**
 * Base transformer
 * @module lib/licence-transformer/base-transformer
 */

class BaseTransformer {
  constructor(data) {
    this.data = data;
  }

  export() {
    return this.data;
  }
}

module.exports = BaseTransformer;
