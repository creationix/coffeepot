# Helper to enable passing anonymous functions
p: pattern, fn =>
  if fn
    [pattern, fn]
  else
    [pattern]

grammar: {

  # All parsing will end in this rule, being the trunk of the AST.
  Root: [
    p("Expressions")
  ]

  # Any list of expressions or method body, seperated by line breaks or semis.
  Expressions: [
    p("Expressions NEWLINE Expression") => this[0][1].concat([this[2]])
    p("Expression") => [this[0]]
  ]

  # All types of expressions in our language. The basic unit of CoffeeScript
  # is the expression.
  Expression: [
    p("Assign")
    p("ID")
    p("NUMBER")
    p("COMMENT")
  ]

  # Assignment to a variable (or index).
  Assign: [
    p("ID ':' Expression")
  ]

}

# Works as CommonJS module too
if `exports`
  `exports.grammar = grammar`
