/**
 * A set of constants defining message queue priorities throughout the app
 * Highest priority is 1.  The higher the integer, the lower the priority.
 * See https://optimalbits.github.io/bull/
 */
const HIGH_PRIORITY = 1;
const MEDIUM_PRIORITY = 50;
const LOW_PRIORITY = 100;

module.exports = {
  HIGH_PRIORITY,
  MEDIUM_PRIORITY,
  LOW_PRIORITY
};
