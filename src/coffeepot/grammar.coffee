# Helper to enable passing anonymous functions
p: pattern, fn =>
  if fn
    [pattern, fn]
  else
    [pattern]

grammar: {

  # Any list of expressions or method body, seperated by line breaks or semis.
  Block: [
    p("Block NEWLINE Expression") => this[0][1].concat([this[2]])
    p("Expression") => [this[0]]
    p("NEWLINE") => []
    p("COMMENT") => [this[0]]
  ]

  # All types of expressions in our language. The basic unit of CoffeeScript
  # is the expression.
  Expression: [
    p("Assign") => this[0]
    p("ID") => this[0]
    p("NUMBER") => this[0]
  ]

  # Assignment to a variable (or index).
  Assign: [
    p("ID ':' Expression") => [this[0], this[2]]
  ]

}

# Works as CommonJS module too
if `exports`
  `exports.grammar = grammar`
