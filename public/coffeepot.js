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
    ARROW: /^(->)/,
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
  symbols_: {"Root":2,"Block":3,"Statement":4,"NEWLINE":5,"Expression":6,"if":7,"unless":8,"COMMENT":9,"Literal":10,"Source":11,"Assign":12,"Function":13,"Binop":14,"Array":15,"Object":16,"Call":17,"Id":18,"CallArgs":19,".":20,"(":21,")":22,"Expressionlist":23,"ExpressionList":24,",":25,"Operator":26,"[":27,"ArrayItems":28,"]":29,"INDENT":30,"DEDENT":31,"{":32,"ObjectItems":33,"}":34,"ObjectItem":35,":":36,"String":37,"OPERATOR":38,"NUMBER":39,"BOOLEAN":40,"REGEX":41,"STRING":42,"=":43,"Property":44,"FunctionBody":45,"ARROW":46,"VarList":47,"VarListItem":48,"Splat":49,"DOTDOTDOT":50,"ID":51,"$accept":0,"$end":1},
  terminals_: {"5":"NEWLINE","7":"if","8":"unless","9":"COMMENT","20":".","21":"(","22":")","23":"Expressionlist","25":",","27":"[","29":"]","30":"INDENT","31":"DEDENT","32":"{","34":"}","36":":","37":"String","38":"OPERATOR","39":"NUMBER","40":"BOOLEAN","41":"REGEX","42":"STRING","43":"=","46":"ARROW","50":"DOTDOTDOT","51":"ID"},
  productions_: [0,[2,1],[2,0],[3,2],[3,3],[4,3],[4,3],[4,1],[4,1],[6,1],[6,1],[6,1],[6,1],[6,1],[6,1],[6,1],[6,1],[17,2],[17,4],[19,2],[19,3],[19,1],[24,1],[24,3],[14,3],[15,3],[15,7],[28,1],[28,3],[28,3],[16,3],[16,7],[35,3],[35,3],[33,1],[33,3],[33,3],[26,1],[10,1],[10,1],[10,1],[10,1],[12,3],[12,3],[44,3],[11,1],[11,3],[11,4],[45,1],[45,3],[45,0],[13,2],[13,5],[48,1],[48,1],[47,1],[47,3],[49,2],[18,1]],
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
  case 17:this.$ = ["Call", null, $$[$0-2+1-1], $$[$0-2+2-1]];
  break;
  case 18:this.$ = ["Call", $$[$0-4+1-1], $$[$0-4+3-1], $$[$0-4+4-1]];
  break;
  case 19:this.$ = [];
  break;
  case 20:this.$ = $$[$0-3+2-1];
  break;
  case 21:this.$ = $$[$0-1+1-1];
  break;
  case 22:this.$ = [$$[$0-1+1-1]];
  break;
  case 23:this.$ = $$[$0-3+1-1].concat([$$[$0-3+3-1]]);
  break;
  case 24:this.$ = ["Binop", $$[$0-3+2-1], $$[$0-3+1-1], $$[$0-3+3-1]];
  break;
  case 25:this.$ = ["Array", $$[$0-3+2-1]];
  break;
  case 26:this.$ = ["Array", $$[$0-7+3-1]];
  break;
  case 27:this.$ = [$$[$0-1+1-1]];
  break;
  case 28:this.$ = $$[$0-3+1-1].concat([$$[$0-3+3-1]]);
  break;
  case 29:this.$ = $$[$0-3+1-1].concat([$$[$0-3+3-1]]);
  break;
  case 30:this.$ = ["Object", $$[$0-3+2-1]];
  break;
  case 31:this.$ = ["Object", $$[$0-7+3-1]];
  break;
  case 32:this.$ = [$$[$0-3+1-1], $$[$0-3+3-1]];
  break;
  case 33:this.$ = [$$[$0-3+1-1], $$[$0-3+3-1]];
  break;
  case 34:this.$ = [$$[$0-1+1-1]];
  break;
  case 35:this.$ = $$[$0-3+1-1].concat([$$[$0-3+3-1]]);
  break;
  case 36:this.$ = $$[$0-3+1-1].concat([$$[$0-3+3-1]]);
  break;
  case 37:this.$ = yytext;
  break;
  case 38:this.$ = ["NUMBER", yytext];
  break;
  case 39:this.$ = ["BOOLEAN", yytext];
  break;
  case 40:this.$ = ["REGEX", yytext];
  break;
  case 41:this.$ = ["STRING", yytext];
  break;
  case 42:this.$ = ["Assign", $$[$0-3+1-1], $$[$0-3+3-1]];
  break;
  case 43:this.$ = ["Assign", $$[$0-3+1-1], $$[$0-3+3-1]];
  break;
  case 44:this.$ = ["Property", []];
  break;
  case 45:this.$ = $$[$0-1+1-1];
  break;
  case 46:this.$ = ["Property", $$[$0-3+1-1], $$[$0-3+3-1]];
  break;
  case 47:this.$ = ["Property", $$[$0-4+1-1], 3];
  break;
  case 48:this.$ = $$[$0-1+1-1];
  break;
  case 49:this.$ = ["Block", $$[$0-3+2-1]];
  break;
  case 50:this.$ = false;
  break;
  case 51:this.$ = ["Function", [], $$[$0-2+2-1]];
  break;
  case 52:this.$ = ["Function", $$[$0-5+2-1], $$[$0-5+5-1]];
  break;
  case 53:this.$ = $$[$0-1+1-1];
  break;
  case 54:this.$ = $$[$0-1+1-1];
  break;
  case 55:this.$ = [$$[$0-1+1-1]];
  break;
  case 56:this.$ = $$[$0-3+1-1].concat([$$[$0-3+3-1]]);
  break;
  case 57:this.$ = ["Splat", $$[$0-2+1-1][1]];
  break;
  case 58:this.$ = ["ID", yytext];
  break;
  }
  },
  table: [{"1":[[2,2]],"2":1,"3":2,"4":3,"6":4,"9":[[1,5]],"10":6,"11":7,"12":8,"13":9,"14":10,"15":11,"16":12,"17":13,"18":18,"21":[[1,20]],"27":[[1,21]],"32":[[1,22]],"39":[[1,14]],"40":[[1,15]],"41":[[1,16]],"42":[[1,17]],"46":[[1,19]],"51":[[1,23]]},{"1":[[3]]},{"1":[[2,1]],"4":24,"6":4,"9":[[1,5]],"10":6,"11":7,"12":8,"13":9,"14":10,"15":11,"16":12,"17":13,"18":18,"21":[[1,20]],"27":[[1,21]],"32":[[1,22]],"39":[[1,14]],"40":[[1,15]],"41":[[1,16]],"42":[[1,17]],"46":[[1,19]],"51":[[1,23]]},{"5":[[1,25]]},{"5":[[2,7]],"7":[[1,26]],"8":[[1,27]],"20":[[1,29]],"26":28,"38":[[1,30]]},{"5":[[2,8]]},{"5":[[2,9]],"7":[[2,9]],"8":[[2,9]],"20":[[2,9]],"25":[[2,9]],"29":[[2,9]],"34":[[2,9]],"38":[[2,9]]},{"5":[[2,10]],"7":[[2,10]],"8":[[2,10]],"20":[[1,31]],"25":[[2,10]],"27":[[1,32]],"29":[[2,10]],"34":[[2,10]],"36":[[1,33]],"38":[[2,10]],"43":[[1,34]]},{"5":[[2,11]],"7":[[2,11]],"8":[[2,11]],"20":[[2,11]],"25":[[2,11]],"29":[[2,11]],"34":[[2,11]],"38":[[2,11]]},{"5":[[2,12]],"7":[[2,12]],"8":[[2,12]],"20":[[2,12]],"25":[[2,12]],"29":[[2,12]],"34":[[2,12]],"38":[[2,12]]},{"5":[[2,13]],"7":[[2,13]],"8":[[2,13]],"20":[[2,13]],"25":[[2,13]],"29":[[2,13]],"34":[[2,13]],"38":[[2,13]]},{"5":[[2,14]],"7":[[2,14]],"8":[[2,14]],"20":[[2,14]],"25":[[2,14]],"29":[[2,14]],"34":[[2,14]],"38":[[2,14]]},{"5":[[2,15]],"7":[[2,15]],"8":[[2,15]],"20":[[2,15]],"25":[[2,15]],"29":[[2,15]],"34":[[2,15]],"38":[[2,15]]},{"5":[[2,16]],"7":[[2,16]],"8":[[2,16]],"20":[[2,16]],"25":[[2,16]],"29":[[2,16]],"34":[[2,16]],"38":[[2,16]]},{"5":[[2,38]],"7":[[2,38]],"8":[[2,38]],"20":[[2,38]],"25":[[2,38]],"29":[[2,38]],"34":[[2,38]],"38":[[2,38]]},{"5":[[2,39]],"7":[[2,39]],"8":[[2,39]],"20":[[2,39]],"25":[[2,39]],"29":[[2,39]],"34":[[2,39]],"38":[[2,39]]},{"5":[[2,40]],"7":[[2,40]],"8":[[2,40]],"20":[[2,40]],"25":[[2,40]],"29":[[2,40]],"34":[[2,40]],"38":[[2,40]]},{"5":[[2,41]],"7":[[2,41]],"8":[[2,41]],"20":[[2,41]],"25":[[2,41]],"29":[[2,41]],"34":[[2,41]],"38":[[2,41]]},{"5":[[2,45]],"7":[[2,45]],"8":[[2,45]],"19":35,"20":[[2,45]],"21":[[1,36]],"23":[[1,37]],"25":[[2,45]],"27":[[2,45]],"29":[[2,45]],"34":[[2,45]],"36":[[2,45]],"38":[[2,45]],"43":[[2,45]]},{"5":[[2,50]],"6":39,"7":[[2,50]],"8":[[2,50]],"10":6,"11":7,"12":8,"13":9,"14":10,"15":11,"16":12,"17":13,"18":18,"20":[[2,50]],"21":[[1,20]],"25":[[2,50]],"27":[[1,21]],"29":[[2,50]],"30":[[1,40]],"32":[[1,22]],"34":[[2,50]],"38":[[2,50]],"39":[[1,14]],"40":[[1,15]],"41":[[1,16]],"42":[[1,17]],"45":38,"46":[[1,19]],"51":[[1,23]]},{"18":43,"47":41,"48":42,"49":44,"51":[[1,23]]},{"6":47,"10":6,"11":7,"12":8,"13":9,"14":10,"15":11,"16":12,"17":13,"18":18,"21":[[1,20]],"27":[[1,21]],"28":45,"30":[[1,46]],"32":[[1,22]],"39":[[1,14]],"40":[[1,15]],"41":[[1,16]],"42":[[1,17]],"46":[[1,19]],"51":[[1,23]]},{"18":51,"30":[[1,49]],"33":48,"35":50,"37":[[1,52]],"51":[[1,23]]},{"5":[[2,58]],"7":[[2,58]],"8":[[2,58]],"20":[[2,58]],"21":[[2,58]],"22":[[2,58]],"23":[[2,58]],"25":[[2,58]],"27":[[2,58]],"29":[[2,58]],"34":[[2,58]],"36":[[2,58]],"38":[[2,58]],"43":[[2,58]],"50":[[2,58]]},{"5":[[1,53]]},{"1":[[2,3]],"9":[[2,3]],"21":[[2,3]],"27":[[2,3]],"31":[[2,3]],"32":[[2,3]],"39":[[2,3]],"40":[[2,3]],"41":[[2,3]],"42":[[2,3]],"46":[[2,3]],"51":[[2,3]]},{"6":54,"10":6,"11":7,"12":8,"13":9,"14":10,"15":11,"16":12,"17":13,"18":18,"21":[[1,20]],"27":[[1,21]],"32":[[1,22]],"39":[[1,14]],"40":[[1,15]],"41":[[1,16]],"42":[[1,17]],"46":[[1,19]],"51":[[1,23]]},{"6":55,"10":6,"11":7,"12":8,"13":9,"14":10,"15":11,"16":12,"17":13,"18":18,"21":[[1,20]],"27":[[1,21]],"32":[[1,22]],"39":[[1,14]],"40":[[1,15]],"41":[[1,16]],"42":[[1,17]],"46":[[1,19]],"51":[[1,23]]},{"6":56,"10":6,"11":7,"12":8,"13":9,"14":10,"15":11,"16":12,"17":13,"18":18,"21":[[1,20]],"27":[[1,21]],"32":[[1,22]],"39":[[1,14]],"40":[[1,15]],"41":[[1,16]],"42":[[1,17]],"46":[[1,19]],"51":[[1,23]]},{"18":57,"51":[[1,23]]},{"21":[[2,37]],"27":[[2,37]],"32":[[2,37]],"39":[[2,37]],"40":[[2,37]],"41":[[2,37]],"42":[[2,37]],"46":[[2,37]],"51":[[2,37]]},{"18":58,"51":[[1,23]]},{"6":59,"10":6,"11":7,"12":8,"13":9,"14":10,"15":11,"16":12,"17":13,"18":18,"21":[[1,20]],"27":[[1,21]],"32":[[1,22]],"39":[[1,14]],"40":[[1,15]],"41":[[1,16]],"42":[[1,17]],"46":[[1,19]],"51":[[1,23]]},{"6":60,"10":6,"11":7,"12":8,"13":9,"14":10,"15":11,"16":12,"17":13,"18":18,"21":[[1,20]],"27":[[1,21]],"32":[[1,22]],"39":[[1,14]],"40":[[1,15]],"41":[[1,16]],"42":[[1,17]],"46":[[1,19]],"51":[[1,23]]},{"6":61,"10":6,"11":7,"12":8,"13":9,"14":10,"15":11,"16":12,"17":13,"18":18,"21":[[1,20]],"27":[[1,21]],"32":[[1,22]],"39":[[1,14]],"40":[[1,15]],"41":[[1,16]],"42":[[1,17]],"46":[[1,19]],"51":[[1,23]]},{"5":[[2,17]],"7":[[2,17]],"8":[[2,17]],"20":[[2,17]],"25":[[2,17]],"29":[[2,17]],"34":[[2,17]],"38":[[2,17]]},{"22":[[1,62]],"23":[[1,63]]},{"5":[[2,21]],"7":[[2,21]],"8":[[2,21]],"20":[[2,21]],"25":[[2,21]],"29":[[2,21]],"34":[[2,21]],"38":[[2,21]]},{"5":[[2,51]],"7":[[2,51]],"8":[[2,51]],"20":[[2,51]],"25":[[2,51]],"29":[[2,51]],"34":[[2,51]],"38":[[2,51]]},{"5":[[2,48]],"7":[[2,48]],"8":[[2,48]],"20":[[1,29]],"25":[[2,48]],"26":28,"29":[[2,48]],"34":[[2,48]],"38":[[1,30]]},{"3":64,"4":3,"6":4,"9":[[1,5]],"10":6,"11":7,"12":8,"13":9,"14":10,"15":11,"16":12,"17":13,"18":18,"21":[[1,20]],"27":[[1,21]],"32":[[1,22]],"39":[[1,14]],"40":[[1,15]],"41":[[1,16]],"42":[[1,17]],"46":[[1,19]],"51":[[1,23]]},{"22":[[1,65]],"25":[[1,66]]},{"22":[[2,55]],"25":[[2,55]]},{"22":[[2,53]],"25":[[2,53]],"50":[[1,67]]},{"22":[[2,54]],"25":[[2,54]]},{"5":[[1,70]],"25":[[1,69]],"29":[[1,68]]},{"6":47,"10":6,"11":7,"12":8,"13":9,"14":10,"15":11,"16":12,"17":13,"18":18,"21":[[1,20]],"27":[[1,21]],"28":71,"32":[[1,22]],"39":[[1,14]],"40":[[1,15]],"41":[[1,16]],"42":[[1,17]],"46":[[1,19]],"51":[[1,23]]},{"5":[[2,27]],"20":[[1,29]],"25":[[2,27]],"26":28,"29":[[2,27]],"38":[[1,30]]},{"5":[[1,74]],"25":[[1,73]],"34":[[1,72]]},{"18":51,"33":75,"35":50,"37":[[1,52]],"51":[[1,23]]},{"5":[[2,34]],"25":[[2,34]],"34":[[2,34]]},{"36":[[1,76]]},{"36":[[1,77]]},{"1":[[2,4]],"9":[[2,4]],"21":[[2,4]],"27":[[2,4]],"31":[[2,4]],"32":[[2,4]],"39":[[2,4]],"40":[[2,4]],"41":[[2,4]],"42":[[2,4]],"46":[[2,4]],"51":[[2,4]]},{"5":[[2,5]],"20":[[1,29]],"26":28,"38":[[1,30]]},{"5":[[2,6]],"20":[[1,29]],"26":28,"38":[[1,30]]},{"5":[[2,24]],"7":[[2,24]],"8":[[2,24]],"20":[[1,29]],"25":[[2,24]],"26":28,"29":[[2,24]],"34":[[2,24]],"38":[[1,30]]},{"19":78,"21":[[1,36]],"23":[[1,37]]},{"5":[[2,46]],"7":[[2,46]],"8":[[2,46]],"20":[[2,46]],"25":[[2,46]],"27":[[2,46]],"29":[[2,46]],"34":[[2,46]],"36":[[2,46]],"38":[[2,46]],"43":[[2,46]]},{"20":[[1,29]],"26":28,"29":[[1,79]],"38":[[1,30]]},{"5":[[2,42]],"7":[[2,42]],"8":[[2,42]],"20":[[1,29]],"25":[[2,42]],"26":28,"29":[[2,42]],"34":[[2,42]],"38":[[1,30]]},{"5":[[2,43]],"7":[[2,43]],"8":[[2,43]],"20":[[1,29]],"25":[[2,43]],"26":28,"29":[[2,43]],"34":[[2,43]],"38":[[1,30]]},{"5":[[2,19]],"7":[[2,19]],"8":[[2,19]],"20":[[2,19]],"25":[[2,19]],"29":[[2,19]],"34":[[2,19]],"38":[[2,19]]},{"22":[[1,80]]},{"4":24,"6":4,"9":[[1,5]],"10":6,"11":7,"12":8,"13":9,"14":10,"15":11,"16":12,"17":13,"18":18,"21":[[1,20]],"27":[[1,21]],"31":[[1,81]],"32":[[1,22]],"39":[[1,14]],"40":[[1,15]],"41":[[1,16]],"42":[[1,17]],"46":[[1,19]],"51":[[1,23]]},{"46":[[1,82]]},{"18":43,"48":83,"49":44,"51":[[1,23]]},{"22":[[2,57]],"25":[[2,57]]},{"5":[[2,25]],"7":[[2,25]],"8":[[2,25]],"20":[[2,25]],"25":[[2,25]],"29":[[2,25]],"34":[[2,25]],"38":[[2,25]]},{"6":84,"10":6,"11":7,"12":8,"13":9,"14":10,"15":11,"16":12,"17":13,"18":18,"21":[[1,20]],"27":[[1,21]],"32":[[1,22]],"39":[[1,14]],"40":[[1,15]],"41":[[1,16]],"42":[[1,17]],"46":[[1,19]],"51":[[1,23]]},{"6":85,"10":6,"11":7,"12":8,"13":9,"14":10,"15":11,"16":12,"17":13,"18":18,"21":[[1,20]],"27":[[1,21]],"32":[[1,22]],"39":[[1,14]],"40":[[1,15]],"41":[[1,16]],"42":[[1,17]],"46":[[1,19]],"51":[[1,23]]},{"5":[[1,86]],"25":[[1,69]]},{"5":[[2,30]],"7":[[2,30]],"8":[[2,30]],"20":[[2,30]],"25":[[2,30]],"29":[[2,30]],"34":[[2,30]],"38":[[2,30]]},{"18":51,"35":87,"37":[[1,52]],"51":[[1,23]]},{"18":51,"35":88,"37":[[1,52]],"51":[[1,23]]},{"5":[[1,89]],"25":[[1,73]]},{"6":90,"10":6,"11":7,"12":8,"13":9,"14":10,"15":11,"16":12,"17":13,"18":18,"21":[[1,20]],"27":[[1,21]],"32":[[1,22]],"39":[[1,14]],"40":[[1,15]],"41":[[1,16]],"42":[[1,17]],"46":[[1,19]],"51":[[1,23]]},{"6":91,"10":6,"11":7,"12":8,"13":9,"14":10,"15":11,"16":12,"17":13,"18":18,"21":[[1,20]],"27":[[1,21]],"32":[[1,22]],"39":[[1,14]],"40":[[1,15]],"41":[[1,16]],"42":[[1,17]],"46":[[1,19]],"51":[[1,23]]},{"5":[[2,18]],"7":[[2,18]],"8":[[2,18]],"20":[[2,18]],"25":[[2,18]],"29":[[2,18]],"34":[[2,18]],"38":[[2,18]]},{"5":[[2,47]],"7":[[2,47]],"8":[[2,47]],"20":[[2,47]],"25":[[2,47]],"27":[[2,47]],"29":[[2,47]],"34":[[2,47]],"36":[[2,47]],"38":[[2,47]],"43":[[2,47]]},{"5":[[2,20]],"7":[[2,20]],"8":[[2,20]],"20":[[2,20]],"25":[[2,20]],"29":[[2,20]],"34":[[2,20]],"38":[[2,20]]},{"5":[[2,49]],"7":[[2,49]],"8":[[2,49]],"20":[[2,49]],"25":[[2,49]],"29":[[2,49]],"34":[[2,49]],"38":[[2,49]]},{"5":[[2,50]],"6":39,"7":[[2,50]],"8":[[2,50]],"10":6,"11":7,"12":8,"13":9,"14":10,"15":11,"16":12,"17":13,"18":18,"20":[[2,50]],"21":[[1,20]],"25":[[2,50]],"27":[[1,21]],"29":[[2,50]],"30":[[1,40]],"32":[[1,22]],"34":[[2,50]],"38":[[2,50]],"39":[[1,14]],"40":[[1,15]],"41":[[1,16]],"42":[[1,17]],"45":92,"46":[[1,19]],"51":[[1,23]]},{"22":[[2,56]],"25":[[2,56]]},{"5":[[2,28]],"20":[[1,29]],"25":[[2,28]],"26":28,"29":[[2,28]],"38":[[1,30]]},{"5":[[2,29]],"20":[[1,29]],"25":[[2,29]],"26":28,"29":[[2,29]],"38":[[1,30]]},{"6":85,"10":6,"11":7,"12":8,"13":9,"14":10,"15":11,"16":12,"17":13,"18":18,"21":[[1,20]],"27":[[1,21]],"31":[[1,93]],"32":[[1,22]],"39":[[1,14]],"40":[[1,15]],"41":[[1,16]],"42":[[1,17]],"46":[[1,19]],"51":[[1,23]]},{"5":[[2,35]],"25":[[2,35]],"34":[[2,35]]},{"5":[[2,36]],"25":[[2,36]],"34":[[2,36]]},{"18":51,"31":[[1,94]],"35":88,"37":[[1,52]],"51":[[1,23]]},{"5":[[2,32]],"20":[[1,29]],"25":[[2,32]],"26":28,"34":[[2,32]],"38":[[1,30]]},{"5":[[2,33]],"20":[[1,29]],"25":[[2,33]],"26":28,"34":[[2,33]],"38":[[1,30]]},{"5":[[2,52]],"7":[[2,52]],"8":[[2,52]],"20":[[2,52]],"25":[[2,52]],"29":[[2,52]],"34":[[2,52]],"38":[[2,52]]},{"5":[[1,95]]},{"5":[[1,96]]},{"29":[[1,97]]},{"34":[[1,98]]},{"5":[[2,26]],"7":[[2,26]],"8":[[2,26]],"20":[[2,26]],"25":[[2,26]],"29":[[2,26]],"34":[[2,26]],"38":[[2,26]]},{"5":[[2,31]],"7":[[2,31]],"8":[[2,31]],"20":[[2,31]],"25":[[2,31]],"29":[[2,31]],"34":[[2,31]],"38":[[2,31]]}],
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

      var __i, __j, key;
      root = (typeof exports !== "undefined" && exports !== null) ? exports : this;
      CoffeePot = (root.CoffeePot = (typeof root.CoffeePot !== "undefined" && root.CoffeePot !== null) ? root.CoffeePot : {
      });
      CoffeePot.parse = function parse(tokens) {
        return parser.parse(tokens);
      };
      // Define Object.keys for browsers that don't have it.
      if (!((typeof Object.keys !== "undefined" && Object.keys !== null))) {
        return (Object.keys = ((function() {
          __i = []; __j = obj;
          for (key in __j) {
            value = __j[key];
            if (__hasProp.call(__j, key)) {
              __i.push(obj(function() {
                return key;
              }));
            }
          }
          return __i;
        }).call(this)));
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