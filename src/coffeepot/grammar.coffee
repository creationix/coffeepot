Grammar: {}

# Helper for non-terminal definitions
g: options, fn =>
  non_terminal: {
    options: options
  }
  non_terminal.filter: fn if fn
  non_terminal

# Helper to enable passing anonymous functions to patterns
p: pattern, fn =>
  option: {
    pattern: pattern
  }
  option.filter: fn if fn
  option

# Grammar for the CoffeeScript language's parser
Grammar: {

  # Any list of expressions or method body, seperated by line breaks or semis.
  Block: g([
    p("Statement Terminator Block") => [this[0]].concat(this[2][1])
    p("Statement")
  ])

  Terminator: g([
    p("NEWLINE")
    p(";")
  ])

  Statement: g([
    p("COMMENT")
    p("PostCond")
    p("Expression")
  ]) name => this[0]

  PostCond: g([
    p("Expression if Expression") => [this[2], this[0]]
    p("Expression unless Expression") => [["Not", this[2], this[0]]]
  ]) name => ["If", this[0], this[1]]

  # All types of expressions in our language. The basic unit of CoffeeScript
  # is the expression.
  Expression: g([
    p("Binop")
    p("Assign")
    p("Function")
    p("Value")
  ]) name => this[0]

  Value: g([
    p("ID")
    p("Literal")
  ]) name => this[0]

  # Assignment to a variable.
  Assign: g([
    p("ID ':' Expression")
  ]) name => [name, this[0], this[2]]

  Function: g([
    p("ROCKET Expression") => [[], this[1]]
    p("ArgsList ROCKET Expression") => [this[0], this[2]]
  ]) name => [name, this[0], this[1]]

  ArgsList: g([
    p("ID , ArgsList") => [this[0]].concat(this[2])
    p("ID")
  ]) => this

  Binop: g([
    p("Value OPERATOR Expression")
  ]) name => [name, this[1], this[0], this[2]]

  Literal: g([
    p("NUMBER")
    p("STRING")
    p("BOOLEAN")
    p("REGEXP")
    p("Array")
    p("Object")
  ]) name => this[0]

  Array: g([
    p("[ NEWLINE INDENT ArrayItems NEWLINE DEDENT ]") => this[3]
    p("[ ArrayItems ]") => this[1]
    p("[ ]") => []
  ]) name => [name, this[0]]


  ArrayItems: g([
    p("Expression , ArrayItems") => [this[0]].concat(this[2])
    p("Expression")
  ]) => this

  ItemSeperator: g([
    p(",")
    p("NEWLINE")
  ]) => this

  Object: g([
    p("{ ObjectPairs }") => this[1]
    p("{ }") => []
  ])

  ObjectPairs: g([
    p("ID : Expression , ObjectPairs") => [[this[0], this[2]]].concat(this[4])
    p("ID : Expression") => [this[0], this[2]]
  ]) => this

}

# Works as CommonJS module too
if `exports`
  `exports.grammar = Grammar`
