# CoffeePot

CoffeePot will be a CoffeeScript compiler written in pure CoffeeScript.  For those who haven't heard about it yet, CoffeeScript is a language that directly compiles down to pure JS.  The current compiler is written in Ruby, but it would be nice to have one that's native.  Then you could compile in the browser, or server-side with rhino or node.

http://jashkenas.github.com/coffee-script/

This looks like a good start for writing a parser.

http://inimino.org/~inimino/blog/peg_first_release

This looks very promising.  If only I could get it to work command line.

http://jscc.jmksf.com/

## BNF

    # All parsing will end in this rule, being the trunk of the AST.
    Root:
      /* nothing */                     { result = Expressions.new }
    | Terminator                        { result = Expressions.new }
    | Expressions                       { result = val[0] }
    | Block Terminator                  { result = val[0] }
    ;

    # Any list of expressions or method body, seperated by line breaks or semis.
    Expressions:
      Expression                        { result = Expressions.wrap(val) }
    | Expressions Terminator Expression { result = val[0] << val[2] }
    | Expressions Terminator            { result = val[0] }
    ;

    # All types of expressions in our language. The basic unit of CoffeeScript
    # is the expression.
    Expression:
      Value
    | Call
    | Code
    | Operation
    | Assign
    | If
    | Try
    | Throw
    | Return
    | While
    | For
    | Switch
    | Extends
    | Splat
    | Existence
    | Comment
    ;

    # A block of expressions. Note that the Rewriter will convert some postfix
    # forms into blocks for us, by altering the token stream.
    Block:
      INDENT Expressions OUTDENT        { result = val[1] }
    | INDENT OUTDENT                    { result = Expressions.new }
    ;

    # Tokens that can terminate an expression.
    Terminator:
      "\n"
    | ";"
    ;

    # All hard-coded values. These can be printed straight to JavaScript.
    Literal:
      NUMBER                            { result = LiteralNode.new(val[0]) }
    | STRING                            { result = LiteralNode.new(val[0]) }
    | JS                                { result = LiteralNode.new(val[0]) }
    | REGEX                             { result = LiteralNode.new(val[0]) }
    | BREAK                             { result = LiteralNode.new(val[0]) }
    | CONTINUE                          { result = LiteralNode.new(val[0]) }
    | ARGUMENTS                         { result = LiteralNode.new(val[0]) }
    | TRUE                              { result = LiteralNode.new(true) }
    | FALSE                             { result = LiteralNode.new(false) }
    | YES                               { result = LiteralNode.new(true) }
    | NO                                { result = LiteralNode.new(false) }
    | ON                                { result = LiteralNode.new(true) }
    | OFF                               { result = LiteralNode.new(false) }
    ;

    # Assignment to a variable (or index).
    Assign:
      Value ASSIGN Expression           { result = AssignNode.new(val[0], val[2]) }
    ;

    # Assignment within an object literal (can be quoted).
    AssignObj:
      IDENTIFIER ASSIGN Expression      { result = AssignNode.new(ValueNode.new(val[0]), val[2], :object) }
    | STRING ASSIGN Expression          { result = AssignNode.new(ValueNode.new(LiteralNode.new(val[0])), val[2], :object) }
    | Comment                           { result = val[0] }
    ;

    # A return statement.
    Return:
      RETURN Expression                 { result = ReturnNode.new(val[1]) }
    | RETURN                            { result = ReturnNode.new(ValueNode.new(Value.new('null'))) }
    ;

    # A comment.
    Comment:
      COMMENT                           { result = CommentNode.new(val[0]) }
    ;

    # Arithmetic and logical operators
    # For Ruby's Operator precedence, see:
    # https://www.cs.auckland.ac.nz/references/ruby/ProgrammingRuby/language.html
    Operation:
      '!' Expression                    { result = OpNode.new(val[0], val[1]) }
    | '!!' Expression                   { result = OpNode.new(val[0], val[1]) }
    | '-' Expression = UMINUS           { result = OpNode.new(val[0], val[1]) }
    | NOT Expression                    { result = OpNode.new(val[0], val[1]) }
    | '~' Expression                    { result = OpNode.new(val[0], val[1]) }
    | '--' Expression                   { result = OpNode.new(val[0], val[1]) }
    | '++' Expression                   { result = OpNode.new(val[0], val[1]) }
    | DELETE Expression                 { result = OpNode.new(val[0], val[1]) }
    | TYPEOF Expression                 { result = OpNode.new(val[0], val[1]) }
    | Expression '--'                   { result = OpNode.new(val[1], val[0], nil, true) }
    | Expression '++'                   { result = OpNode.new(val[1], val[0], nil, true) }

    | Expression '*' Expression         { result = OpNode.new(val[1], val[0], val[2]) }
    | Expression '/' Expression         { result = OpNode.new(val[1], val[0], val[2]) }
    | Expression '%' Expression         { result = OpNode.new(val[1], val[0], val[2]) }

    | Expression '+' Expression         { result = OpNode.new(val[1], val[0], val[2]) }
    | Expression '-' Expression         { result = OpNode.new(val[1], val[0], val[2]) }

    | Expression '<<' Expression        { result = OpNode.new(val[1], val[0], val[2]) }
    | Expression '>>' Expression        { result = OpNode.new(val[1], val[0], val[2]) }
    | Expression '>>>' Expression       { result = OpNode.new(val[1], val[0], val[2]) }

    | Expression '&' Expression         { result = OpNode.new(val[1], val[0], val[2]) }
    | Expression '|' Expression         { result = OpNode.new(val[1], val[0], val[2]) }
    | Expression '^' Expression         { result = OpNode.new(val[1], val[0], val[2]) }

    | Expression '<=' Expression        { result = OpNode.new(val[1], val[0], val[2]) }
    | Expression '<' Expression         { result = OpNode.new(val[1], val[0], val[2]) }
    | Expression '>' Expression         { result = OpNode.new(val[1], val[0], val[2]) }
    | Expression '>=' Expression        { result = OpNode.new(val[1], val[0], val[2]) }

    | Expression '==' Expression        { result = OpNode.new(val[1], val[0], val[2]) }
    | Expression '!=' Expression        { result = OpNode.new(val[1], val[0], val[2]) }
    | Expression IS Expression          { result = OpNode.new(val[1], val[0], val[2]) }
    | Expression ISNT Expression        { result = OpNode.new(val[1], val[0], val[2]) }

    | Expression '&&' Expression        { result = OpNode.new(val[1], val[0], val[2]) }
    | Expression '||' Expression        { result = OpNode.new(val[1], val[0], val[2]) }
    | Expression AND Expression         { result = OpNode.new(val[1], val[0], val[2]) }
    | Expression OR Expression          { result = OpNode.new(val[1], val[0], val[2]) }

    | Expression '-=' Expression        { result = OpNode.new(val[1], val[0], val[2]) }
    | Expression '+=' Expression        { result = OpNode.new(val[1], val[0], val[2]) }
    | Expression '/=' Expression        { result = OpNode.new(val[1], val[0], val[2]) }
    | Expression '*=' Expression        { result = OpNode.new(val[1], val[0], val[2]) }
    | Expression '%=' Expression        { result = OpNode.new(val[1], val[0], val[2]) }
    | Expression '||=' Expression       { result = OpNode.new(val[1], val[0], val[2]) }
    | Expression '&&=' Expression       { result = OpNode.new(val[1], val[0], val[2]) }

    | Expression INSTANCEOF Expression  { result = OpNode.new(val[1], val[0], val[2]) }
    | Expression IN Expression          { result = OpNode.new(val[1], val[0], val[2]) }
    ;

    # The existence operator.
    Existence:
      Expression '?'                    { result = ExistenceNode.new(val[0]) }
    ;

    # Function definition.
    Code:
      ParamList "=>" Block              { result = CodeNode.new(val[0], val[2]) }
    | "=>" Block                        { result = CodeNode.new([], val[1]) }
    ;

    # The parameters to a function definition.
    ParamList:
      Param                             { result = val }
    | ParamList "," Param               { result = val[0] << val[2] }
    ;

    # A Parameter (or ParamSplat) in a function definition.
    Param:
      PARAM
    | PARAM "." "." "."                 { result = SplatNode.new(val[0]) }
    ;

    # A regular splat.
    Splat:
      Expression "." "." "."            { result = SplatNode.new(val[0]) }
    ;

    # Expressions that can be treated as values.
    Value:
      IDENTIFIER                        { result = ValueNode.new(val[0]) }
    | Literal                           { result = ValueNode.new(val[0]) }
    | Array                             { result = ValueNode.new(val[0]) }
    | Object                            { result = ValueNode.new(val[0]) }
    | Parenthetical                     { result = ValueNode.new(val[0]) }
    | Range                             { result = ValueNode.new(val[0]) }
    | Value Accessor                    { result = val[0] << val[1] }
    | Invocation Accessor               { result = ValueNode.new(val[0], [val[1]]) }
    ;

    # Accessing into an object or array, through dot or index notation.
    Accessor:
      PROPERTY_ACCESS IDENTIFIER        { result = AccessorNode.new(val[1]) }
    | PROTOTYPE_ACCESS IDENTIFIER       { result = AccessorNode.new(val[1], true) }
    | Index                             { result = val[0] }
    | Range                             { result = SliceNode.new(val[0]) }
    ;

    # Indexing into an object or array.
    Index:
      "[" Expression "]"                { result = IndexNode.new(val[1]) }
    ;

    # An object literal.
    Object:
      "{" AssignList "}"                { result = ObjectNode.new(val[1]) }
    ;

    # Assignment within an object literal (comma or newline separated).
    AssignList:
      /* nothing */                     { result = [] }
    | AssignObj                         { result = val }
    | AssignList "," AssignObj          { result = val[0] << val[2] }
    | AssignList Terminator AssignObj   { result = val[0] << val[2] }
    | AssignList ","
        Terminator AssignObj            { result = val[0] << val[3] }
    | INDENT AssignList OUTDENT         { result = val[1] }
    ;

    # All flavors of function call (instantiation, super, and regular).
    Call:
      Invocation                        { result = val[0] }
    | NEW Invocation                    { result = val[1].new_instance }
    | Super                             { result = val[0] }
    ;

    # Extending an object's prototype.
    Extends:
      Value EXTENDS Value               { result = ExtendsNode.new(val[0], val[2]) }
    ;

    # A generic function invocation.
    Invocation:
      Value Arguments                   { result = CallNode.new(val[0], val[1]) }
    | Invocation Arguments              { result = CallNode.new(val[0], val[1]) }
    ;

    # The list of arguments to a function invocation.
    Arguments:
      "(" ArgList ")"                   { result = val[1] }
    | "(" ArgList ")" Code              { result = val[1] << val[3] }
    ;

    # Calling super.
    Super:
      SUPER "(" ArgList ")"             { result = CallNode.new(:super, val[2]) }
    ;

    # The range literal.
    Range:
      "[" Expression
        "." "." Expression "]"          { result = RangeNode.new(val[1], val[4]) }
    | "[" Expression
        "." "." "." Expression "]"      { result = RangeNode.new(val[1], val[5], true) }
    ;

    # The array literal.
    Array:
      "[" ArgList "]"                   { result = ArrayNode.new(val[1]) }
    ;

    # A list of arguments to a method call, or as the contents of an array.
    ArgList:
      /* nothing */                     { result = [] }
    | Expression                        { result = val }
    | INDENT Expression                 { result = [val[1]] }
    | ArgList "," Expression            { result = val[0] << val[2] }
    | ArgList Terminator Expression     { result = val[0] << val[2] }
    | ArgList "," Terminator Expression { result = val[0] << val[3] }
    | ArgList "," INDENT Expression     { result = val[0] << val[3] }
    | ArgList OUTDENT                   { result = val[0] }
    ;

    # Try/catch/finally exception handling blocks.
    Try:
      TRY Block Catch                   { result = TryNode.new(val[1], val[2][0], val[2][1]) }
    | TRY Block FINALLY Block           { result = TryNode.new(val[1], nil, nil, val[3]) }
    | TRY Block Catch
        FINALLY Block                   { result = TryNode.new(val[1], val[2][0], val[2][1], val[4]) }
    ;

    # A catch clause.
    Catch:
      CATCH IDENTIFIER Block            { result = [val[1], val[2]] }
    ;

    # Throw an exception.
    Throw:
      THROW Expression                  { result = ThrowNode.new(val[1]) }
    ;

    # Parenthetical expressions.
    Parenthetical:
      "(" Expression ")"                { result = ParentheticalNode.new(val[1], val[0].line) }
    ;

    # The while loop. (there is no do..while).
    While:
      WHILE Expression Block            { result = WhileNode.new(val[1], val[2]) }
    | WHILE Expression                  { result = WhileNode.new(val[1], nil) }
    ;

    # Array comprehensions, including guard and current index.
    # Looks a little confusing, check nodes.rb for the arguments to ForNode.
    For:
      Expression FOR
        ForVariables ForSource          { result = ForNode.new(val[0], val[3], val[2][0], val[2][1]) }
    | FOR ForVariables ForSource Block  { result = ForNode.new(val[3], val[2], val[1][0], val[1][1]) }
    ;

    # An array comprehension has variables for the current element and index.
    ForVariables:
      IDENTIFIER                        { result = val }
    | IDENTIFIER "," IDENTIFIER         { result = [val[0], val[2]] }
    ;

    # The source of the array comprehension can optionally be filtered.
    ForSource:
      IN Expression                     { result = {:source => val[1]} }
    | OF Expression                     { result = {:source => val[1], :object => true} }
    | ForSource
      WHEN Expression                   { result = val[0].merge(:filter => val[2]) }
    | ForSource
      BY Expression                     { result = val[0].merge(:step => val[2]) }
    ;

    # Switch/When blocks.
    Switch:
      SWITCH Expression INDENT
        Whens OUTDENT                   { result = val[3].rewrite_condition(val[1]) }
    | SWITCH Expression INDENT
        Whens ELSE Block OUTDENT        { result = val[3].rewrite_condition(val[1]).add_else(val[5]) }
    ;

    # The inner list of whens.
    Whens:
      When                              { result = val[0] }
    | Whens When                        { result = val[0] << val[1] }
    ;

    # An individual when.
    When:
      LEADING_WHEN Expression Block     { result = IfNode.new(val[1], val[2], nil, {:statement => true}) }
    | LEADING_WHEN Expression Block
        Terminator                      { result = IfNode.new(val[1], val[2], nil, {:statement => true}) }
    | Comment Terminator When           { result = val[2].add_comment(val[0]) }
    ;

    # The most basic form of "if".
    IfBlock:
      IF Expression Block               { result = IfNode.new(val[1], val[2]) }
    ;

    # An elsif portion of an if-else block.
    ElsIf:
      ELSE IfBlock                      { result = val[1].force_statement }
    ;

    # Multiple elsifs can be chained together.
    ElsIfs:
      ElsIf                             { result = val[0] }
    | ElsIfs ElsIf                      { result = val[0].add_else(val[1]) }
    ;

    # Terminating else bodies are strictly optional.
    ElseBody
      /* nothing */                     { result = nil }
    | ELSE Block                        { result = val[1] }
    ;

    # All the alternatives for ending an if-else block.
    IfEnd:
      ElseBody                          { result = val[0] }
    | ElsIfs ElseBody                   { result = val[0].add_else(val[1]) }
    ;

    # The full complement of if blocks, including postfix one-liner ifs and unlesses.
    If:
      IfBlock IfEnd                     { result = val[0].add_else(val[1]) }
    | Expression IF Expression          { result = IfNode.new(val[2], Expressions.wrap(val[0]), nil, {:statement => true}) }
    | Expression UNLESS Expression      { result = IfNode.new(val[2], Expressions.wrap(val[0]), nil, {:statement => true, :invert => true}) }
    ;
