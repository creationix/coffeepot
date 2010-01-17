root: exports ? this
CoffeePot: (root.CoffeePot ?= {})
Helper: CoffeePot.Helper ? require('coffeepot/helper').CoffeePot.Helper
g: Helper.non_terminal
p: Helper.option

# grammar for the CoffeeScript language's parser
grammar: Helper.define({

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
    p("Call")
    p("Property")
    p("Value")
  ]) name => this[0]

  Call: g([
    p("Source PROPERTY ( Args )") => [this[0], this[1], this[3]]
    p("Source PROPERTY ( )") => [this[0], this[1], null]
    p("ID ( Args )") => [null, this[0], this[2]]
    p("ID ( )") => [null, this[0], null]
  ])

  Property: g([
    p("Source PROPERTY")
  ])

  Source: g([
    p("ID")
    p("( Expression )")
  ]) name => this[0]

  Args: g([
    p("Expression , Args") => [this[0]].concat(this[2])
    p("Expression")
  ]) name => this

  Value: g([
    p("ID")
    p("Literal")
  ]) name => this[0]

  # Assignment to a variable.
  Assign: g([
    p("ID ':' Expression")
  ]) name => [name, this[0], this[2]]

  Function: g([
    p("ArgsList ROCKET Expression") => [this[0], this[2]]
    p("ArgsList ROCKET NEWLINE INDENT Block DEDENT") => [this[0], this[4]]
  ]) name => [name, this[0], this[1]]

  ArgsList: g([
    p("ID , ArgsList") => [this[0]].concat(this[2])
    p("ID")
    p("")
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
  ]) name => [name, this]


  ArrayItems: g([
    p("Expression ItemSeperator ArrayItems") => [this[0]].concat(this[2])
    p("Expression")
  ]) => this

  Object: g([
    p("{ NEWLINE INDENT ObjectPairs NEWLINE DEDENT }") => this[3]
    p("{ ObjectPairs }") => this[1]
    p("{ }") => []
  ])

  ObjectPairs: g([
    p("ID : Expression ItemSeperator ObjectPairs") => [[this[0][1], this[2]]].concat(this[4])
    p("ID : Expression") => [[this[0][1], this[2]]]
  ]) => this

  ItemSeperator: g([
    p(",")
    p("NEWLINE")
  ]) => this

})

CoffeePot.grammar: grammar
