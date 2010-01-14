(function(){
  var NonTerminals;
  NonTerminals = {
    // All parsing will end in this rule, being the trunk of the AST.
    Root: {
      "": function() {
        return new Expressions();
      },
      "Terminator": function() {
        return new Expressions();
      },
      "Expressions": function() {
        return this[0];
      },
      "Block Terminator": function() {
        return this[0];
      }
    },
    // Any list of expressions or method body, seperated by line breaks or semis.
    Expressions: {
      "Expression": function() {
        return Expressions.wrap(this);
      },
      "Expressions Terminator Expression": function() {
        return this[0] << this[2];
      },
      "Expressions Terminator": function() {
        return this[0];
      }
    },
    // All types of expressions in our language. The basic unit of CoffeeScript
    // is the expression.
    Expression: {
      "Value": null,
      "Call": null,
      "Code": null,
      "Operation": null,
      "Assign": null,
      "If": null,
      "Try": null,
      "Throw": null,
      "Return": null,
      "While": null,
      "For": null,
      "Switch": null,
      "Extends": null,
      "Splat": null,
      "Existence": null,
      "Comment": null
    },
    // A block of expressions. Note that the Rewriter will convert some postfix
    // forms into blocks for us, by altering the token stream.
    Block: {
      "INDENT Expressions OUTDENT": function() {
        return this[1];
      },
      "INDENT OUTDENT": function() {
        return new Expressions();
      }
    },
    // Tokens that can terminate an expression.
    Terminator: {
      "NEWLINE": null,
      "SEMICOLON": null
    },
    // All hard-coded values. These can be printed straight to JavaScript.
    Literal: {
      "NUMBER": function() {
        return new LiteralNode(this[0]);
      },
      "STRING": function() {
        return new LiteralNode(this[0]);
      },
      "JS": function() {
        return new LiteralNode(this[0]);
      },
      "REGEX": function() {
        return new LiteralNode(this[0]);
      },
      "BREAK": function() {
        return new LiteralNode(this[0]);
      },
      "CONTINUE": function() {
        return new LiteralNode(this[0]);
      },
      "ARGUMENTS": function() {
        return new LiteralNode(this[0]);
      },
      "TRUE": function() {
        return new LiteralNode(true);
      },
      "FALSE": function() {
        return new LiteralNode(false);
      },
      "YES": function() {
        return new LiteralNode(true);
      },
      "NO": function() {
        return new LiteralNode(false);
      },
      "ON": function() {
        return new LiteralNode(true);
      },
      "OFF": function() {
        return new LiteralNode(false);
      }
    },
    // Assignment to a variable (or index).
    Assign: {
      "Value ASSIGN Expression": function() {
        return new AssignNode(this[0], this[2]);
      }
    },
    // Assignment within an object literal (can be quoted).
    AssignObj: {
      "IDENTIFIER ASSIGN Expression": function() {
        return new AssignNode(new ValueNode(this[0]), this[2], "object");
      },
      "STRING ASSIGN Expression": function() {
        return new AssignNode(new ValueNode(new LiteralNode(this[0])), this[2], "object");
      },
      "Comment": function() {
        return this[0];
      }
    },
    // A return statement.
    Return: {
      "RETURN Expression": function() {
        return new ReturnNode(this[1]);
      },
      "RETURN": function() {
        return new ReturnNode(new ValueNode(new Value('null')));
      }
    },
    // A comment.
    Comment: {
      "COMMENT": function() {
        return new CommentNode(this[0]);
      }
    },
    // Arithmetic and logical operators
    // For Ruby's Operator precedence, see:
    // https://www.cs.auckland.ac.nz/references/ruby/ProgrammingRuby/language.html
    Operation: {
      "'!' Expression": function() {
        return new OpNode(this[0], this[1]);
      },
      "'!!' Expression": function() {
        return new OpNode(this[0], this[1]);
      },
      "'-' Expression = UMINUS": function() {
        return new OpNode(this[0], this[1]);
      },
      "NOT Expression": function() {
        return new OpNode(this[0], this[1]);
      },
      "'~' Expression": function() {
        return new OpNode(this[0], this[1]);
      },
      "'--' Expression": function() {
        return new OpNode(this[0], this[1]);
      },
      "'++' Expression": function() {
        return new OpNode(this[0], this[1]);
      },
      "DELETE Expression": function() {
        return new OpNode(this[0], this[1]);
      },
      "TYPEOF Expression": function() {
        return new OpNode(this[0], this[1]);
      },
      "Expression '--'": function() {
        return new OpNode(this[1], this[0], null, true);
      },
      "Expression '++'": function() {
        return new OpNode(this[1], this[0], null, true);
      },
      "Expression '*' Expression": function() {
        return new OpNode(this[1], this[0], this[2]);
      },
      "Expression '/' Expression": function() {
        return new OpNode(this[1], this[0], this[2]);
      },
      "Expression '%' Expression": function() {
        return new OpNode(this[1], this[0], this[2]);
      },
      "Expression '+' Expression": function() {
        return new OpNode(this[1], this[0], this[2]);
      },
      "Expression '-' Expression": function() {
        return new OpNode(this[1], this[0], this[2]);
      },
      "Expression '<<' Expression": function() {
        return new OpNode(this[1], this[0], this[2]);
      },
      "Expression '>>' Expression": function() {
        return new OpNode(this[1], this[0], this[2]);
      },
      "Expression '>>>' Expression": function() {
        return new OpNode(this[1], this[0], this[2]);
      },
      "Expression '&' Expression": function() {
        return new OpNode(this[1], this[0], this[2]);
      },
      "Expression '|' Expression": function() {
        return new OpNode(this[1], this[0], this[2]);
      },
      "Expression '^' Expression": function() {
        return new OpNode(this[1], this[0], this[2]);
      },
      "Expression '<=' Expression": function() {
        return new OpNode(this[1], this[0], this[2]);
      },
      "Expression '<' Expression": function() {
        return new OpNode(this[1], this[0], this[2]);
      },
      "Expression '>' Expression": function() {
        return new OpNode(this[1], this[0], this[2]);
      },
      "Expression '>=' Expression": function() {
        return new OpNode(this[1], this[0], this[2]);
      },
      "Expression '==' Expression": function() {
        return new OpNode(this[1], this[0], this[2]);
      },
      "Expression '!=' Expression": function() {
        return new OpNode(this[1], this[0], this[2]);
      },
      "Expression IS Expression": function() {
        return new OpNode(this[1], this[0], this[2]);
      },
      "Expression ISNT Expression": function() {
        return new OpNode(this[1], this[0], this[2]);
      },
      "Expression '&&' Expression": function() {
        return new OpNode(this[1], this[0], this[2]);
      },
      "Expression '||' Expression": function() {
        return new OpNode(this[1], this[0], this[2]);
      },
      "Expression AND Expression": function() {
        return new OpNode(this[1], this[0], this[2]);
      },
      "Expression OR Expression": function() {
        return new OpNode(this[1], this[0], this[2]);
      },
      "Expression '-=' Expression": function() {
        return new OpNode(this[1], this[0], this[2]);
      },
      "Expression '+=' Expression": function() {
        return new OpNode(this[1], this[0], this[2]);
      },
      "Expression '/=' Expression": function() {
        return new OpNode(this[1], this[0], this[2]);
      },
      "Expression '*=' Expression": function() {
        return new OpNode(this[1], this[0], this[2]);
      },
      "Expression '%=' Expression": function() {
        return new OpNode(this[1], this[0], this[2]);
      },
      "Expression '||=' Expression": function() {
        return new OpNode(this[1], this[0], this[2]);
      },
      "Expression '&&=' Expression": function() {
        return new OpNode(this[1], this[0], this[2]);
      },
      "Expression INSTANCEOF Expression": function() {
        return new OpNode(this[1], this[0], this[2]);
      },
      "Expression IN Expression": function() {
        return new OpNode(this[1], this[0], this[2]);
      }
    },
    // The existence operator.
    Existence: {
      "Expression '?'": function() {
        return new ExistenceNode(this[0]);
      }
    },
    // Function definition.
    Code: {
      "ParamList '=>' Block": function() {
        return new CodeNode(this[0], this[2]);
      },
      "'=>' Block": function() {
        return new CodeNode([], this[1]);
      }
    },
    // The parameters to a function definition.
    ParamList: {
      "Param": function() {
        return val;
      },
      "ParamList ',' Param": function() {
        return this[0] << this[2];
      }
    },
    // A Parameter (or ParamSplat) in a function definition.
    Param: {
      "PARAM": null,
      "PARAM '.' '.' '.'": function() {
        return new SplatNode(this[0]);
      }
    },
    // A regular splat.
    Splat: {
      "Expression '.' '.'' '.'": function() {
        return new SplatNode(this[0]);
      }
    },
    // Expressions that can be treated as values.
    Value: {
      "IDENTIFIER": function() {
        return new ValueNode(this[0]);
      },
      "Literal": function() {
        return new ValueNode(this[0]);
      },
      "Array": function() {
        return new ValueNode(this[0]);
      },
      "Object": function() {
        return new ValueNode(this[0]);
      },
      "Parenthetical": function() {
        return new ValueNode(this[0]);
      },
      "Range": function() {
        return new ValueNode(this[0]);
      },
      "Value Accessor": function() {
        return this[0] << this[1];
      },
      "Invocation Accessor": function() {
        return new ValueNode(this[0], [this[1]]);
      }
    },
    // Accessing into an object or array, through dot or index notation.
    Accessor: {
      "PROPERTY_ACCESS IDENTIFIER": function() {
        return new AccessorNode(this[1]);
      },
      "PROTOTYPE_ACCESS IDENTIFIER": function() {
        return new AccessorNode(this[1], true);
      },
      "Index": function() {
        return this[0];
      },
      "Range": function() {
        return new SliceNode(this[0]);
      }
    },
    // Indexing into an object or array.
    Index: {
      "'[' Expression ']'": function() {
        return new IndexNode(this[1]);
      }
    },
    // An object literal.
    Object: {
      "'{' AssignList '}'": function() {
        return new ObjectNode(val[1]);
      }
    },
    // Assignment within an object literal (comma or newline separated).
    AssignList: {
      "": function() {
        return [];
      },
      "AssignObj": function() {
        return val;
      },
      "AssignList ',' AssignObj": function() {
        return this[0] << this[2];
      },
      "AssignList Terminator AssignObj": function() {
        return this[0] << this[2];
      },
      "AssignList ',' Terminator AssignObj": function() {
        return this[0] << this[3];
      },
      "INDENT AssignList OUTDENT": function() {
        return this[1];
      }
    },
    // All flavors of function call (instantiation, super, and regular).
    Call: {
      "Invocation": function() {
        return this[0];
      },
      "NEW Invocation": function() {
        return this[1].new_instance;
      },
      "Super": function() {
        return this[0];
      }
    },
    // Extending an object's prototype.
    Extends: {
      "Value EXTENDS Value": function() {
        return new ExtendsNode(this[0], this[2]);
      }
    },
    // A generic function invocation.
    Invocation: {
      "Value Arguments": function() {
        return new CallNode(this[0], this[1]);
      },
      "Invocation Arguments": function() {
        return new CallNode(this[0], this[1]);
      }
    },
    // The list of arguments to a function invocation.
    Arguments: {
      "'(' ArgList ')'": function() {
        return this[1];
      },
      "'(' ArgList ')' Code": function() {
        return this[1] << this[3];
      }
    },
    // Calling super.
    Super: {
      "SUPER '(' ArgList ')'": function() {
        return new CallNode("super", this[2]);
      }
    },
    // The range literal.
    Range: {
      "'[' Expression '.' '.' Expression ']'": function() {
        return new RangeNode(this[1], this[4]);
      },
      "'[' Expression '.' '.' '.' Expression ']'": function() {
        return new RangeNode(this[1], this[5], true);
      }
    },
    // The array literal.
    Array: {
      "'[' ArgList ']'": function() {
        return new ArrayNode(this[1]);
      }
    },
    // A list of arguments to a method call, or as the contents of an array.
    ArgList: {
      "": function() {
        return [];
      },
      "Expression": function() {
        return val;
      },
      "INDENT Expression": function() {
        return [this[1]];
      },
      "ArgList ',' Expression": function() {
        return this[0] << this[2];
      },
      "ArgList Terminator Expression": function() {
        return this[0] << this[2];
      },
      "ArgList ',' Terminator Expression": function() {
        return this[0] << this[3];
      },
      "ArgList ',' INDENT Expression": function() {
        return this[0] << this[3];
      },
      "ArgList OUTDENT": function() {
        return this[0];
      }
    },
    // Try/catch/finally exception handling blocks.
    Try: {
      "TRY Block Catch": function() {
        return new TryNode(this[1], this[2][0], this[2][1]);
      },
      "TRY Block FINALLY Block": function() {
        return new TryNode(this[1], null, null, this[3]);
      },
      "TRY Block Catch FINALLY Block": function() {
        return new TryNode(this[1], this[2][0], this[2][1], this[4]);
      }
    },
    // A catch clause.
    Catch: {
      "CATCH IDENTIFIER Block": function() {
        return [this[1], this[2]];
      }
    },
    // Throw an exception.
    Throw: {
      "THROW Expression": function() {
        return new ThrowNode(this[1]);
      }
    },
    // Parenthetical expressions.
    Parenthetical: {
      "'(' Expression ')'": function() {
        return new ParentheticalNode(this[1], this[0].line);
      }
    },
    // The while loop. (there is no do..while).
    While: {
      "WHILE Expression Block": function() {
        return new WhileNode(this[1], this[2]);
      },
      "WHILE Expression": function() {
        return new WhileNode(this[1], null);
      }
    },
    // Array comprehensions, including guard and current index.
    // Looks a little confusing, check nodes.rb for the arguments to ForNode.
    For: {
      "Expression FOR ForVariables ForSource": function() {
        return new ForNode(this[0], this[3], this[2][0], this[2][1]);
      },
      "FOR ForVariables ForSource Block": function() {
        return new ForNode(this[3], this[2], this[1][0], this[1][1]);
      }
    },
    // An array comprehension has variables for the current element and index.
    ForVariables: {
      "IDENTIFIER": function() {
        return val;
      },
      "IDENTIFIER ',' IDENTIFIER": function() {
        return [this[0], this[2]];
      }
    },
    // The source of the array comprehension can optionally be filtered.
    ForSource: {
      "IN Expression": function() {
        return {
          "source": this[1]
        };
      },
      "OF Expression": function() {
        return {
          "source": this[1],
          "object": true
        };
      },
      "ForSource WHEN Expression": function() {
        return this[0].merge({
          "filter": this[2]
        });
      },
      "ForSource BY Expression": function() {
        return this[0].merge({
          "step": this[2]
        });
      }
    },
    // Switch/When blocks.
    Switch: {
      "SWITCH Expression INDENT Whens OUTDENT": function() {
        return this[3].rewrite_condition(this[1]);
      },
      "SWITCH Expression INDENT Whens ELSE Block OUTDENT": function() {
        return this[3].rewrite_condition(this[1]).add_else(this[5]);
      }
    },
    // The inner list of whens.
    Whens: {
      "When": function() {
        return this[0];
      },
      "Whens When": function() {
        return this[0] << this[1];
      }
    },
    // An individual when.
    When: {
      "LEADING_WHEN Expression Block": function() {
        return new IfNode(this[1], this[2], null, {
          "statement": true
        });
      },
      "LEADING_WHEN Expression Block Terminator": function() {
        return new IfNode(this[1], this[2], null, {
          "statement": true
        });
      },
      "Comment Terminator When": function() {
        return this[2].add_comment(this[0]);
      }
    },
    // The most basic form of "if".
    IfBlock: {
      "IF Expression Block": function() {
        return new IfNode(this[1], this[2]);
      }
    },
    // An elsif portion of an if-else block.
    ElsIf: {
      "ELSE IfBlock": function() {
        return this[1].force_statement;
      }
    },
    // Multiple elsifs can be chained together.
    ElsIfs: {
      "ElsIf": function() {
        return this[0];
      },
      "ElsIfs ElsIf": function() {
        return this[0].add_else(this[1]);
      }
    },
    // Terminating else bodies are strictly optional.
    ElseBody: {
      "": function() {
        return null;
      },
      "ELSE Block": function() {
        return this[1];
      }
    },
    // All the alternatives for ending an if-else block.
    IfEnd: {
      "ElseBody": function() {
        return this[0];
      },
      "ElsIfs ElseBody": function() {
        return this[0].add_else(this[1]);
      }
    },
    // The full complement of if blocks, including postfix one-liner ifs and unlesses.
    If: {
      "IfBlock IfEnd": function() {
        return this[0].add_else(this[1]);
      },
      "Expression IF Expression": function() {
        return new IfNode(this[2], Expressions.wrap(this[0]), null, {
          "statement": true
        });
      },
      "Expression UNLESS Expression": function() {
        return new IfNode(this[2], Expressions.wrap(this[0]), null, {
          "statement": true,
          "invert": true
        });
      }
    }
  };
})();
