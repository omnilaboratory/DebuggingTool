type numType = number | string;
/**
 * @desc Solve the problem of floating point arithmetic, 
 * avoid multiple digits after the decimal point and 
 * loss of calculation accuracy.
 * Examples：2.3 + 2.4 = 4.699999999999999，1.0 - 0.9 = 0.09999999999999998
 */

/**
 * Convert wrong data into correct
 * strip(0.09999999999999998)=0.1
 */
function strip(num: numType, precision = 15): number {
  return +parseFloat(Number(num).toPrecision(precision));
}

/**
 * Return digits length of a number
 * @param {*number} num Input number
 */
function digitLength(num: numType): number {
  // Get digit length of e
  const eSplit = num.toString().split(/[eE]/);
  const len = (eSplit[0].split('.')[1] || '').length - +(eSplit[1] || 0);
  return len > 0 ? len : 0;
}

/**
 * Convert decimals to integers and support scientific notation. 
 * If it is a decimal, it is enlarged to an integer
 * @param {*number} num Input number
 */
function float2Fixed(num: numType): number {
  if (num.toString().indexOf('e') === -1) {
    return Number(num.toString().replace('.', ''));
  }
  const dLen = digitLength(num);
  return dLen > 0 ? strip(Number(num) * Math.pow(10, dLen)) : Number(num);
}

/**
 * Check whether the number is out of range, and give a prompt if it is out of range
 * @param {*number} num Input number
 */
function checkBoundary(num: number) {
  if (_boundaryCheckingState) {
    if (num > Number.MAX_SAFE_INTEGER || num < Number.MIN_SAFE_INTEGER) {
      console.warn(`${num} is beyond boundary when transfer to integer, the results may not be accurate`);
    }
  }
}

/**
 * Exact multiplication
 */
function times(num1: numType, num2: numType, ...others: numType[]): number {
  if (others.length > 0) {
    return times(times(num1, num2), others[0], ...others.slice(1));
  }
  const num1Changed = float2Fixed(num1);
  const num2Changed = float2Fixed(num2);
  const baseNum = digitLength(num1) + digitLength(num2);
  const leftValue = num1Changed * num2Changed;

  checkBoundary(leftValue);

  return leftValue / Math.pow(10, baseNum);
}

/**
 * Exact addition
 */
function plus(num1: numType, num2: numType, ...others: numType[]): number {
  if (others.length > 0) {
    return plus(plus(num1, num2), others[0], ...others.slice(1));
  }
  const baseNum = Math.pow(10, Math.max(digitLength(num1), digitLength(num2)));
  return (times(num1, baseNum) + times(num2, baseNum)) / baseNum;
}

/**
 * Exact subtraction
 */
function minus(num1: numType, num2: numType, ...others: numType[]): number {
  if (others.length > 0) {
    return minus(minus(num1, num2), others[0], ...others.slice(1));
  }
  const baseNum = Math.pow(10, Math.max(digitLength(num1), digitLength(num2)));
  return (times(num1, baseNum) - times(num2, baseNum)) / baseNum;
}

/**
 * Exact division
 */
function divide(num1: numType, num2: numType, ...others: numType[]): number {
  if (others.length > 0) {
    return divide(divide(num1, num2), others[0], ...others.slice(1));
  }
  const num1Changed = float2Fixed(num1);
  const num2Changed = float2Fixed(num2);
  checkBoundary(num1Changed);
  checkBoundary(num2Changed);
  // fix: like 10 ** -4 为 0.00009999999999999999，strip fix it.
  return times(num1Changed / num2Changed, strip(Math.pow(10, digitLength(num2) - digitLength(num1))));
}

/**
 * rounding
 */
function round(num: numType, ratio: number): number {
  const base = Math.pow(10, ratio);
  return divide(Math.round(times(num, base)), base);
}

let _boundaryCheckingState = true;
/**
 * Whether to perform boundary check, enabled by default
 * @param flag true is on, false is off, default is true
 */
function enableBoundaryChecking(flag = true) {
  _boundaryCheckingState = flag;
}