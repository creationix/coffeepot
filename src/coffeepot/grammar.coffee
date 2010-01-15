grammar: {

  # All parsing will end in this rule, being the trunk of the AST.
  Root: {
    "":                 => new Expressions()
    "Terminator":       => new Expressions()
    "Expressions":      => this[0]
    "Block Terminator": => this[0]
  }

  # Any list of expressions or method body, seperated by line breaks or semis.
  Expressions: {
    "Expression":                        => Expressions.wrap(this)
    "Expressions Terminator Expression": => this[0] << this[2]
    "Expressions Terminator":            => this[0]
  }

  # All types of expressions in our language. The basic unit of CoffeeScript
  # is the expression.
  Expression: {
    # "Value":     null
    # "Call":      null
    # "Code":      null
    # "Operation": null
    "Assign":    null
    # "If":        null
    # "Try":       null
    # "Throw":     null
    # "Return":    null
    # "While":     null
    # "For":       null
    # "Switch":    null
    # "Extends":   null
    # "Splat":     null
    # "Existence": null
    "Comment":   null
  }

  # A block of expressions. Note that the Rewriter will convert some postfix
  # forms into blocks for us, by altering the token stream.
  Block: {
    "INDENT Expressions OUTDENT": => this[1]
    "INDENT OUTDENT":             => new Expressions()
  }

  # Tokens that can terminate an expression.
  Terminator: {
    "NEWLINE": null
    "SEMICOLON": null
  }

  # All hard-coded values. These can be printed straight to JavaScript.
  Literal: {
    "NUMBER":                            => new LiteralNode(this[0])
    "STRING":                            => new LiteralNode(this[0])
    "JS":                                => new LiteralNode(this[0])
    "REGEX":                             => new LiteralNode(this[0])
    "BREAK":                             => new LiteralNode(this[0])
    "CONTINUE":                          => new LiteralNode(this[0])
    "ARGUMENTS":                         => new LiteralNode(this[0])
    "BOOLEAN":                              => new LiteralNode(true)
  }

  # Assignment to a variable (or index).
  Assign: {
    "Value ASSIGN Expression":           => new AssignNode(this[0], this[2])
  }

  # Assignment within an object literal (can be quoted).
  AssignObj: {
    "IDENTIFIER ASSIGN Expression":      => new AssignNode(new ValueNode(this[0]), this[2], "object")
    "STRING ASSIGN Expression":          => new AssignNode(new ValueNode(new LiteralNode(this[0])), this[2], "object")
    "Comment":                           => this[0]
  }

  # A return statement.
  Return: {
    "RETURN Expression":                 => new ReturnNode(this[1])
    "RETURN":                            => new ReturnNode(new ValueNode(new Value('null')))
  }

  # A comment.
  Comment: {
    "COMMENT":                           => new CommentNode(this[0])
  }

  # Arithmetic and logical operators
  # For Ruby's Operator precedence, see:
  # https://www.cs.auckland.ac.nz/references/ruby/ProgrammingRuby/language.html
  Operation: {
    "'!' Expression":                    => new OpNode(this[0], this[1])
    "'!!' Expression":                   => new OpNode(this[0], this[1])
    "'-' Expression = UMINUS":           => new OpNode(this[0], this[1])
    "NOT Expression":                    => new OpNode(this[0], this[1])
    "'~' Expression":                    => new OpNode(this[0], this[1])
    "'--' Expression":                   => new OpNode(this[0], this[1])
    "'++' Expression":                   => new OpNode(this[0], this[1])
    "DELETE Expression":                 => new OpNode(this[0], this[1])
    "TYPEOF Expression":                 => new OpNode(this[0], this[1])
    "Expression '--'":                   => new OpNode(this[1], this[0], null, true)
    "Expression '++'":                   => new OpNode(this[1], this[0], null, true)

    "Expression '*' Expression":         => new OpNode(this[1], this[0], this[2])
    "Expression '/' Expression":         => new OpNode(this[1], this[0], this[2])
    "Expression '%' Expression":         => new OpNode(this[1], this[0], this[2])

    "Expression '+' Expression":         => new OpNode(this[1], this[0], this[2])
    "Expression '-' Expression":         => new OpNode(this[1], this[0], this[2])

    "Expression '<<' Expression":        => new OpNode(this[1], this[0], this[2])
    "Expression '>>' Expression":        => new OpNode(this[1], this[0], this[2])
    "Expression '>>>' Expression":       => new OpNode(this[1], this[0], this[2])

    "Expression '&' Expression":         => new OpNode(this[1], this[0], this[2])
    "Expression '|' Expression":         => new OpNode(this[1], this[0], this[2])
    "Expression '^' Expression":         => new OpNode(this[1], this[0], this[2])

    "Expression '<=' Expression":        => new OpNode(this[1], this[0], this[2])
    "Expression '<' Expression":         => new OpNode(this[1], this[0], this[2])
    "Expression '>' Expression":         => new OpNode(this[1], this[0], this[2])
    "Expression '>=' Expression":        => new OpNode(this[1], this[0], this[2])

    "Expression '==' Expression":        => new OpNode(this[1], this[0], this[2])
    "Expression '!=' Expression":        => new OpNode(this[1], this[0], this[2])
    "Expression IS Expression":          => new OpNode(this[1], this[0], this[2])
    "Expression ISNT Expression":        => new OpNode(this[1], this[0], this[2])

    "Expression '&&' Expression":        => new OpNode(this[1], this[0], this[2])
    "Expression '||' Expression":        => new OpNode(this[1], this[0], this[2])
    "Expression AND Expression":         => new OpNode(this[1], this[0], this[2])
    "Expression OR Expression":          => new OpNode(this[1], this[0], this[2])

    "Expression '-=' Expression":        => new OpNode(this[1], this[0], this[2])
    "Expression '+=' Expression":        => new OpNode(this[1], this[0], this[2])
    "Expression '/=' Expression":        => new OpNode(this[1], this[0], this[2])
    "Expression '*=' Expression":        => new OpNode(this[1], this[0], this[2])
    "Expression '%=' Expression":        => new OpNode(this[1], this[0], this[2])
    "Expression '||=' Expression":       => new OpNode(this[1], this[0], this[2])
    "Expression '&&=' Expression":       => new OpNode(this[1], this[0], this[2])

    "Expression INSTANCEOF Expression":  => new OpNode(this[1], this[0], this[2])
    "Expression IN Expression":          => new OpNode(this[1], this[0], this[2])
  }

  # The existence operator.
  Existence: {
    "Expression '?'":                    => new ExistenceNode(this[0])
  }

  # Function definition.
  Code: {
    "ParamList '=>' Block":              => new CodeNode(this[0], this[2])
    "'=>' Block":                        => new CodeNode([], this[1])
  }

  # The parameters to a function definition.
  ParamList: {
    "Param":                             => val
    "ParamList ',' Param":               => this[0] << this[2]
  }

  # A Parameter (or ParamSplat) in a function definition.
  Param: {
    "PARAM": null
    "PARAM '.' '.' '.'":                 => new SplatNode(this[0])
  }

  # A regular splat.
  Splat: {
    "Expression '.' '.'' '.'":           => new SplatNode(this[0])
  }

  # Expressions that can be treated as values.
  Value: {
    "IDENTIFIER":                        => new ValueNode(this[0])
    "Literal":                           => new ValueNode(this[0])
    # "Array":                             => new ValueNode(this[0])
    # "Object":                            => new ValueNode(this[0])
    # "Parenthetical":                     => new ValueNode(this[0])
    # "Range":                             => new ValueNode(this[0])
    # "Value Accessor":                    => this[0] << this[1]
    "Invocation Accessor":               => new ValueNode(this[0], [this[1]])
  }

  # Accessing into an object or array, through dot or index notation.
  Accessor: {
    "PROPERTY_ACCESS IDENTIFIER":        => new AccessorNode(this[1])
    "PROTOTYPE_ACCESS IDENTIFIER":       => new AccessorNode(this[1], true)
    "Index":                             => this[0]
    "Range":                             => new SliceNode(this[0])
  }

  # Indexing into an object or array.
  Index: {
    "'[' Expression ']'":                => new IndexNode(this[1])
  }

  # An object literal.
  Object: {
    "'{' AssignList '}'":                => new ObjectNode(val[1])
  }

  # Assignment within an object literal (comma or newline separated).
  AssignList: {
    "":                                  => []
    "AssignObj":                         => val
    "AssignList ',' AssignObj":          => this[0] << this[2]
    "AssignList Terminator AssignObj":   => this[0] << this[2]
    "AssignList ',' Terminator AssignObj": => this[0] << this[3]
    "INDENT AssignList OUTDENT":         => this[1]
  }

  # All flavors of function call (instantiation, super, and regular).
  Call: {
    "Invocation":                        => this[0]
    "NEW Invocation":                    => this[1].new_instance
    "Super":                             => this[0]
  }

  # Extending an object's prototype.
  Extends: {
    "Value EXTENDS Value":               => new ExtendsNode(this[0], this[2])
  }

  # A generic function invocation.
  Invocation: {
    "Value Arguments":                   => new CallNode(this[0], this[1])
    "Invocation Arguments":              => new CallNode(this[0], this[1])
  }

  # The list of arguments to a function invocation.
  Arguments: {
    "'(' ArgList ')'":                   => this[1]
    "'(' ArgList ')' Code":              => this[1] << this[3]
  }

  # Calling super.
  Super: {
    "SUPER '(' ArgList ')'":             => new CallNode("super", this[2])
  }

  # The range literal.
  Range: {
    "'[' Expression '.' '.' Expression ']'": => new RangeNode(this[1], this[4])
    "'[' Expression '.' '.' '.' Expression ']'": => new RangeNode(this[1], this[5], true)
  }

  # The array literal.
  Array: {
    "'[' ArgList ']'":                   => new ArrayNode(this[1])
  }

  # A list of arguments to a method call, or as the contents of an array.
  ArgList: {
    "":                                  => []
    "Expression":                        => val
    "INDENT Expression":                 => [this[1]]
    "ArgList ',' Expression":            => this[0] << this[2]
    "ArgList Terminator Expression":     => this[0] << this[2]
    "ArgList ',' Terminator Expression": => this[0] << this[3]
    "ArgList ',' INDENT Expression":     => this[0] << this[3]
    "ArgList OUTDENT":                   => this[0]
  }

  # Try/catch/finally exception handling blocks.
  Try: {
    "TRY Block Catch":                   => new TryNode(this[1], this[2][0], this[2][1])
    "TRY Block FINALLY Block":           => new TryNode(this[1], null, null, this[3])
    "TRY Block Catch FINALLY Block":     => new TryNode(this[1], this[2][0], this[2][1], this[4])
  }

  # A catch clause.
  Catch: {
    "CATCH IDENTIFIER Block":            => [this[1], this[2]]
  }

  # Throw an exception.
  Throw: {
    "THROW Expression":                  => new ThrowNode(this[1])
  }

  # Parenthetical expressions.
  Parenthetical: {
    "'(' Expression ')'":                => new ParentheticalNode(this[1], this[0].line)
  }

  # The while loop. (there is no do..while).
  While: {
    "WHILE Expression Block":            => new WhileNode(this[1], this[2])
    "WHILE Expression":                  => new WhileNode(this[1], null)
  }

  # Array comprehensions, including guard and current index.
  # Looks a little confusing, check nodes.rb for the arguments to ForNode.
  For: {
    "Expression FOR ForVariables ForSource": => new ForNode(this[0], this[3], this[2][0], this[2][1])
    "FOR ForVariables ForSource Block":  => new ForNode(this[3], this[2], this[1][0], this[1][1])
  }

  # An array comprehension has variables for the current element and index.
  ForVariables: {
    "IDENTIFIER":                        => val
    "IDENTIFIER ',' IDENTIFIER":         => [this[0], this[2]]
  }

  # The source of the array comprehension can optionally be filtered.
  ForSource: {
    "IN Expression":                     => {"source": this[1]}
    "OF Expression":                     => {"source": this[1], "object": true}
    "ForSource WHEN Expression":         => this[0].merge({"filter": this[2]})
    "ForSource BY Expression":           => this[0].merge({"step": this[2]})
  }

  # Switch/When blocks.
  Switch: {
    "SWITCH Expression INDENT Whens OUTDENT": => this[3].rewrite_condition(this[1])
    "SWITCH Expression INDENT Whens ELSE Block OUTDENT": => this[3].rewrite_condition(this[1]).add_else(this[5])
  }

  # The inner list of whens.
  Whens: {
    "When":                              => this[0]
    "Whens When":                        => this[0] << this[1]
  }

  # An individual when.
  When: {
    "LEADING_WHEN Expression Block":     => new IfNode(this[1], this[2], null, {"statement": true})
    "LEADING_WHEN Expression Block Terminator": => new IfNode(this[1], this[2], null, {"statement": true})
    "Comment Terminator When":           => this[2].add_comment(this[0])
  }

  # The most basic form of "if".
  IfBlock: {
    "IF Expression Block":               => new IfNode(this[1], this[2])
  }

  # An elsif portion of an if-else block.
  ElsIf: {
    "ELSE IfBlock":                      => this[1].force_statement
  }

  # Multiple elsifs can be chained together.
  ElsIfs: {
    "ElsIf":                             => this[0]
    "ElsIfs ElsIf":                      => this[0].add_else(this[1])
  }

  # Terminating else bodies are strictly optional.
  ElseBody: {
    "":                                  => null
    "ELSE Block":                        => this[1]
  }

  # All the alternatives for ending an if-else block.
  IfEnd: {
    "ElseBody":                          => this[0]
    "ElsIfs ElseBody":                   => this[0].add_else(this[1])
  }

  # The full complement of if blocks, including postfix one-liner ifs and unlesses.
  If: {
    "IfBlock IfEnd":                     => this[0].add_else(this[1])
    "Expression IF Expression":          => new IfNode(this[2], Expressions.wrap(this[0]), null, {"statement": true})
    "Expression UNLESS Expression":      => new IfNode(this[2], Expressions.wrap(this[0]), null, {"statement": true, "invert": true})
  }
}

# Works as CommonJS module too
if `exports`
  `exports.grammar = grammar`
