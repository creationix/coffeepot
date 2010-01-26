// coffeepot/lexer.coffee

(function(){
  var Booleans, CoffeePot, Containers, Keywords, Tokens, analyse, block_trim, match_token, root, strip_heredoc, tokens;
  var __hasProp = Object.prototype.hasOwnProperty;
  root = (typeof exports !== "undefined" && exports !== null) ? exports : this;
  CoffeePot = (root.CoffeePot = (typeof root.CoffeePot !== "undefined" && root.CoffeePot !== null) ? root.CoffeePot : {
  });
  Booleans = ["true", "false", "yes", "no", "on", "off"];
  Keywords = ["if", "else", "then", "unless", "and", "or", "is", "isnt", "not", "new", "return", "try", "catch", "finally", "throw", "break", "continue", "for", "in", "of", "by", "where", "while", "switch", "when", "super", "extends", "arguments", "var", "delete", "instanceof", "typeof"];
  // Tokens that contain a value
  Containers = ["COMMENT", "ID", "PROPERTY", "OPERATOR", "NUMBER", "BOOLEAN", "RAW", "HEREDOC", "STRING", "REGEX"];
  // Remember that regular expressions are really functions, so for the special
  // cases where regular expressions aren't powerful enough, we can use a custom
  // function.
  Tokens = {
    // These are taken literally
    CODE: /^([\(\)\[\]\{\}:=;,.])/,
    NEWLINE: /^([ \t]*\n)/,
    WS: /^([ \t]+)/,
    COMMENT: /^(#.*)\n?/,
    ID: /^([a-z_$][a-z0-9_$]*)/i,
    ROCKET: /^(=>)/,
    OPERATOR: /^([+\*&|\/\-%=<>!?]+)/,
    DOTDOTDOT: /^(\.\.\.)/,
    DOTDOT: /^(\.\.)/,
    // A little cheating to keep from having to write a proper number parser
    NUMBER: function NUMBER(code) {
      var __a, num;
      if (!code[0].match(/[0-9.-]/)) {
        return null;
      }
      __a = !isNaN((num = parseInt(code) || parseFloat(code))) ? {
        "1": num + ""
      } : null;
      return NUMBER === this.constructor ? this : __a;
    },
    // Embedded raw JavaScript
    JS: function JS(code) {
      var __a, done, len, pos;
      if (code[0] !== "`") {
        return null;
      }
      pos = 1;
      len = code.length + 1;
      done = false;
      while (!done && pos < len) {
        code[pos] === "`" ? (done = true) : null;
        code[pos] === "\\" ? pos++ : null;
        pos++;
      }
      __a = pos >= len ? null : {
        "1": code.substr(0, pos)
      };
      return JS === this.constructor ? this : __a;
    },
    // Parse heredoc strings using a simple state machine
    HEREDOC: function HEREDOC(code) {
      var __a, done, len, pos, slice;
      if (!((slice = code.match(/^("""|''')\n/)))) {
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
        code[pos] === quote ? (done = true) : null;
        code[pos] === "\\" ? pos++ : null;
        pos++;
      }
      __a = pos >= len ? null : {
        "1": code.substr(0, pos)
      };
      return STRING === this.constructor ? this : __a;
    },
    // Same story as strings, but even more evil!
    REGEX: function REGEX(code) {
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
      return REGEX === this.constructor ? this : __a;
    }
  };
  tokens = [];
  // Trims leading whitespace from a block of text
  block_trim = function block_trim(text) {
    var __a, __b, indent, line, lines, match, min;
    lines = text.split("\n");
    min = null;
    __a = lines;
    for (__b = 0; __b < __a.length; __b++) {
      line = __a[__b];
      if (!(((match = line.match(/^(\s*)\S/))))) {
        continue;
      }
      indent = match[1].length;
      min === null || indent < min ? (min = indent) : null;
    }
    lines = lines.map(function(line) {
      return line.substr(min, line.length);
    });
    return lines.join("\n");
  };
  // Does a simple longest match algorithm
  match_token = function match_token(code) {
    var __a, match, matcher, name, result;
    result = null;
    __a = Tokens;
    for (name in __a) {
      matcher = __a[name];
      if (__hasProp.call(__a, name)) {
        ((match = matcher(code))) ? result === null || match[1].length > result[1].length ? (result = [name, match[1]]) : null : null;
      }
    }
    if (result) {
      return result;
    } else {
      debug(inspect(tokens));
      throw new Error("Unknown Token: " + JSON.stringify(code.split("\n")[0]));
    }
  };
  strip_heredoc = function strip_heredoc(raw) {
    var lines;
    return lines = Helper.block_trim(raw.substr(4, raw.length - 7));
  };
  // Take a raw token stream and strip out unneeded whitespace tokens and insert
  // indent/dedent tokens. By using a stack of indentation levels, we can support
  // mixed spaces and tabs as long the programmer is consistent within blocks.
  analyse = function analyse(tokens, code) {
    var __a, __b, i, idx, indent, last, pos, result, stack, token, top;
    result = [];
    stack = [""];
    i = -1;
    __a = tokens;
    for (__b = 0; __b < __a.length; __b++) {
      token = __a[__b];
      last = tokens[i];
      i++;
      if (last && last[0] === "NEWLINE") {
        if (token[0] === "NEWLINE") {
          continue;
        }
        top = stack[stack.length - 1];
        indent = token[0] === "WS" ? token[2] : "";
        // Look for dedents
        while (indent.length < top.length) {
          if (indent !== top.substr(0, indent.length)) {
            throw new Error("Indentation mismatch");
          }
          result.push(["DEDENT", token[1], top]);
          result.push(["NEWLINE", token[1]]);
          stack.pop();
          top = stack[stack.length - 1];
        }
        // Check for indents
        if (indent.length > top.length) {
          if (top !== indent.substr(0, top.length)) {
            throw new Error("Indentation mismatch");
          }
          result.pop();
          result.push(["INDENT", token[1], indent]);
          stack.push(indent);
        }
        // Check for other possible mismatch
        if (indent.length === top.length && indent !== top) {
          throw new Error("Indentation mismatch");
        }
      }
      // Look for reserved identifiers and mark them
      if (token[0] === "ID") {
        if (Keywords.indexOf(token[2]) >= 0) {
          token[0] = token[2];
        } else if (((idx = Booleans.indexOf(token[2]))) >= 0) {
          token[0] = "BOOLEAN";
          token[2] = idx % 2 === 0;
        }
      }
      // Convert strings to their raw value
      token[0] === "STRING" ? (token[2] = (function() {
        try {
          return JSON.parse(token[2].replace(/\n/g, "\\n"));
        } catch (e) {
          return token[2];
        }
      }).call(this)) : null;
      // Strip leading whitespace off heredoc blocks
      if (token[0] === "HEREDOC") {
        token[2] = strip_heredoc(token[2]);
        token[0] = "STRING";
      }
      token[0] === "COMMENT" ? (token[2] = token[2].substr(1, token[2].length)) : null;
      token[0] === "CODE" ? (token[0] = token[2]) : null;
      Containers.indexOf(token[0]) < 0 ? (token.length = 2) : null;
      // Strip out unwanted whitespace tokens
      if (token[0] !== "WS") {
        result.push(token);
      }
    }
    // Flush the stack
    while (stack.length > 1) {
      pos = [tokens.length, code.split("\n").length];
      result.push(["DEDENT", pos, stack.pop()]);
      result.push(["NEWLINE", pos]);
    }
    return result;
  };
  // Turns a long string into a stream of tokens
  CoffeePot.tokenize = function tokenize(source) {
    var __a, consume, length, line_no, match, pos, type;
    source += "\n";
    length = source.length;
    pos = 0;
    tokens = [];
    while (pos < length) {
      __a = match_token(source.substr(pos, length));
      type = __a[0];
      match = __a[1];
      consume = __a[2];
      line_no = source.substr(0, pos).replace(/[^\n]/g, "").length;
      tokens.push([type, [pos, line_no], match]);
      pos += match.length;
    }
    return analyse(tokens, source);
  };
})();// coffeepot/parser.coffee

(function () {
  /* Jison generated parser */
  var parser = (function(){
  var parser = {log: function log(){
      if (this.DEBUG) {
          puts(JSON.stringify(Array.prototype.slice.call(arguments)))
      }
  },
  yy: {},
  symbols_: {"Root":2,"Block":3,"Statement":4,"NEWLINE":5,"Expression":6,"if":7,"unless":8,"COMMENT":9,"Literal":10,"Source":11,"Assign":12,"Function":13,"Binop":14,"Array":15,"Object":16,"Call":17,"Id":18,"(":19,")":20,".":21,"ExpressionList":22,",":23,"Operator":24,"[":25,"ArrayItems":26,"]":27,"INDENT":28,"DEDENT":29,"{":30,"ObjectItems":31,"}":32,"ObjectItem":33,":":34,"String":35,"OPERATOR":36,"NUMBER":37,"BOOLEAN":38,"REGEX":39,"STRING":40,"=":41,"Property":42,"FunctionBody":43,"ROCKET":44,"Splat":45,"VarListItem":46,"VarList":47,"DOTDOTDOT":48,"ID":49,"$accept":0,"$end":1},
  terminals_: {"5":"NEWLINE","7":"if","8":"unless","9":"COMMENT","19":"(","20":")","21":".","23":",","25":"[","27":"]","28":"INDENT","29":"DEDENT","30":"{","32":"}","34":":","35":"String","36":"OPERATOR","37":"NUMBER","38":"BOOLEAN","39":"REGEX","40":"STRING","41":"=","44":"ROCKET","48":"DOTDOTDOT","49":"ID"},
  productions_: [0,[2,1],[2,0],[3,2],[3,3],[4,3],[4,3],[4,1],[4,1],[6,1],[6,1],[6,1],[6,1],[6,1],[6,1],[6,1],[6,1],[17,3],[17,5],[17,4],[17,2],[17,6],[17,4],[22,1],[22,3],[14,3],[15,3],[15,7],[26,1],[26,3],[26,3],[16,3],[16,7],[33,3],[33,3],[31,1],[31,3],[31,3],[24,1],[10,1],[10,1],[10,1],[10,1],[12,3],[12,3],[42,3],[11,1],[11,3],[11,4],[43,1],[43,3],[43,0],[13,2],[13,3],[13,5],[46,1],[46,1],[47,1],[47,3],[45,2],[18,1]],
  performAction: function anonymous(yytext,yylineno,yy) {
  
  var $$ = arguments[4],$0=arguments[4].length;
  switch(arguments[3]) {
  case 1:return this.$ = ["Root", ["Block", $$[$0-1+1-1]]];
  break;
  case 2:return this.$ = false;
  break;
  case 3:this.$ = [$$[$0-2+1-1]];
  break;
  case 4:this.$ = $$[$0-3+1-1].concat([$$[$0-3+2-1]]);
  break;
  case 5:this.$ = ["If", $$[$0-3+3-1], $$[$0-3+1-1]];
  break;
  case 6:this.$ = ["If", ["Not", $$[$0-3+3-1]], $$[$0-3+1-1]];
  break;
  case 7:this.$ = $$[$0-1+1-1];
  break;
  case 8:this.$ = ["COMMENT", yytext];
  break;
  case 9:this.$ = $$[$0-1+1-1];
  break;
  case 10:this.$ = $$[$0-1+1-1];
  break;
  case 11:this.$ = $$[$0-1+1-1];
  break;
  case 12:this.$ = $$[$0-1+1-1];
  break;
  case 13:this.$ = $$[$0-1+1-1];
  break;
  case 14:this.$ = $$[$0-1+1-1];
  break;
  case 15:this.$ = $$[$0-1+1-1];
  break;
  case 16:this.$ = $$[$0-1+1-1];
  break;
  case 17:this.$ = ["Call", null, $$[$0-3+1-1], []];
  break;
  case 18:this.$ = ["Call", $$[$0-5+1-1], $$[$0-5+3-1], []];
  break;
  case 19:this.$ = ["Call", null, $$[$0-4+1-1], $$[$0-4+3-1]];
  break;
  case 20:this.$ = ["Call", null, $$[$0-2+1-1], $$[$0-2+2-1]];
  break;
  case 21:this.$ = ["Call", $$[$0-6+1-1], $$[$0-6+3-1], $$[$0-6+5-1]];
  break;
  case 22:this.$ = ["Call", $$[$0-4+1-1], $$[$0-4+3-1], $$[$0-4+4-1]];
  break;
  case 23:this.$ = [$$[$0-1+1-1]];
  break;
  case 24:this.$ = $$[$0-3+1-1].concat([$$[$0-3+3-1]]);
  break;
  case 25:this.$ = ["Binop", $$[$0-3+2-1], $$[$0-3+1-1], $$[$0-3+3-1]];
  break;
  case 26:this.$ = ["Array", $$[$0-3+2-1]];
  break;
  case 27:this.$ = ["Array", $$[$0-7+3-1]];
  break;
  case 28:this.$ = [$$[$0-1+1-1]];
  break;
  case 29:this.$ = $$[$0-3+1-1].concat([$$[$0-3+3-1]]);
  break;
  case 30:this.$ = $$[$0-3+1-1].concat([$$[$0-3+3-1]]);
  break;
  case 31:this.$ = ["Object", $$[$0-3+2-1]];
  break;
  case 32:this.$ = ["Object", $$[$0-7+3-1]];
  break;
  case 33:this.$ = [$$[$0-3+1-1], $$[$0-3+3-1]];
  break;
  case 34:this.$ = [$$[$0-3+1-1], $$[$0-3+3-1]];
  break;
  case 35:this.$ = [$$[$0-1+1-1]];
  break;
  case 36:this.$ = $$[$0-3+1-1].concat([$$[$0-3+3-1]]);
  break;
  case 37:this.$ = $$[$0-3+1-1].concat([$$[$0-3+3-1]]);
  break;
  case 38:this.$ = yytext;
  break;
  case 39:this.$ = ["NUMBER", yytext];
  break;
  case 40:this.$ = ["BOOLEAN", yytext];
  break;
  case 41:this.$ = ["REGEX", yytext];
  break;
  case 42:this.$ = ["STRING", yytext];
  break;
  case 43:this.$ = ["Assign", $$[$0-3+1-1], $$[$0-3+3-1]];
  break;
  case 44:this.$ = ["Assign", $$[$0-3+1-1], $$[$0-3+3-1]];
  break;
  case 45:this.$ = ["Property", []];
  break;
  case 46:this.$ = $$[$0-1+1-1];
  break;
  case 47:this.$ = ["Property", $$[$0-3+1-1], $$[$0-3+3-1]];
  break;
  case 48:this.$ = ["Property", $$[$0-4+1-1], 3];
  break;
  case 49:this.$ = $$[$0-1+1-1];
  break;
  case 50:this.$ = ["Block", $$[$0-3+2-1]];
  break;
  case 51:this.$ = false;
  break;
  case 52:this.$ = ["Function", [], $$[$0-2+2-1]];
  break;
  case 53:this.$ = ["Function", [$$[$0-3+1-1]], $$[$0-3+3-1]];
  break;
  case 54:this.$ = ["Function", [$$[$0-5+1-1], $$[$0-5+3-1]], $$[$0-5+5-1]];
  break;
  case 55:this.$ = $$[$0-1+1-1];
  break;
  case 56:this.$ = $$[$0-1+1-1];
  break;
  case 57:this.$ = [$$[$0-1+1-1]];
  break;
  case 58:this.$ = $$[$0-3+1-1].concat($$[$0-3+3-1]);
  break;
  case 59:this.$ = ["Splat", $$[$0-2+1-1][1]];
  break;
  case 60:this.$ = ["ID", yytext];
  break;
  }
  },
  table: [{"1":[[2,2]],"2":1,"3":2,"4":3,"6":4,"9":[[1,5]],"10":6,"11":7,"12":8,"13":9,"14":10,"15":11,"16":12,"17":13,"18":18,"25":[[1,20]],"30":[[1,21]],"37":[[1,14]],"38":[[1,15]],"39":[[1,16]],"40":[[1,17]],"44":[[1,19]],"49":[[1,22]]},{"1":[[3]]},{"1":[[2,1]],"4":23,"6":4,"9":[[1,5]],"10":6,"11":7,"12":8,"13":9,"14":10,"15":11,"16":12,"17":13,"18":18,"25":[[1,20]],"30":[[1,21]],"37":[[1,14]],"38":[[1,15]],"39":[[1,16]],"40":[[1,17]],"44":[[1,19]],"49":[[1,22]]},{"5":[[1,24]]},{"5":[[2,7]],"7":[[1,25]],"8":[[1,26]],"21":[[1,28]],"24":27,"36":[[1,29]]},{"5":[[2,8]]},{"5":[[2,9]],"7":[[2,9]],"8":[[2,9]],"20":[[2,9]],"21":[[2,9]],"23":[[2,9]],"27":[[2,9]],"32":[[2,9]],"36":[[2,9]]},{"5":[[2,10]],"7":[[2,10]],"8":[[2,10]],"20":[[2,10]],"21":[[1,30]],"23":[[2,10]],"25":[[1,31]],"27":[[2,10]],"32":[[2,10]],"34":[[1,32]],"36":[[2,10]],"41":[[1,33]]},{"5":[[2,11]],"7":[[2,11]],"8":[[2,11]],"20":[[2,11]],"21":[[2,11]],"23":[[2,11]],"27":[[2,11]],"32":[[2,11]],"36":[[2,11]]},{"5":[[2,12]],"7":[[2,12]],"8":[[2,12]],"20":[[2,12]],"21":[[2,12]],"23":[[2,12]],"27":[[2,12]],"32":[[2,12]],"36":[[2,12]]},{"5":[[2,13]],"7":[[2,13]],"8":[[2,13]],"20":[[2,13]],"21":[[2,13]],"23":[[2,13]],"27":[[2,13]],"32":[[2,13]],"36":[[2,13]]},{"5":[[2,14]],"7":[[2,14]],"8":[[2,14]],"20":[[2,14]],"21":[[2,14]],"23":[[2,14]],"27":[[2,14]],"32":[[2,14]],"36":[[2,14]]},{"5":[[2,15]],"7":[[2,15]],"8":[[2,15]],"20":[[2,15]],"21":[[2,15]],"23":[[2,15]],"27":[[2,15]],"32":[[2,15]],"36":[[2,15]]},{"5":[[2,16]],"7":[[2,16]],"8":[[2,16]],"20":[[2,16]],"21":[[2,16]],"23":[[2,16]],"27":[[2,16]],"32":[[2,16]],"36":[[2,16]]},{"5":[[2,39]],"7":[[2,39]],"8":[[2,39]],"20":[[2,39]],"21":[[2,39]],"23":[[2,39]],"27":[[2,39]],"32":[[2,39]],"36":[[2,39]]},{"5":[[2,40]],"7":[[2,40]],"8":[[2,40]],"20":[[2,40]],"21":[[2,40]],"23":[[2,40]],"27":[[2,40]],"32":[[2,40]],"36":[[2,40]]},{"5":[[2,41]],"7":[[2,41]],"8":[[2,41]],"20":[[2,41]],"21":[[2,41]],"23":[[2,41]],"27":[[2,41]],"32":[[2,41]],"36":[[2,41]]},{"5":[[2,42]],"7":[[2,42]],"8":[[2,42]],"20":[[2,42]],"21":[[2,42]],"23":[[2,42]],"27":[[2,42]],"32":[[2,42]],"36":[[2,42]]},{"5":[[2,46]],"6":38,"7":[[2,46]],"8":[[2,46]],"10":6,"11":7,"12":8,"13":9,"14":10,"15":11,"16":12,"17":13,"18":18,"19":[[1,36]],"20":[[2,46]],"21":[[2,46]],"22":37,"23":[[1,35]],"25":[[1,20]],"27":[[2,46]],"30":[[1,21]],"32":[[2,46]],"34":[[2,46]],"36":[[2,46]],"37":[[1,14]],"38":[[1,15]],"39":[[1,16]],"40":[[1,17]],"41":[[2,46]],"44":[[1,34]],"49":[[1,22]]},{"5":[[2,51]],"6":40,"7":[[2,51]],"8":[[2,51]],"10":6,"11":7,"12":8,"13":9,"14":10,"15":11,"16":12,"17":13,"18":18,"20":[[2,51]],"21":[[2,51]],"23":[[2,51]],"25":[[1,20]],"27":[[2,51]],"28":[[1,41]],"30":[[1,21]],"32":[[2,51]],"36":[[2,51]],"37":[[1,14]],"38":[[1,15]],"39":[[1,16]],"40":[[1,17]],"43":39,"44":[[1,19]],"49":[[1,22]]},{"6":44,"10":6,"11":7,"12":8,"13":9,"14":10,"15":11,"16":12,"17":13,"18":18,"25":[[1,20]],"26":42,"28":[[1,43]],"30":[[1,21]],"37":[[1,14]],"38":[[1,15]],"39":[[1,16]],"40":[[1,17]],"44":[[1,19]],"49":[[1,22]]},{"18":48,"28":[[1,46]],"31":45,"33":47,"35":[[1,49]],"49":[[1,22]]},{"5":[[2,60]],"7":[[2,60]],"8":[[2,60]],"19":[[2,60]],"20":[[2,60]],"21":[[2,60]],"23":[[2,60]],"25":[[2,60]],"27":[[2,60]],"30":[[2,60]],"32":[[2,60]],"34":[[2,60]],"36":[[2,60]],"37":[[2,60]],"38":[[2,60]],"39":[[2,60]],"40":[[2,60]],"41":[[2,60]],"44":[[2,60]],"48":[[2,60]],"49":[[2,60]]},{"5":[[1,50]]},{"1":[[2,3]],"9":[[2,3]],"25":[[2,3]],"29":[[2,3]],"30":[[2,3]],"37":[[2,3]],"38":[[2,3]],"39":[[2,3]],"40":[[2,3]],"44":[[2,3]],"49":[[2,3]]},{"6":51,"10":6,"11":7,"12":8,"13":9,"14":10,"15":11,"16":12,"17":13,"18":18,"25":[[1,20]],"30":[[1,21]],"37":[[1,14]],"38":[[1,15]],"39":[[1,16]],"40":[[1,17]],"44":[[1,19]],"49":[[1,22]]},{"6":52,"10":6,"11":7,"12":8,"13":9,"14":10,"15":11,"16":12,"17":13,"18":18,"25":[[1,20]],"30":[[1,21]],"37":[[1,14]],"38":[[1,15]],"39":[[1,16]],"40":[[1,17]],"44":[[1,19]],"49":[[1,22]]},{"6":53,"10":6,"11":7,"12":8,"13":9,"14":10,"15":11,"16":12,"17":13,"18":18,"25":[[1,20]],"30":[[1,21]],"37":[[1,14]],"38":[[1,15]],"39":[[1,16]],"40":[[1,17]],"44":[[1,19]],"49":[[1,22]]},{"18":54,"49":[[1,22]]},{"25":[[2,38]],"30":[[2,38]],"37":[[2,38]],"38":[[2,38]],"39":[[2,38]],"40":[[2,38]],"44":[[2,38]],"49":[[2,38]]},{"18":55,"49":[[1,22]]},{"6":56,"10":6,"11":7,"12":8,"13":9,"14":10,"15":11,"16":12,"17":13,"18":18,"25":[[1,20]],"30":[[1,21]],"37":[[1,14]],"38":[[1,15]],"39":[[1,16]],"40":[[1,17]],"44":[[1,19]],"49":[[1,22]]},{"6":57,"10":6,"11":7,"12":8,"13":9,"14":10,"15":11,"16":12,"17":13,"18":18,"25":[[1,20]],"30":[[1,21]],"37":[[1,14]],"38":[[1,15]],"39":[[1,16]],"40":[[1,17]],"44":[[1,19]],"49":[[1,22]]},{"6":58,"10":6,"11":7,"12":8,"13":9,"14":10,"15":11,"16":12,"17":13,"18":18,"25":[[1,20]],"30":[[1,21]],"37":[[1,14]],"38":[[1,15]],"39":[[1,16]],"40":[[1,17]],"44":[[1,19]],"49":[[1,22]]},{"5":[[2,51]],"6":40,"7":[[2,51]],"8":[[2,51]],"10":6,"11":7,"12":8,"13":9,"14":10,"15":11,"16":12,"17":13,"18":18,"20":[[2,51]],"21":[[2,51]],"23":[[2,51]],"25":[[1,20]],"27":[[2,51]],"28":[[1,41]],"30":[[1,21]],"32":[[2,51]],"36":[[2,51]],"37":[[1,14]],"38":[[1,15]],"39":[[1,16]],"40":[[1,17]],"43":59,"44":[[1,19]],"49":[[1,22]]},{"18":61,"45":60,"49":[[1,22]]},{"6":38,"10":6,"11":7,"12":8,"13":9,"14":10,"15":11,"16":12,"17":13,"18":18,"20":[[1,62]],"22":63,"25":[[1,20]],"30":[[1,21]],"37":[[1,14]],"38":[[1,15]],"39":[[1,16]],"40":[[1,17]],"44":[[1,19]],"49":[[1,22]]},{"5":[[2,20]],"7":[[2,20]],"8":[[2,20]],"20":[[2,20]],"21":[[2,20]],"23":[[1,64]],"27":[[2,20]],"32":[[2,20]],"36":[[2,20]]},{"5":[[2,23]],"7":[[2,23]],"8":[[2,23]],"20":[[2,23]],"21":[[1,28]],"23":[[2,23]],"24":27,"27":[[2,23]],"32":[[2,23]],"36":[[1,29]]},{"5":[[2,52]],"7":[[2,52]],"8":[[2,52]],"20":[[2,52]],"21":[[2,52]],"23":[[2,52]],"27":[[2,52]],"32":[[2,52]],"36":[[2,52]]},{"5":[[2,49]],"7":[[2,49]],"8":[[2,49]],"20":[[2,49]],"21":[[1,28]],"23":[[2,49]],"24":27,"27":[[2,49]],"32":[[2,49]],"36":[[1,29]]},{"3":65,"4":3,"6":4,"9":[[1,5]],"10":6,"11":7,"12":8,"13":9,"14":10,"15":11,"16":12,"17":13,"18":18,"25":[[1,20]],"30":[[1,21]],"37":[[1,14]],"38":[[1,15]],"39":[[1,16]],"40":[[1,17]],"44":[[1,19]],"49":[[1,22]]},{"5":[[1,68]],"23":[[1,67]],"27":[[1,66]]},{"6":44,"10":6,"11":7,"12":8,"13":9,"14":10,"15":11,"16":12,"17":13,"18":18,"25":[[1,20]],"26":69,"30":[[1,21]],"37":[[1,14]],"38":[[1,15]],"39":[[1,16]],"40":[[1,17]],"44":[[1,19]],"49":[[1,22]]},{"5":[[2,28]],"21":[[1,28]],"23":[[2,28]],"24":27,"27":[[2,28]],"36":[[1,29]]},{"5":[[1,72]],"23":[[1,71]],"32":[[1,70]]},{"18":48,"31":73,"33":47,"35":[[1,49]],"49":[[1,22]]},{"5":[[2,35]],"23":[[2,35]],"32":[[2,35]]},{"34":[[1,74]]},{"34":[[1,75]]},{"1":[[2,4]],"9":[[2,4]],"25":[[2,4]],"29":[[2,4]],"30":[[2,4]],"37":[[2,4]],"38":[[2,4]],"39":[[2,4]],"40":[[2,4]],"44":[[2,4]],"49":[[2,4]]},{"5":[[2,5]],"21":[[1,28]],"24":27,"36":[[1,29]]},{"5":[[2,6]],"21":[[1,28]],"24":27,"36":[[1,29]]},{"5":[[2,25]],"7":[[2,25]],"8":[[2,25]],"20":[[2,25]],"21":[[1,28]],"23":[[2,25]],"24":27,"27":[[2,25]],"32":[[2,25]],"36":[[1,29]]},{"6":38,"10":6,"11":7,"12":8,"13":9,"14":10,"15":11,"16":12,"17":13,"18":18,"19":[[1,76]],"22":77,"25":[[1,20]],"30":[[1,21]],"37":[[1,14]],"38":[[1,15]],"39":[[1,16]],"40":[[1,17]],"44":[[1,19]],"49":[[1,22]]},{"5":[[2,47]],"7":[[2,47]],"8":[[2,47]],"20":[[2,47]],"21":[[2,47]],"23":[[2,47]],"25":[[2,47]],"27":[[2,47]],"32":[[2,47]],"34":[[2,47]],"36":[[2,47]],"41":[[2,47]]},{"21":[[1,28]],"24":27,"27":[[1,78]],"36":[[1,29]]},{"5":[[2,43]],"7":[[2,43]],"8":[[2,43]],"20":[[2,43]],"21":[[1,28]],"23":[[2,43]],"24":27,"27":[[2,43]],"32":[[2,43]],"36":[[1,29]]},{"5":[[2,44]],"7":[[2,44]],"8":[[2,44]],"20":[[2,44]],"21":[[1,28]],"23":[[2,44]],"24":27,"27":[[2,44]],"32":[[2,44]],"36":[[1,29]]},{"5":[[2,53]],"7":[[2,53]],"8":[[2,53]],"20":[[2,53]],"21":[[2,53]],"23":[[2,53]],"27":[[2,53]],"32":[[2,53]],"36":[[2,53]]},{"44":[[1,79]]},{"48":[[1,80]]},{"5":[[2,17]],"7":[[2,17]],"8":[[2,17]],"20":[[2,17]],"21":[[2,17]],"23":[[2,17]],"27":[[2,17]],"32":[[2,17]],"36":[[2,17]]},{"20":[[1,81]],"23":[[1,64]]},{"6":82,"10":6,"11":7,"12":8,"13":9,"14":10,"15":11,"16":12,"17":13,"18":18,"25":[[1,20]],"30":[[1,21]],"37":[[1,14]],"38":[[1,15]],"39":[[1,16]],"40":[[1,17]],"44":[[1,19]],"49":[[1,22]]},{"4":23,"6":4,"9":[[1,5]],"10":6,"11":7,"12":8,"13":9,"14":10,"15":11,"16":12,"17":13,"18":18,"25":[[1,20]],"29":[[1,83]],"30":[[1,21]],"37":[[1,14]],"38":[[1,15]],"39":[[1,16]],"40":[[1,17]],"44":[[1,19]],"49":[[1,22]]},{"5":[[2,26]],"7":[[2,26]],"8":[[2,26]],"20":[[2,26]],"21":[[2,26]],"23":[[2,26]],"27":[[2,26]],"32":[[2,26]],"36":[[2,26]]},{"6":84,"10":6,"11":7,"12":8,"13":9,"14":10,"15":11,"16":12,"17":13,"18":18,"25":[[1,20]],"30":[[1,21]],"37":[[1,14]],"38":[[1,15]],"39":[[1,16]],"40":[[1,17]],"44":[[1,19]],"49":[[1,22]]},{"6":85,"10":6,"11":7,"12":8,"13":9,"14":10,"15":11,"16":12,"17":13,"18":18,"25":[[1,20]],"30":[[1,21]],"37":[[1,14]],"38":[[1,15]],"39":[[1,16]],"40":[[1,17]],"44":[[1,19]],"49":[[1,22]]},{"5":[[1,86]],"23":[[1,67]]},{"5":[[2,31]],"7":[[2,31]],"8":[[2,31]],"20":[[2,31]],"21":[[2,31]],"23":[[2,31]],"27":[[2,31]],"32":[[2,31]],"36":[[2,31]]},{"18":48,"33":87,"35":[[1,49]],"49":[[1,22]]},{"18":48,"33":88,"35":[[1,49]],"49":[[1,22]]},{"5":[[1,89]],"23":[[1,71]]},{"6":90,"10":6,"11":7,"12":8,"13":9,"14":10,"15":11,"16":12,"17":13,"18":18,"25":[[1,20]],"30":[[1,21]],"37":[[1,14]],"38":[[1,15]],"39":[[1,16]],"40":[[1,17]],"44":[[1,19]],"49":[[1,22]]},{"6":91,"10":6,"11":7,"12":8,"13":9,"14":10,"15":11,"16":12,"17":13,"18":18,"25":[[1,20]],"30":[[1,21]],"37":[[1,14]],"38":[[1,15]],"39":[[1,16]],"40":[[1,17]],"44":[[1,19]],"49":[[1,22]]},{"6":38,"10":6,"11":7,"12":8,"13":9,"14":10,"15":11,"16":12,"17":13,"18":18,"20":[[1,92]],"22":93,"25":[[1,20]],"30":[[1,21]],"37":[[1,14]],"38":[[1,15]],"39":[[1,16]],"40":[[1,17]],"44":[[1,19]],"49":[[1,22]]},{"5":[[2,22]],"7":[[2,22]],"8":[[2,22]],"20":[[2,22]],"21":[[2,22]],"23":[[1,64]],"27":[[2,22]],"32":[[2,22]],"36":[[2,22]]},{"5":[[2,48]],"7":[[2,48]],"8":[[2,48]],"20":[[2,48]],"21":[[2,48]],"23":[[2,48]],"25":[[2,48]],"27":[[2,48]],"32":[[2,48]],"34":[[2,48]],"36":[[2,48]],"41":[[2,48]]},{"5":[[2,51]],"6":40,"7":[[2,51]],"8":[[2,51]],"10":6,"11":7,"12":8,"13":9,"14":10,"15":11,"16":12,"17":13,"18":18,"20":[[2,51]],"21":[[2,51]],"23":[[2,51]],"25":[[1,20]],"27":[[2,51]],"28":[[1,41]],"30":[[1,21]],"32":[[2,51]],"36":[[2,51]],"37":[[1,14]],"38":[[1,15]],"39":[[1,16]],"40":[[1,17]],"43":94,"44":[[1,19]],"49":[[1,22]]},{"44":[[2,59]]},{"5":[[2,19]],"7":[[2,19]],"8":[[2,19]],"20":[[2,19]],"21":[[2,19]],"23":[[2,19]],"27":[[2,19]],"32":[[2,19]],"36":[[2,19]]},{"5":[[2,24]],"7":[[2,24]],"8":[[2,24]],"20":[[2,24]],"21":[[1,28]],"23":[[2,24]],"24":27,"27":[[2,24]],"32":[[2,24]],"36":[[1,29]]},{"5":[[2,50]],"7":[[2,50]],"8":[[2,50]],"20":[[2,50]],"21":[[2,50]],"23":[[2,50]],"27":[[2,50]],"32":[[2,50]],"36":[[2,50]]},{"5":[[2,29]],"21":[[1,28]],"23":[[2,29]],"24":27,"27":[[2,29]],"36":[[1,29]]},{"5":[[2,30]],"21":[[1,28]],"23":[[2,30]],"24":27,"27":[[2,30]],"36":[[1,29]]},{"6":85,"10":6,"11":7,"12":8,"13":9,"14":10,"15":11,"16":12,"17":13,"18":18,"25":[[1,20]],"29":[[1,95]],"30":[[1,21]],"37":[[1,14]],"38":[[1,15]],"39":[[1,16]],"40":[[1,17]],"44":[[1,19]],"49":[[1,22]]},{"5":[[2,36]],"23":[[2,36]],"32":[[2,36]]},{"5":[[2,37]],"23":[[2,37]],"32":[[2,37]]},{"18":48,"29":[[1,96]],"33":88,"35":[[1,49]],"49":[[1,22]]},{"5":[[2,33]],"21":[[1,28]],"23":[[2,33]],"24":27,"32":[[2,33]],"36":[[1,29]]},{"5":[[2,34]],"21":[[1,28]],"23":[[2,34]],"24":27,"32":[[2,34]],"36":[[1,29]]},{"5":[[2,18]],"7":[[2,18]],"8":[[2,18]],"20":[[2,18]],"21":[[2,18]],"23":[[2,18]],"27":[[2,18]],"32":[[2,18]],"36":[[2,18]]},{"20":[[1,97]],"23":[[1,64]]},{"5":[[2,54]],"7":[[2,54]],"8":[[2,54]],"20":[[2,54]],"21":[[2,54]],"23":[[2,54]],"27":[[2,54]],"32":[[2,54]],"36":[[2,54]]},{"5":[[1,98]]},{"5":[[1,99]]},{"5":[[2,21]],"7":[[2,21]],"8":[[2,21]],"20":[[2,21]],"21":[[2,21]],"23":[[2,21]],"27":[[2,21]],"32":[[2,21]],"36":[[2,21]]},{"27":[[1,100]]},{"32":[[1,101]]},{"5":[[2,27]],"7":[[2,27]],"8":[[2,27]],"20":[[2,27]],"21":[[2,27]],"23":[[2,27]],"27":[[2,27]],"32":[[2,27]],"36":[[2,27]]},{"5":[[2,32]],"7":[[2,32]],"8":[[2,32]],"20":[[2,32]],"21":[[2,32]],"23":[[2,32]],"27":[[2,32]],"32":[[2,32]],"36":[[2,32]]}],
  parseError: function parseError(str, hash) {
      throw new Error(str);
  },
  parse: function parse(input) {
      var self = this,
          stack = [0],
          vstack = [null], // semantic value stack
          table = this.table,
          yytext = '',
          yylineno = 0;
  
      this.lexer.setInput(input);
      this.lexer.yy = this.yy;
  
      var parseError = this.yy.parseError = this.yy.parseError || this.parseError;
  
      function lex() {
          var token;
          token = self.lexer.lex();
          return token ? self.symbols_[token] : 1; // EOF = 1
      };
  
      var symbol, state, action, a, r, yyval={},p,len,ip=0,newState, expected;
      symbol = lex();
      while (true) {
          this.log('stack:',JSON.stringify(stack), '\n\t\t\tinput:', this.lexer._input);
          this.log('vstack:',JSON.stringify(vstack));
          // set first input
          state = stack[stack.length-1];
          // read action for current state and first input
          action = table[state] && table[state][symbol];
  
          if (typeof action == 'undefined' || !action.length || !action[0]) {
              expected = [];
              for (p in table[state]) if (this.terminals_[p] && p != 1) {
                  expected.push("'"+this.terminals_[p]+"'");
              }
              self.log("stack:",JSON.stringify(stack), 'symbol:',symbol, 'input', this.lexer.upcomingInput());
              parseError('Parse error on line '+(yylineno+1)+'. Expecting: '+expected.join(', ')+"\n"+this.lexer.showPosition(),
                      {text: this.lexer.match, token: symbol, line: this.lexer.yylineno});
          }
  
          this.log('action:',action);
  
          // this shouldn't happen, unless resolve defaults are off
          if (action.length > 1)
              throw new Error('Parse Error: multiple actions possible at state: '+state+', token: '+symbol);
  
          a = action[0];
  
          switch (a[0]) {
  
              case 1: // shift
  
                  stack.push(symbol);++ip;
                  yytext = this.lexer.yytext;
                  yylineno = this.lexer.yylineno;
                  symbol = lex();
                  vstack.push(null); // semantic values or junk only, no terminals
                  stack.push(a[1]); // push state
                  break;
  
              case 2: // reduce
  
                  len = this.productions_[a[1]][1];
                  this.log('reduce by: ', this.productions ? this.productions[a[1]] : a[1]);
  
                  // perform semantic action
                  yyval.$ = vstack[vstack.length-len]; // default to $$ = $1
                  r = this.performAction.call(yyval, yytext, yylineno, this.yy, a[1], vstack);
  
                  if (r != undefined) {
                      return r;
                  }
  
                  this.log('yyval=',JSON.stringify(yyval.$));
  
                  // pop off stack
                  if (len) {
                      this.log('production length:',len);
                      stack = stack.slice(0,-1*len*2);
                      vstack = vstack.slice(0, -1*len);
                  }
  
                  stack.push(this.productions_[a[1]][0]);    // push nonterminal (reduce)
                  vstack.push(yyval.$);
                  // goto new state = table[STATE][NONTERMINAL]
                  newState = table[stack[stack.length-2]][stack[stack.length-1]];
                  stack.push(newState);
                  break;
  
              case 3: // accept
  
                  this.log('stack:',stack, '\n\tinput:', this.lexer._input);
                  this.log('vstack:',JSON.stringify(vstack));
                  return true;
          }
  
      }
  
      return true;
  }};
  
  var lexer = {
      lex: function lex() {
        var token;
        token = this.tokens[this.pos] || [""];
        this.pos++;
        this.yylineno = token && token[1] && token[1][1];
        this.yytext = token[2];
        return token[0];
      },
      setInput: function setInput(tokens) {
        this.tokens = tokens;
        return this.pos = 0;
      },
      upcomingInput: function upcomingInput() {
        return "";
      },
      showPosition: function showPosition() {
        return this.pos;
      }
  };
  
  parser.lexer = lexer; return parser; })();

      root = (typeof exports !== "undefined" && exports !== null) ? exports : this;
      CoffeePot = (root.CoffeePot = (typeof root.CoffeePot !== "undefined" && root.CoffeePot !== null) ? root.CoffeePot : {
      });
      CoffeePot.parse = function parse(tokens) {
        return parser.parse(tokens);
      };
      // Define Object.keys for browsers that don't have it.
      if (!((typeof Object.keys !== "undefined" && Object.keys !== null))) {
        return (Object.keys = (function(obj) {
          var __i, __j, key;
          __i = []; __j = obj;
          for (key in __j) {
            value = __j[key];
            if (__hasProp.call(__j, key)) {
              __i.push(key);
            }
          }
          return __i;
        }));
      }
    
}());
// coffeepot/generator.coffee

(function(){
  var CoffeePot, Generators, block_indent, block_vars, render, root, sub_compile;
  var __hasProp = Object.prototype.hasOwnProperty;
  root = (typeof exports !== "undefined" && exports !== null) ? exports : this;
  CoffeePot = (root.CoffeePot = (typeof root.CoffeePot !== "undefined" && root.CoffeePot !== null) ? root.CoffeePot : {
  });
  CoffeePot.tokenize = (typeof CoffeePot.tokenize !== "undefined" && CoffeePot.tokenize !== null) ? CoffeePot.tokenize : require('coffeepot/lexer').CoffeePot.tokenize;
  CoffeePot.parse = (typeof CoffeePot.parse !== "undefined" && CoffeePot.parse !== null) ? CoffeePot.parse : require('coffeepot/parser').CoffeePot.parse;
  block_vars = [];
  block_indent = function block_indent(text) {
    var __a, __b, __c, line;
    return ((function() {
      __a = []; __b = text.split("\n");
      for (__c = 0; __c < __b.length; __c++) {
        line = __b[__c];
        __a.push(("  " + line));
      }
      return __a;
    }).call(this)).join("\n");
  };
  sub_compile = function sub_compile(expr) {
    var tokens, tree;
    tokens = CoffeePot.tokenize(expr);
    tree = CoffeePot.parse(tokens)[1][1][0];
    return render(tree);
  };
  Generators = {
    Root: function Root(block) {
      var __a, __b, __c, content, exists, name, names;
      content = this(block);
      names = (function() {
        __a = []; __b = block_vars.pop();
        for (name in __b) {
          exists = __b[name];
          if (__hasProp.call(__b, name)) {
            __a.push(name);
          }
        }
        return __a;
      }).call(this);
      if (names.length > 0) {
        content = "var " + names.join(", ") + ";\n" + content;
        content = "\n" + block_indent(content) + "\n";
        content = "(function () {" + content + "}());";
      }
      __c = content;
      return Root === this.constructor ? this : __c;
    },
    Not: function Not(expr) {
      var __a;
      __a = "!(" + this(expr) + ")";
      return Not === this.constructor ? this : __a;
    },
    Block: function Block(contents) {
      var __a, content, last_comment, self;
      self = this;
      block_vars.push({
      });
      last_comment = false;
      content = contents.map(function(statement) {
        var type;
        type = statement[0];
        content = self(statement);
        content = (function() {
          if (type === "COMMENT") {
            return (last_comment ? "" : "\n") + content;
          } else if (type === "If") {
            return content;
          } else {
            return content + ";";
          }
        }).call(this);
        last_comment = type === "COMMENT";
        return content;
      });
      content = content.join("\n");
      __a = content;
      return Block === this.constructor ? this : __a;
    },
    Property: function Property(source, id) {
      var __a;
      __a = this(source) + "." + this(id);
      return Property === this.constructor ? this : __a;
    },
    Function: function Function(args, content, name) {
      var __a, __b, __c, __d, __e, __f, __g, __h, __i, arg, exists, names, varname;
      name = (typeof name !== "undefined" && name !== null) ? name : "";
      content = (function() {
        if (content) {
          if (content[0] === "Block") {
            block_vars.push({
            });
            content = this(content);
            names = (function() {
              __a = []; __b = block_vars.pop();
              for (varname in __b) {
                exists = __b[varname];
                if (__hasProp.call(__b, varname)) {
                  __a.push(varname);
                }
              }
              return __a;
            }).call(this);
            names.length > 0 ? (content = "var " + names.join(", ") + ";\n" + content) : null;
            __c = "\n" + block_indent(content) + "\n";
            return Function === this.constructor ? this : __c;
          } else {
            __d = " return " + this(content) + "; ";
            return Function === this.constructor ? this : __d;
          }
        } else {
          __e = "";
          return Function === this.constructor ? this : __e;
        }
      }).call(this);
      __f = "function " + name + "(" + ((function() {
        __g = []; __h = args;
        for (__i = 0; __i < __h.length; __i++) {
          arg = __h[__i];
          __g.push(arg[1]);
        }
        return __g;
      }).call(this)).join(", ") + ") {" + content + "}";
      return Function === this.constructor ? this : __f;
    },
    COMMENT: function COMMENT(content) {
      var __a;
      __a = "//" + content;
      return COMMENT === this.constructor ? this : __a;
    },
    STRING: function STRING(content) {
      var __a, __b, character, code, done, len, level, output, pos, quote, start;
      if (content.match(/[^\\]?#{.*[^\\]}/)) {
        output = [];
        pos = 0;
        len = content.length;
        while (pos < len) {
          // Grab plain text chunks
          start = pos;
          pos = content.substr(pos, len).indexOf("#{");
          console.log(pos);
          if (pos < 0) {
            pos = len;
            output.push(JSON.stringify(content.substr(start, len - start)));
            continue;
          }
          pos += start;
          output.push(JSON.stringify(content.substr(start, pos - start)));
          pos += 2;
          start = pos;
          level = 1;
          quote = false;
          done = false;
          while (!done && pos < len) {
            character = content.substr(pos, 1);
            pos++;
            if (character === "\\") {
              pos++;
              continue;
            }
            if (quote) {
              if (character === quote) {
                quote = false;
              }
              continue;
            }
            if (character === "{") {
              level++;
            } else if (character === "}") {
              level--;
              if (level === 0) {
                done = true;
              }
            } else if (character === "\"" || character === "'") {
              quote = character;
            }
          }
          code = content.substr(start, pos - start - 1);
          output.push(sub_compile(code));
        }
        __a = output.join(" + ");
        return STRING === this.constructor ? this : __a;
      } else {
        __b = JSON.stringify(content);
        return STRING === this.constructor ? this : __b;
      }
    },
    If: function If(condition, exp1, exp2) {
      var __a;
      __a = "if (" + this(condition) + ") { " + this(exp1) + "; }";
      return If === this.constructor ? this : __a;
    },
    Assign: function Assign(id, exp) {
      var __a, name;
      if (id[0] === "ID") {
        name = id[1];
        exp[0] === "Function" ? (exp[3] = name) : null;
        block_vars[block_vars.length - 1][name] = true;
      }
      __a = this(id) + " = " + this(exp);
      return Assign === this.constructor ? this : __a;
    },
    Source: function Source(parts) {
      var __a, __b, __c, __d, part;
      __a = ((function() {
        __b = []; __c = parts;
        for (__d = 0; __d < __c.length; __d++) {
          part = __c[__d];
          __b.push(part[1]);
        }
        return __b;
      }).call(this)).join("");
      return Source === this.constructor ? this : __a;
    },
    Call: function Call(target, message, args) {
      var __a, call, self;
      self = this;
      args = args.map(function(arg) {
        return self(arg);
      });
      call = this(message) + "(" + args.join(", ") + ")";
      __a = target ? this(target) + "." + call : call;
      return Call === this.constructor ? this : __a;
    },
    ExpressionList: function ExpressionList(items) {
      var __a, __b, __c, __d, item, self;
      self = this;
      __a = ((function() {
        __b = []; __c = items;
        for (__d = 0; __d < __c.length; __d++) {
          item = __c[__d];
          __b.push(self(item));
        }
        return __b;
      }).call(this)).join(", ");
      return ExpressionList === this.constructor ? this : __a;
    },
    Compound: function Compound(parts) {
      var __a, __b, __c, __d, part, self;
      self = this;
      __a = ((function() {
        __b = []; __c = parts;
        for (__d = 0; __d < __c.length; __d++) {
          part = __c[__d];
          __b.push(this(part));
        }
        return __b;
      }).call(this)).join("");
      return Compound === this.constructor ? this : __a;
    },
    Binop: function Binop(op, exp1, exp2) {
      var __a, __b, __c, content, first, second;
      first = this(exp1);
      second = this(exp2);
      __a = content = (function() {
        if (op === "?") {
          __b = '(typeof ' + first + ' !== "undefined" && ' + first + ' !== null)' + ' ? ' + first + ' : ' + second;
          return Binop === this.constructor ? this : __b;
        } else {
          if (op === "==") {
            op = "===";
          } else if (op === "!=") {
            op = "!==";
          }
          __c = first + " " + op + " " + second;
          return Binop === this.constructor ? this : __c;
        }
      }).call(this);
      return Binop === this.constructor ? this : __a;
    },
    Array: function Array(items) {
      var __a, __b, __c, __d, item, self;
      self = this;
      __a = "[" + ((function() {
        __b = []; __c = items;
        for (__d = 0; __d < __c.length; __d++) {
          item = __c[__d];
          __b.push(self(item));
        }
        return __b;
      }).call(this)).join(", ") + "]";
      return Array === this.constructor ? this : __a;
    },
    Object: function Object(items) {
      var __a, __b, __c, __d, item, pairs, self;
      self = this;
      pairs = (function() {
        __a = []; __b = items;
        for (__c = 0; __c < __b.length; __c++) {
          item = __b[__c];
          __a.push((self(item[0]) + ": " + self(item[1])));
        }
        return __a;
      }).call(this);
      __d = "{\n" + block_indent(pairs.join(",\n")) + "\n}";
      return Object === this.constructor ? this : __d;
    }
  };
  render = function render(node) {
    var __a, args, name;
    if (!(node)) {
      return "";
    }
    __a = node;
    name = __a[0];
    args = Array.prototype.slice.call(__a, 1);
    if (Generators[name]) {
      return Generators[name].apply(render, args);
    } else if ((typeof name === "string" && name.match(/^[A-Z]+$/))) {
      return args[0];
    } else {
      return JSON.stringify(node);
    }
  };
  CoffeePot.generate = render;
})();// coffeepot.coffee

(function(){
  var CoffeePot, root;
  root = (typeof exports !== "undefined" && exports !== null) ? exports : this;
  CoffeePot = (root.CoffeePot = (typeof root.CoffeePot !== "undefined" && root.CoffeePot !== null) ? root.CoffeePot : {
  });
  CoffeePot.tokenize = (typeof CoffeePot.tokenize !== "undefined" && CoffeePot.tokenize !== null) ? CoffeePot.tokenize : require('coffeepot/lexer').CoffeePot.tokenize;
  CoffeePot.parse = (typeof CoffeePot.parse !== "undefined" && CoffeePot.parse !== null) ? CoffeePot.parse : require('coffeepot/parser').CoffeePot.parse;
  CoffeePot.generate = (typeof CoffeePot.generate !== "undefined" && CoffeePot.generate !== null) ? CoffeePot.generate : require('coffeepot/generator').CoffeePot.generate;
  CoffeePot.compile = function compile(code) {
    var __a, after, before, line_no, message, num, token, token_after, token_before, tokens, tree;
    tokens = CoffeePot.tokenize(code);
    try {
      tree = CoffeePot.parse(tokens);
    } catch (e) {
      __a = e.message.split("\n");
      message = __a[0];
      num = __a[1];
      num = parseInt(num) - 1;
      if ((token = tokens[num])) {
        line_no = token[1] && (token[1][1] + 1);
        before = code.substr(0, token[1][0]).match(/\n?.*$/)[0];
        after = code.substr(token[1][0], code.length).match(/^.*\n?/)[0];
        token_before = tokens.slice(0, num).filter(function(token) {
          return token[1] && (token[1][1] === line_no - 1);
        });
        token_before = token_before.map(function(token) {
          return token[0];
        });
        token_after = tokens.slice(num, tokens.length).filter(function(token) {
          return token[1] && (token[1][1] === line_no - 1);
        });
        token_after = token_after.map(function(token) {
          return token[0];
        });
        e.message = message + "\n" + "but found '" + token[0] + "'\n" + "Line " + line_no + ": " + JSON.stringify(before) + " !! " + JSON.stringify(after) + "'\n" + "Tokens " + JSON.stringify(token_before) + " !! " + JSON.stringify(token_after);
      }
      throw e;
    }
    return CoffeePot.generate(tree);
  };
})();