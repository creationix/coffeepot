(function(){
  var Keywords, Tokens, analyse, match_token, tokenize, tokens;
  Keywords = ["if", "else", "then", "unless", "true", "false", "yes", "no", "on", "off", "and", "or", "is", "isnt", "not", "new", "return", "try", "catch", "finally", "throw", "break", "continue", "for", "in", "of", "by", "where", "while", "switch", "when", "super", "extends", "arguments", "delete", "instanceof", "typeof"];
  // Remember that regular expressions are really functions, so for the special
  // cases where regular expressions aren't powerful enough, we can use a custom
  // function.
  Tokens = {
    NEWLINE: /^(\n)/,
    WS: /^([ \t]+)/,
    COMMENT: /^(#.*)\n?/,
    ID: /^([a-z_$][a-z0-9_$]*)/i,
    PROPERTY: /^(\.[a-z_$][a-z0-9_$]*)/i,
    COLON: /^(:)/,
    ROCKET: /^(=>)/,
    OPERATOR: /^([+\*&|\/\-%=<>:!]+)/,
    BRACE: /^([\[\]\{\}])/,
    PAREN: /^([\(\)])/,
    COMMA: /^(,)/,
    DOTDOTDOT: /^(\.\.\.)/,
    DOTDOT: /^(\.\.)/,
    EXISTENTIAL: /^(\?)/,
    // A little cheating to keep from having to write a proper number parser
    NUMBER: function NUMBER(code) {
      var __a, num;
      if (!code[0].match(/[0-9.-]/)) {
        return null;
      }
      __a = !isNaN(num = parseInt(code) || parseFloat(code)) ? {
        "1": num + ""
      } : null;
      return NUMBER === this.constructor ? this : __a;
    },
    // Embedded raw JavaScript
    RAW: function RAW(code) {
      var __a, done, len, pos;
      if (code[0] !== "`") {
        return null;
      }
      pos = 1;
      len = code.length + 1;
      done = false;
      while (!done && pos < len) {
        code[pos] === "`" ? done = true : null;
        code[pos] === "\\" ? pos++ : null;
        pos++;
      }
      __a = pos >= len ? null : {
        "1": code.substr(0, pos)
      };
      return RAW === this.constructor ? this : __a;
    },
    // Parse heredoc strings using a simple state machine
    HEREDOC: function HEREDOC(code) {
      var __a, done, len, pos, slice;
      if (!(slice = code.match(/^("""|''')/))) {
        return null;
      }
      slice = slice[1];
      pos = 3;
      len = code.length + 1;
      done = false;
      while (!done && pos < len) {
        if (code.substr(pos, 3) === slice) {
          done = true;
          pos += 2;
        }
        pos++;
      }
      __a = pos >= len ? null : {
        "1": code.substr(0, pos)
      };
      return HEREDOC === this.constructor ? this : __a;
    },
    // Parse strings using a simple state machine
    STRING: function STRING(code) {
      var __a, done, len, pos, quote;
      quote = code[0];
      if (!(quote === "\"" || quote === "\'")) {
        return null;
      }
      pos = 1;
      len = code.length + 1;
      done = false;
      while (!done && pos < len) {
        code[pos] === quote ? done = true : null;
        code[pos] === "\\" ? pos++ : null;
        pos++;
      }
      __a = pos >= len ? null : {
        "1": code.substr(0, pos)
      };
      return STRING === this.constructor ? this : __a;
    },
    // Same story as strings, but even more evil!
    REGEXP: function REGEXP(code) {
      var __a, done, len, pos, start;
      start = code[0];
      if (!(code[0] === "\/")) {
        return null;
      }
      pos = 1;
      len = code.length + 1;
      done = false;
      while (!done && pos < len) {
        try {
          eval(code.substr(0, pos));
          done = true;
        } catch (e) {
          pos++;
        }
      }
      __a = pos >= len ? null : {
        "1": code.substr(0, pos)
      };
      return REGEXP === this.constructor ? this : __a;
    }
  };
  tokens = [];
  // Does a simple longest match algorithm
  match_token = function match_token(code) {
    var __a, match, matcher, name, result;
    result = null;
    __a = Tokens;
    for (name in __a) {
      matcher = __a[name];
      if (__a.hasOwnProperty(name)) {
        (match = matcher(code)) ? result === null || match[1].length > result[1].length ? result = [name, match[1]] : null : null;
      }
    }
    if (result) {
      return result;
    } else {
      debug(inspect(tokens));
      throw new Error("Unknown Token: " + JSON.stringify(code.split("\n")[0]));
    }
  };
  // Turns a long string into a stream of tokens
  tokenize = function tokenize(source) {
    var __a, consume, length, match, pos, type;
    length = source.length;
    pos = 0;
    while (pos < length) {
      __a = match_token(source.substr(pos, length));
      type = __a[0];
      match = __a[1];
      consume = __a[2];
      tokens.push([type, match]);
      pos += match.length;
    }
    return analyse(tokens);
  };
  // Take a raw token stream and strip out unneeded whitespace tokens and insert
  // indent/dedent tokens. By using a stack of indentation levels, we can support
  // mixed spaces and tabs as long the programmer is consistent within blocks.
  analyse = function analyse(tokens) {
    var __a, __b, indent, last, result, stack, token, top;
    last = null;
    result = [];
    stack = [""];
    __a = tokens;
    for (__b=0; __b<__a.length; __b++) {
      token = __a[__b];
      if (token[0] === "WS" && last && last[0] === "NEWLINE") {
        top = stack[stack.length - 1];
        indent = token[1];
        // Look for dedents
        while (indent.length < top.length) {
          if (indent !== top.substr(0, indent.length)) {
            throw new Error("Indentation mismatch");
          }
          result.push(["DEDENT", top]);
          stack.pop();
          top = stack[stack.length - 1];
        }
        // Check for indents
        if (indent.length > top.length) {
          if (top !== indent.substr(0, top.length)) {
            throw new Error("Indentation mismatch");
          }
          result.push(["INDENT", indent]);
          stack.push(indent);
        }
        // Check for other possible mismatch
        if (indent.length === top.length && indent !== top) {
          throw new Error("Indentation mismatch");
        }
      }
      // Strip out unwanted whitespace tokens
      if (token[0] !== "WS") {
        if (!(token[0] === "NEWLINE" && (!last || last[0] === "NEWLINE"))) {
          token[0] === "ID" && Keywords.indexOf(token[1]) >= 0 ? token[0] = "KEYWORD" : null;
          result.push(token);
          last = token;
        }
      }
    }
    // Flush the stack
    while (stack.length > 1) {
      result.push(["DEDENT", stack.pop()]);
    }
    // Tack on tail to make parsing easier
    result.push(["END", ""]);
    return result;
  };
  // Works as CommonJS module too
  exports ? exports.tokenize = tokenize : null;
  // # Read the script from the current file
  // File: require('file')
  // process.mixin(require('sys'))
  //
  // File.read('../test/sample.coffee').addCallback() coffee =>
  //   # puts("\nCoffeeScript\n")
  //   # puts(coffee)
  //   puts("\nTokens\n")
  //   puts(inspect(tokens: tokenize(coffee)))
})();
