# Helper to enable passing anonymous functions
p: pattern, fn =>
  if fn
    [pattern, fn]
  else
    [pattern]

grammar: {

  # Any list of expressions or method body, seperated by line breaks or semis.
  Block: [
    p("Expression NEWLINE Block") => [this[0]].concat(this[2].slice(1))
    p("COMMENT")
    p('PostCond')
    p("Expression")
    p("NEWLINE")
  ]

  PostCond: [
    p("Expression if Expression")
    p("Expression unless Expression")
  ]

  # All types of expressions in our language. The basic unit of CoffeeScript
  # is the expression.
  Expression: [
    p("Assign")
    p("ID")
    p("Literal")
  ]

  # Assignment to a variable (or index).
  Assign: [
    p("ID ':' Expression")
  ]

  Literal: [
    p("NUMBER")
    p("STRING")
    p("BOOLEAN")
    p("REGEXP")
  ]

}

# Works as CommonJS module too
if `exports`
  `exports.grammar = grammar`
