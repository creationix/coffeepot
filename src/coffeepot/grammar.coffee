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
    p("Statement NEWLINE Block") => [this[0]].concat(this[2][1])
    p("Statement")
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
    p("Assign")
    p("ID")
    p("Literal")
  ]) name => this[0]

  # Assignment to a variable (or index).
  Assign: g([
    p("ID ':' Expression")
  ]) name => [name, this[0], this[2]]

  Literal: g([
    p("NUMBER")
    p("STRING")
    p("BOOLEAN")
    p("REGEXP")
  ]) name => this[0]

}

# Works as CommonJS module too
if `exports`
  `exports.grammar = Grammar`
