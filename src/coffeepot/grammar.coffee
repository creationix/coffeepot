root: exports ? this
CoffeePot: (root.CoffeePot ?= {})
Helper: CoffeePot.Helper ? require('coffeepot/helper').CoffeePot.Helper
o: Helper.option

# grammar for the CoffeeScript language's parser
grammar: {

  Root: [
    o("Expressions") => ["Root", $1]
  ]

  Expressions: [
    o("Statement NEWLINE") => [$1]
    o("Expressions Statement NEWLINE") => $1.concat([$2])
  ]

  Statement: [
    o("Expression if Expression") => ["If", $3, $1]
    o("Expression unless Expression") => ["If", ["Not", $3], $1]
    o("Expression")
    o("COMMENT") => ["COMMENT", yytext]
  ]

  Expression: [
    o("Literal")
    o("Source")
    o("Assign")
    o("Function")
    o("Binop")
  ]

  Binop: [
    o("Expression Operator Expression") => ["Binop", $2, $1, $3]
  ]

  Operator: [
    o("OPERATOR") => yytext
  ]

  Literal: [
    o("NUMBER") => ["NUMBER", yytext]
    o("BOOLEAN") => ["BOOLEAN", yytext]
    o("REGEX") => ["REGEX", yytext]
    o("STRING") => ["STRING", yytext]
  ]

  Assign: [
    o("Source ASSIGN Expression") => ["Assign", $1, $3]
  ]

  Source: [
    o("Id")
  ]

  Function: [
    o("ROCKET Expression") => ["Function", [], $2]
    o("Id ROCKET Expression") => ["Function", [$1], $3]
  ]


  Id: [
    o("ID") => ["ID", yytext]
  ]



}

CoffeePot.grammar: grammar
