/**
 * Safe Mathematical Expression Parser
 * Tokenizes and parses expressions containing numbers, parentheses, +, -, *, and /
 * using a recursive descent parser.
 */
export function evaluateExpression(expr: string): number {
  const tokens: string[] = [];
  let i = 0;
  
  // Strip spaces
  const cleanExpr = expr.replace(/\s+/g, '');

  while (i < cleanExpr.length) {
    const char = cleanExpr[i];
    if (char === '+' || char === '-' || char === '*' || char === '/' || char === '(' || char === ')') {
      tokens.push(char);
      i++;
    } else if (/[0-9.]/.test(char)) {
      let numStr = '';
      while (i < cleanExpr.length && /[0-9.]/.test(cleanExpr[i])) {
        numStr += cleanExpr[i];
        i++;
      }
      tokens.push(numStr);
    } else {
      throw new Error('calc: invalid character in expression');
    }
  }

  if (tokens.length === 0) {
    throw new Error('calc: missing expression');
  }

  let index = 0;

  function peek(): string | undefined {
    return tokens[index];
  }

  function consume(expected?: string): string {
    const token = tokens[index];
    if (token === undefined) {
      throw new Error('calc: unexpected end of expression');
    }
    if (expected !== undefined && token !== expected) {
      throw new Error(`calc: expected ${expected} but got ${token}`);
    }
    index++;
    return token;
  }

  function parseExpression(): number {
    let result = parseTerm();
    while (peek() === '+' || peek() === '-') {
      const op = consume();
      const right = parseTerm();
      if (op === '+') {
        result += right;
      } else {
        result -= right;
      }
    }
    return result;
  }

  function parseTerm(): number {
    let result = parseFactor();
    while (peek() === '*' || peek() === '/') {
      const op = consume();
      const right = parseFactor();
      if (op === '*') {
        result *= right;
      } else {
        if (right === 0) {
          throw new Error('calc: division by zero');
        }
        result /= right;
      }
    }
    return result;
  }

  function parseFactor(): number {
    const token = peek();
    if (token === undefined) {
      throw new Error('calc: unexpected end of expression');
    }

    if (token === '-') {
      consume();
      return -parseFactor();
    }
    if (token === '+') {
      consume();
      return parseFactor();
    }

    if (token === '(') {
      consume('(');
      const val = parseExpression();
      consume(')');
      return val;
    }

    if (/^[0-9.]+$/.test(token)) {
      consume();
      const val = Number(token);
      if (isNaN(val)) {
        throw new Error('calc: invalid number');
      }
      return val;
    }

    throw new Error(`calc: unexpected token ${token}`);
  }

  const finalVal = parseExpression();
  if (index < tokens.length) {
    throw new Error('calc: unexpected extra tokens');
  }
  return finalVal;
}
