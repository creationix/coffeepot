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
    NEWLINE: /^(\n)/,
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
  analyse = function analyse(tokens) {
    var __a, __b, idx, indent, last, result, stack, token, top;
    last = null;
    result = [];
    stack = [""];
    __a = tokens;
    for (__b = 0; __b < __a.length; __b++) {
      token = __a[__b];
      if (last && last[0] === "NEWLINE" && token[0] !== "NEWLINE") {
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
          result.push(["INDENT", token[1], indent]);
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
          // Look for reserved identifiers and mark them
          if (token[0] === "ID") {
            if (Keywords.indexOf(token[2]) >= 0) {
              token = [token[2]];
            } else if (((idx = Booleans.indexOf(token[2]))) >= 0) {
              token[0] = "BOOLEAN";
              token[2] = idx % 2 === 0;
            }
          }
          // Convert strings to their raw value
          token[0] === "STRING" ? (token[2] = (token[2] = (function() {
            try {
              return (token[2] = JSON.parse(token[2].replace(/\n/g, "\\n")));
            } catch (e) {
              return false;
            }
          })())) : null;
          // Strip leading whitespace off heredoc blocks
          if (token[0] === "HEREDOC") {
            token[2] = strip_heredoc(token[2]);
            token[0] = "STRING";
          }
          token[0] === "COMMENT" ? (token[2] = token[2].substr(1, token[2].length)) : null;
          token[0] === "CODE" ? (token = [token[2], token[1]]) : null;
          Containers.indexOf(token[0]) < 0 ? (token.length = 2) : null;
          result.push(token);
        }
      }
      last = token;
    }
    // Flush the stack
    while (stack.length > 1) {
      result.push(["DEDENT", stack.pop()]);
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
      // line_no: source.substr(0, pos).match(/\n/).length
      line_no = null;
      tokens.push([type, [pos, line_no], match]);
      pos += match.length;
    }
    return analyse(tokens);
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
  symbols_: {"Root":2,"Block":3,"Statement":4,"NEWLINE":5,"Expression":6,"if":7,"unless":8,"COMMENT":9,"Literal":10,"Source":11,"Assign":12,"Function":13,"Binop":14,"Array":15,"Object":16,"Call":17,"Id":18,"(":19,")":20,".":21,"ExpressionList":22,",":23,"Operator":24,"[":25,"ArrayItems":26,"]":27,"INDENT":28,"DEDENT":29,"{":30,"ObjectItems":31,"}":32,"ObjectItem":33,":":34,"String":35,"OPERATOR":36,"NUMBER":37,"BOOLEAN":38,"REGEX":39,"STRING":40,"=":41,"Property":42,"ROCKET":43,"Splat":44,"VarListItem":45,"VarList":46,"DOTDOTDOT":47,"ID":48,"$accept":0,"$end":1},
  terminals_: {"5":"NEWLINE","7":"if","8":"unless","9":"COMMENT","19":"(","20":")","21":".","23":",","25":"[","27":"]","28":"INDENT","29":"DEDENT","30":"{","32":"}","34":":","35":"String","36":"OPERATOR","37":"NUMBER","38":"BOOLEAN","39":"REGEX","40":"STRING","41":"=","43":"ROCKET","47":"DOTDOTDOT","48":"ID"},
  productions_: [0,[2,1],[3,2],[3,3],[4,3],[4,3],[4,1],[4,1],[6,1],[6,1],[6,1],[6,1],[6,1],[6,1],[6,1],[6,1],[17,3],[17,5],[17,4],[17,6],[22,1],[22,3],[14,3],[15,3],[15,8],[26,1],[26,3],[26,3],[16,3],[16,8],[33,3],[33,3],[31,1],[31,3],[31,3],[24,1],[10,1],[10,1],[10,1],[10,1],[12,3],[12,3],[42,3],[11,1],[11,3],[11,4],[13,2],[13,3],[13,5],[45,1],[45,1],[46,1],[46,3],[44,2],[18,1]],
  performAction: function anonymous(yytext,yylineno,yy) {
  
  var $$ = arguments[4],$0=arguments[4].length;
  switch(arguments[3]) {
  case 1:return this.$ = ["Root", ["Block", $$[$0-1+1-1]]];
  break;
  case 2:this.$ = [$$[$0-2+1-1]];
  break;
  case 3:this.$ = $$[$0-3+1-1].concat([$$[$0-3+2-1]]);
  break;
  case 4:this.$ = ["If", $$[$0-3+3-1], $$[$0-3+1-1]];
  break;
  case 5:this.$ = ["If", ["Not", $$[$0-3+3-1]], $$[$0-3+1-1]];
  break;
  case 6:this.$ = $$[$0-1+1-1];
  break;
  case 7:this.$ = ["COMMENT", yytext];
  break;
  case 8:this.$ = $$[$0-1+1-1];
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
  case 16:this.$ = ["Call", null, $$[$0-3+1-1], []];
  break;
  case 17:this.$ = ["Call", $$[$0-5+1-1], $$[$0-5+3-1], []];
  break;
  case 18:this.$ = ["Call", null, $$[$0-4+1-1], $$[$0-4+3-1]];
  break;
  case 19:this.$ = ["Call", $$[$0-6+1-1], $$[$0-6+3-1], $$[$0-6+5-1]];
  break;
  case 20:this.$ = [$$[$0-1+1-1]];
  break;
  case 21:this.$ = $$[$0-3+1-1].concat([$$[$0-3+3-1]]);
  break;
  case 22:this.$ = ["Binop", $$[$0-3+2-1], $$[$0-3+1-1], $$[$0-3+3-1]];
  break;
  case 23:this.$ = ["Array", $$[$0-3+2-1]];
  break;
  case 24:this.$ = ["Array", $$[$0-8+4-1]];
  break;
  case 25:this.$ = [$$[$0-1+1-1]];
  break;
  case 26:this.$ = $$[$0-3+1-1].concat([$$[$0-3+3-1]]);
  break;
  case 27:this.$ = $$[$0-3+1-1].concat([$$[$0-3+3-1]]);
  break;
  case 28:this.$ = ["Object", $$[$0-3+2-1]];
  break;
  case 29:this.$ = ["Object", $$[$0-8+4-1]];
  break;
  case 30:this.$ = [$$[$0-3+1-1], $$[$0-3+3-1]];
  break;
  case 31:this.$ = [$$[$0-3+1-1], $$[$0-3+3-1]];
  break;
  case 32:this.$ = [$$[$0-1+1-1]];
  break;
  case 33:this.$ = $$[$0-3+1-1].concat([$$[$0-3+3-1]]);
  break;
  case 34:this.$ = $$[$0-3+1-1].concat([$$[$0-3+3-1]]);
  break;
  case 35:this.$ = yytext;
  break;
  case 36:this.$ = ["NUMBER", yytext];
  break;
  case 37:this.$ = ["BOOLEAN", yytext];
  break;
  case 38:this.$ = ["REGEX", yytext];
  break;
  case 39:this.$ = ["STRING", yytext];
  break;
  case 40:this.$ = ["Assign", $$[$0-3+1-1], $$[$0-3+3-1]];
  break;
  case 41:this.$ = ["Assign", $$[$0-3+1-1], $$[$0-3+3-1]];
  break;
  case 42:this.$ = ["Property", []];
  break;
  case 43:this.$ = $$[$0-1+1-1];
  break;
  case 44:this.$ = ["Property", $$[$0-3+1-1], $$[$0-3+3-1]];
  break;
  case 45:this.$ = ["Property", $$[$0-4+1-1], 3];
  break;
  case 46:this.$ = ["Function", [], $$[$0-2+2-1]];
  break;
  case 47:this.$ = ["Function", [$$[$0-3+1-1]], $$[$0-3+3-1]];
  break;
  case 48:this.$ = ["Function", [$$[$0-5+1-1], $$[$0-5+3-1]], $$[$0-5+5-1]];
  break;
  case 49:this.$ = $$[$0-1+1-1];
  break;
  case 50:this.$ = $$[$0-1+1-1];
  break;
  case 51:this.$ = [$$[$0-1+1-1]];
  break;
  case 52:this.$ = $$[$0-3+1-1].concat($$[$0-3+3-1]);
  break;
  case 53:this.$ = ["Splat", $$[$0-2+1-1][1]];
  break;
  case 54:this.$ = ["ID", yytext];
  break;
  }
  },
  table: [{"2":1,"3":2,"4":3,"6":4,"9":[[1,5]],"10":6,"11":7,"12":8,"13":9,"14":10,"15":11,"16":12,"17":13,"18":18,"25":[[1,20]],"30":[[1,21]],"37":[[1,14]],"38":[[1,15]],"39":[[1,16]],"40":[[1,17]],"43":[[1,19]],"48":[[1,22]]},{"1":[[3]]},{"1":[[2,1]],"4":23,"6":4,"9":[[1,5]],"10":6,"11":7,"12":8,"13":9,"14":10,"15":11,"16":12,"17":13,"18":18,"25":[[1,20]],"30":[[1,21]],"37":[[1,14]],"38":[[1,15]],"39":[[1,16]],"40":[[1,17]],"43":[[1,19]],"48":[[1,22]]},{"5":[[1,24]]},{"5":[[2,6]],"7":[[1,25]],"8":[[1,26]],"21":[[1,28]],"24":27,"36":[[1,29]]},{"5":[[2,7]]},{"5":[[2,8]],"7":[[2,8]],"8":[[2,8]],"20":[[2,8]],"21":[[2,8]],"23":[[2,8]],"27":[[2,8]],"32":[[2,8]],"36":[[2,8]]},{"5":[[2,9]],"7":[[2,9]],"8":[[2,9]],"20":[[2,9]],"21":[[1,30]],"23":[[2,9]],"25":[[1,31]],"27":[[2,9]],"32":[[2,9]],"34":[[1,32]],"36":[[2,9]],"41":[[1,33]]},{"5":[[2,10]],"7":[[2,10]],"8":[[2,10]],"20":[[2,10]],"21":[[2,10]],"23":[[2,10]],"27":[[2,10]],"32":[[2,10]],"36":[[2,10]]},{"5":[[2,11]],"7":[[2,11]],"8":[[2,11]],"20":[[2,11]],"21":[[2,11]],"23":[[2,11]],"27":[[2,11]],"32":[[2,11]],"36":[[2,11]]},{"5":[[2,12]],"7":[[2,12]],"8":[[2,12]],"20":[[2,12]],"21":[[2,12]],"23":[[2,12]],"27":[[2,12]],"32":[[2,12]],"36":[[2,12]]},{"5":[[2,13]],"7":[[2,13]],"8":[[2,13]],"20":[[2,13]],"21":[[2,13]],"23":[[2,13]],"27":[[2,13]],"32":[[2,13]],"36":[[2,13]]},{"5":[[2,14]],"7":[[2,14]],"8":[[2,14]],"20":[[2,14]],"21":[[2,14]],"23":[[2,14]],"27":[[2,14]],"32":[[2,14]],"36":[[2,14]]},{"5":[[2,15]],"7":[[2,15]],"8":[[2,15]],"20":[[2,15]],"21":[[2,15]],"23":[[2,15]],"27":[[2,15]],"32":[[2,15]],"36":[[2,15]]},{"5":[[2,36]],"7":[[2,36]],"8":[[2,36]],"20":[[2,36]],"21":[[2,36]],"23":[[2,36]],"27":[[2,36]],"32":[[2,36]],"36":[[2,36]]},{"5":[[2,37]],"7":[[2,37]],"8":[[2,37]],"20":[[2,37]],"21":[[2,37]],"23":[[2,37]],"27":[[2,37]],"32":[[2,37]],"36":[[2,37]]},{"5":[[2,38]],"7":[[2,38]],"8":[[2,38]],"20":[[2,38]],"21":[[2,38]],"23":[[2,38]],"27":[[2,38]],"32":[[2,38]],"36":[[2,38]]},{"5":[[2,39]],"7":[[2,39]],"8":[[2,39]],"20":[[2,39]],"21":[[2,39]],"23":[[2,39]],"27":[[2,39]],"32":[[2,39]],"36":[[2,39]]},{"5":[[2,43]],"7":[[2,43]],"8":[[2,43]],"19":[[1,36]],"20":[[2,43]],"21":[[2,43]],"23":[[1,35]],"25":[[2,43]],"27":[[2,43]],"32":[[2,43]],"34":[[2,43]],"36":[[2,43]],"41":[[2,43]],"43":[[1,34]]},{"6":37,"10":6,"11":7,"12":8,"13":9,"14":10,"15":11,"16":12,"17":13,"18":18,"25":[[1,20]],"30":[[1,21]],"37":[[1,14]],"38":[[1,15]],"39":[[1,16]],"40":[[1,17]],"43":[[1,19]],"48":[[1,22]]},{"5":[[1,39]],"6":40,"10":6,"11":7,"12":8,"13":9,"14":10,"15":11,"16":12,"17":13,"18":18,"25":[[1,20]],"26":38,"30":[[1,21]],"37":[[1,14]],"38":[[1,15]],"39":[[1,16]],"40":[[1,17]],"43":[[1,19]],"48":[[1,22]]},{"5":[[1,42]],"18":44,"31":41,"33":43,"35":[[1,45]],"48":[[1,22]]},{"5":[[2,54]],"7":[[2,54]],"8":[[2,54]],"19":[[2,54]],"20":[[2,54]],"21":[[2,54]],"23":[[2,54]],"25":[[2,54]],"27":[[2,54]],"32":[[2,54]],"34":[[2,54]],"36":[[2,54]],"41":[[2,54]],"43":[[2,54]],"47":[[2,54]]},{"5":[[1,46]]},{"1":[[2,2]],"9":[[2,2]],"25":[[2,2]],"30":[[2,2]],"37":[[2,2]],"38":[[2,2]],"39":[[2,2]],"40":[[2,2]],"43":[[2,2]],"48":[[2,2]]},{"6":47,"10":6,"11":7,"12":8,"13":9,"14":10,"15":11,"16":12,"17":13,"18":18,"25":[[1,20]],"30":[[1,21]],"37":[[1,14]],"38":[[1,15]],"39":[[1,16]],"40":[[1,17]],"43":[[1,19]],"48":[[1,22]]},{"6":48,"10":6,"11":7,"12":8,"13":9,"14":10,"15":11,"16":12,"17":13,"18":18,"25":[[1,20]],"30":[[1,21]],"37":[[1,14]],"38":[[1,15]],"39":[[1,16]],"40":[[1,17]],"43":[[1,19]],"48":[[1,22]]},{"6":49,"10":6,"11":7,"12":8,"13":9,"14":10,"15":11,"16":12,"17":13,"18":18,"25":[[1,20]],"30":[[1,21]],"37":[[1,14]],"38":[[1,15]],"39":[[1,16]],"40":[[1,17]],"43":[[1,19]],"48":[[1,22]]},{"18":50,"48":[[1,22]]},{"25":[[2,35]],"30":[[2,35]],"37":[[2,35]],"38":[[2,35]],"39":[[2,35]],"40":[[2,35]],"43":[[2,35]],"48":[[2,35]]},{"18":51,"48":[[1,22]]},{"6":52,"10":6,"11":7,"12":8,"13":9,"14":10,"15":11,"16":12,"17":13,"18":18,"25":[[1,20]],"30":[[1,21]],"37":[[1,14]],"38":[[1,15]],"39":[[1,16]],"40":[[1,17]],"43":[[1,19]],"48":[[1,22]]},{"6":53,"10":6,"11":7,"12":8,"13":9,"14":10,"15":11,"16":12,"17":13,"18":18,"25":[[1,20]],"30":[[1,21]],"37":[[1,14]],"38":[[1,15]],"39":[[1,16]],"40":[[1,17]],"43":[[1,19]],"48":[[1,22]]},{"6":54,"10":6,"11":7,"12":8,"13":9,"14":10,"15":11,"16":12,"17":13,"18":18,"25":[[1,20]],"30":[[1,21]],"37":[[1,14]],"38":[[1,15]],"39":[[1,16]],"40":[[1,17]],"43":[[1,19]],"48":[[1,22]]},{"6":55,"10":6,"11":7,"12":8,"13":9,"14":10,"15":11,"16":12,"17":13,"18":18,"25":[[1,20]],"30":[[1,21]],"37":[[1,14]],"38":[[1,15]],"39":[[1,16]],"40":[[1,17]],"43":[[1,19]],"48":[[1,22]]},{"18":57,"44":56,"48":[[1,22]]},{"6":60,"10":6,"11":7,"12":8,"13":9,"14":10,"15":11,"16":12,"17":13,"18":18,"20":[[1,58]],"22":59,"25":[[1,20]],"30":[[1,21]],"37":[[1,14]],"38":[[1,15]],"39":[[1,16]],"40":[[1,17]],"43":[[1,19]],"48":[[1,22]]},{"5":[[2,46]],"7":[[2,46]],"8":[[2,46]],"20":[[2,46]],"21":[[1,28]],"23":[[2,46]],"24":27,"27":[[2,46]],"32":[[2,46]],"36":[[1,29]]},{"5":[[1,63]],"23":[[1,62]],"27":[[1,61]]},{"28":[[1,64]]},{"5":[[2,25]],"21":[[1,28]],"23":[[2,25]],"24":27,"27":[[2,25]],"36":[[1,29]]},{"5":[[1,67]],"23":[[1,66]],"32":[[1,65]]},{"28":[[1,68]]},{"5":[[2,32]],"23":[[2,32]],"32":[[2,32]]},{"34":[[1,69]]},{"34":[[1,70]]},{"1":[[2,3]],"9":[[2,3]],"25":[[2,3]],"30":[[2,3]],"37":[[2,3]],"38":[[2,3]],"39":[[2,3]],"40":[[2,3]],"43":[[2,3]],"48":[[2,3]]},{"5":[[2,4]],"21":[[1,28]],"24":27,"36":[[1,29]]},{"5":[[2,5]],"21":[[1,28]],"24":27,"36":[[1,29]]},{"5":[[2,22]],"7":[[2,22]],"8":[[2,22]],"20":[[2,22]],"21":[[1,28]],"23":[[2,22]],"24":27,"27":[[2,22]],"32":[[2,22]],"36":[[1,29]]},{"19":[[1,71]]},{"5":[[2,44]],"7":[[2,44]],"8":[[2,44]],"20":[[2,44]],"21":[[2,44]],"23":[[2,44]],"25":[[2,44]],"27":[[2,44]],"32":[[2,44]],"34":[[2,44]],"36":[[2,44]],"41":[[2,44]]},{"21":[[1,28]],"24":27,"27":[[1,72]],"36":[[1,29]]},{"5":[[2,40]],"7":[[2,40]],"8":[[2,40]],"20":[[2,40]],"21":[[1,28]],"23":[[2,40]],"24":27,"27":[[2,40]],"32":[[2,40]],"36":[[1,29]]},{"5":[[2,41]],"7":[[2,41]],"8":[[2,41]],"20":[[2,41]],"21":[[1,28]],"23":[[2,41]],"24":27,"27":[[2,41]],"32":[[2,41]],"36":[[1,29]]},{"5":[[2,47]],"7":[[2,47]],"8":[[2,47]],"20":[[2,47]],"21":[[1,28]],"23":[[2,47]],"24":27,"27":[[2,47]],"32":[[2,47]],"36":[[1,29]]},{"43":[[1,73]]},{"47":[[1,74]]},{"5":[[2,16]],"7":[[2,16]],"8":[[2,16]],"20":[[2,16]],"21":[[2,16]],"23":[[2,16]],"27":[[2,16]],"32":[[2,16]],"36":[[2,16]]},{"20":[[1,75]],"23":[[1,76]]},{"20":[[2,20]],"21":[[1,28]],"23":[[2,20]],"24":27,"36":[[1,29]]},{"5":[[2,23]],"7":[[2,23]],"8":[[2,23]],"20":[[2,23]],"21":[[2,23]],"23":[[2,23]],"27":[[2,23]],"32":[[2,23]],"36":[[2,23]]},{"6":77,"10":6,"11":7,"12":8,"13":9,"14":10,"15":11,"16":12,"17":13,"18":18,"25":[[1,20]],"30":[[1,21]],"37":[[1,14]],"38":[[1,15]],"39":[[1,16]],"40":[[1,17]],"43":[[1,19]],"48":[[1,22]]},{"6":78,"10":6,"11":7,"12":8,"13":9,"14":10,"15":11,"16":12,"17":13,"18":18,"25":[[1,20]],"30":[[1,21]],"37":[[1,14]],"38":[[1,15]],"39":[[1,16]],"40":[[1,17]],"43":[[1,19]],"48":[[1,22]]},{"6":40,"10":6,"11":7,"12":8,"13":9,"14":10,"15":11,"16":12,"17":13,"18":18,"25":[[1,20]],"26":79,"30":[[1,21]],"37":[[1,14]],"38":[[1,15]],"39":[[1,16]],"40":[[1,17]],"43":[[1,19]],"48":[[1,22]]},{"5":[[2,28]],"7":[[2,28]],"8":[[2,28]],"20":[[2,28]],"21":[[2,28]],"23":[[2,28]],"27":[[2,28]],"32":[[2,28]],"36":[[2,28]]},{"18":44,"33":80,"35":[[1,45]],"48":[[1,22]]},{"18":44,"33":81,"35":[[1,45]],"48":[[1,22]]},{"18":44,"31":82,"33":43,"35":[[1,45]],"48":[[1,22]]},{"6":83,"10":6,"11":7,"12":8,"13":9,"14":10,"15":11,"16":12,"17":13,"18":18,"25":[[1,20]],"30":[[1,21]],"37":[[1,14]],"38":[[1,15]],"39":[[1,16]],"40":[[1,17]],"43":[[1,19]],"48":[[1,22]]},{"6":84,"10":6,"11":7,"12":8,"13":9,"14":10,"15":11,"16":12,"17":13,"18":18,"25":[[1,20]],"30":[[1,21]],"37":[[1,14]],"38":[[1,15]],"39":[[1,16]],"40":[[1,17]],"43":[[1,19]],"48":[[1,22]]},{"6":60,"10":6,"11":7,"12":8,"13":9,"14":10,"15":11,"16":12,"17":13,"18":18,"20":[[1,85]],"22":86,"25":[[1,20]],"30":[[1,21]],"37":[[1,14]],"38":[[1,15]],"39":[[1,16]],"40":[[1,17]],"43":[[1,19]],"48":[[1,22]]},{"5":[[2,45]],"7":[[2,45]],"8":[[2,45]],"20":[[2,45]],"21":[[2,45]],"23":[[2,45]],"25":[[2,45]],"27":[[2,45]],"32":[[2,45]],"34":[[2,45]],"36":[[2,45]],"41":[[2,45]]},{"6":87,"10":6,"11":7,"12":8,"13":9,"14":10,"15":11,"16":12,"17":13,"18":18,"25":[[1,20]],"30":[[1,21]],"37":[[1,14]],"38":[[1,15]],"39":[[1,16]],"40":[[1,17]],"43":[[1,19]],"48":[[1,22]]},{"43":[[2,53]]},{"5":[[2,18]],"7":[[2,18]],"8":[[2,18]],"20":[[2,18]],"21":[[2,18]],"23":[[2,18]],"27":[[2,18]],"32":[[2,18]],"36":[[2,18]]},{"6":88,"10":6,"11":7,"12":8,"13":9,"14":10,"15":11,"16":12,"17":13,"18":18,"25":[[1,20]],"30":[[1,21]],"37":[[1,14]],"38":[[1,15]],"39":[[1,16]],"40":[[1,17]],"43":[[1,19]],"48":[[1,22]]},{"5":[[2,26]],"21":[[1,28]],"23":[[2,26]],"24":27,"27":[[2,26]],"36":[[1,29]]},{"5":[[2,27]],"21":[[1,28]],"23":[[2,27]],"24":27,"27":[[2,27]],"36":[[1,29]]},{"5":[[1,89]],"23":[[1,62]]},{"5":[[2,33]],"23":[[2,33]],"32":[[2,33]]},{"5":[[2,34]],"23":[[2,34]],"32":[[2,34]]},{"5":[[1,90]],"23":[[1,66]]},{"5":[[2,30]],"21":[[1,28]],"23":[[2,30]],"24":27,"32":[[2,30]],"36":[[1,29]]},{"5":[[2,31]],"21":[[1,28]],"23":[[2,31]],"24":27,"32":[[2,31]],"36":[[1,29]]},{"5":[[2,17]],"7":[[2,17]],"8":[[2,17]],"20":[[2,17]],"21":[[2,17]],"23":[[2,17]],"27":[[2,17]],"32":[[2,17]],"36":[[2,17]]},{"20":[[1,91]],"23":[[1,76]]},{"5":[[2,48]],"7":[[2,48]],"8":[[2,48]],"20":[[2,48]],"21":[[1,28]],"23":[[2,48]],"24":27,"27":[[2,48]],"32":[[2,48]],"36":[[1,29]]},{"20":[[2,21]],"21":[[1,28]],"23":[[2,21]],"24":27,"36":[[1,29]]},{"6":78,"10":6,"11":7,"12":8,"13":9,"14":10,"15":11,"16":12,"17":13,"18":18,"25":[[1,20]],"29":[[1,92]],"30":[[1,21]],"37":[[1,14]],"38":[[1,15]],"39":[[1,16]],"40":[[1,17]],"43":[[1,19]],"48":[[1,22]]},{"18":44,"29":[[1,93]],"33":81,"35":[[1,45]],"48":[[1,22]]},{"5":[[2,19]],"7":[[2,19]],"8":[[2,19]],"20":[[2,19]],"21":[[2,19]],"23":[[2,19]],"27":[[2,19]],"32":[[2,19]],"36":[[2,19]]},{"5":[[1,94]]},{"5":[[1,95]]},{"27":[[1,96]]},{"32":[[1,97]]},{"5":[[2,24]],"7":[[2,24]],"8":[[2,24]],"20":[[2,24]],"21":[[2,24]],"23":[[2,24]],"27":[[2,24]],"32":[[2,24]],"36":[[2,24]]},{"5":[[2,29]],"7":[[2,29]],"8":[[2,29]],"20":[[2,29]],"21":[[2,29]],"23":[[2,29]],"27":[[2,29]],"32":[[2,29]],"36":[[2,29]]}],
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
        this.yyline = token[1][1];
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
      CoffeePot.parse = function parse() {
        var args;
        args = Array.prototype.slice.call(arguments, 0);
        return parser.parse.apply(parser, args);
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
  var CoffeePot, Generators, block_vars, render, root;
  var __hasProp = Object.prototype.hasOwnProperty;
  root = (typeof exports !== "undefined" && exports !== null) ? exports : this;
  CoffeePot = (root.CoffeePot = (typeof root.CoffeePot !== "undefined" && root.CoffeePot !== null) ? root.CoffeePot : {
  });
  block_vars = [];
  Generators = {
    Root: function Root(block) {
      var __a;
      __a = "(function () {" + this(block) + "}());";
      return Root === this.constructor ? this : __a;
    },
    Not: function Not(expr) {
      var __a;
      __a = "!(" + this(expr) + ")";
      return Not === this.constructor ? this : __a;
    },
    Block: function Block(contents) {
      var __a, __b, __c, __d, __e, __f, content, exists, last_comment, line, name, names, self;
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
        })();
        last_comment = type === "COMMENT";
        return content;
      });
      content = content.join("\n");
      names = (function() {
        __a = []; __b = block_vars.pop();
        for (name in __b) {
          exists = __b[name];
          if (__hasProp.call(__b, name)) {
            __a.push(name);
          }
        }
        return __a;
      })();
      names.length > 0 ? (content = "var " + names.join(", ") + ";\n" + content) : null;
      content = "\n" + ((function() {
        __c = []; __d = content.split("\n");
        for (__e = 0; __e < __d.length; __e++) {
          line = __d[__e];
          __c.push(("  " + line));
        }
        return __c;
      })()).join("\n") + "\n";
      __f = content;
      return Block === this.constructor ? this : __f;
    },
    // ["Function",[["ID","x"]],["Binop",["OPERATOR","*"],["ID","x"],["ID","x"]]];
    Function: function Function(args, content, name) {
      var __a, __b, __c, __d, arg;
      name = (typeof name !== "undefined" && name !== null) ? name : "";
      content = content[0] === "Block" ? this(content) : " return " + this(content) + "; ";
      __a = "function " + name + "(" + ((function() {
        __b = []; __c = args;
        for (__d = 0; __d < __c.length; __d++) {
          arg = __c[__d];
          __b.push(arg[1]);
        }
        return __b;
      })()).join(", ") + ") {" + content + "}";
      return Function === this.constructor ? this : __a;
    },
    COMMENT: function COMMENT(content) {
      var __a;
      __a = "//" + content;
      return COMMENT === this.constructor ? this : __a;
    },
    STRING: function STRING(content) {
      var __a;
      __a = JSON.stringify(content);
      return STRING === this.constructor ? this : __a;
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
      })()).join("");
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
      })()).join(", ");
      return ExpressionList === this.constructor ? this : __a;
    },
    Compound: function Compound(parts) {
      var __a, __b, __c, __d, part, self;
      self = this;
      __a = ((function(__this) {
        __b = []; __c = parts;
        for (__d = 0; __d < __c.length; __d++) {
          part = __c[__d];
          __b.push(__this(part));
        }
        return __b;
      })(this)).join("");
      return Compound === this.constructor ? this : __a;
    },
    Binop: function Binop(op, exp1, exp2) {
      var __a, content, first, second;
      first = this(exp1);
      second = this(exp2);
      __a = content = op === "?" ? '(typeof ' + first + ' !== "undefined" && ' + first + ' !== null)' + ' ? ' + first + ' : ' + second : first + " " + op + " " + second;
      return Binop === this.constructor ? this : __a;
    },
    Property: function Property(source, id) {
      var __a;
      __a = this(source) + "." + this(id);
      return Property === this.constructor ? this : __a;
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
      })()).join(", ") + "]";
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
      })();
      __d = "{\n  " + pairs.join(",\n  ") + "\n}";
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
    var tokens, tree;
    tokens = CoffeePot.tokenize(code);
    tree = CoffeePot.parse(tokens);
    return CoffeePot.generate(tree);
  };
})();