import { describe, it, expect } from 'vitest';
import { evaluateExpression } from '../../lib/mathParser';

describe('Terminal Calculator (evaluateExpression)', () => {
  it('correctly evaluates simple math expressions', () => {
    expect(evaluateExpression('2+2')).toBe(4);
    expect(evaluateExpression('10 - 5')).toBe(5);
    expect(evaluateExpression('3 * 4')).toBe(12);
    expect(evaluateExpression('20 / 4')).toBe(5);
  });

  it('handles operator precedence and parentheses', () => {
    expect(evaluateExpression('(2 + 3) * 4')).toBe(20);
    expect(evaluateExpression('2 + 3 * 4')).toBe(14);
    expect(evaluateExpression('10 - (2 + 3) * 2')).toBe(0);
    expect(evaluateExpression('((2 + 2) * (3 + 3)) / 2')).toBe(12);
  });

  it('handles floats and decimal numbers', () => {
    expect(evaluateExpression('2.5 * 2')).toBe(5);
    expect(evaluateExpression('10 / 2.5')).toBe(4);
    expect(evaluateExpression('0.1 + 0.2')).toBeCloseTo(0.3, 5);
  });

  it('handles unary operators', () => {
    expect(evaluateExpression('-5 + 10')).toBe(5);
    expect(evaluateExpression('+5 * -2')).toBe(-10);
    expect(evaluateExpression('-(2 + 2)')).toBe(-4);
  });

  it('throws an error on division by zero', () => {
    expect(() => evaluateExpression('10 / 0')).toThrow('calc: division by zero');
    expect(() => evaluateExpression('5 / (2 - 2)')).toThrow('calc: division by zero');
  });

  it('rejects invalid characters (prevents arbitrary code execution)', () => {
    expect(() => evaluateExpression('window.alert(1)')).toThrow('calc: invalid character in expression');
    expect(() => evaluateExpression('console.log("hello")')).toThrow('calc: invalid character in expression');
    expect(() => evaluateExpression('alert(1)')).toThrow('calc: invalid character in expression');
    expect(() => evaluateExpression('new Function("return 1")()')).toThrow('calc: invalid character in expression');
  });

  it('rejects malformed math syntax', () => {
    expect(() => evaluateExpression('2 +')).toThrow();
    expect(() => evaluateExpression('* 5')).toThrow();
    expect(() => evaluateExpression('(2 + 3')).toThrow();
    expect(() => evaluateExpression('2 + 3)')).toThrow();
  });
});
