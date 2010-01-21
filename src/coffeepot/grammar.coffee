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
    o("Array")
    o("Object")
    o("Call")
  ]

  Call: [
    o("Expression ( )") => ["Call", $1, []]
    o("Expression ( ExpressionList )") => ["Call", $1, $3]
  ]

  ExpressionList: [
    o("Expression") => [$1]
    o("ExpressionList , Expression") => $1.concat([$3])
  ]

  Binop: [
    o("Expression Operator Expression") => ["Binop", $2, $1, $3]
  ]

  Array: [
    o("[ ArrayItems ]") => ["Array", $2]
    o("[ NEWLINE INDENT ArrayItems NEWLINE DEDENT NEWLINE ]") => ["Array", $4]
  ]

  ArrayItems: [
    o("Expression") => [$1]
    o("ArrayItems , Expression") => $1.concat([$3])
    o("ArrayItems NEWLINE Expression") => $1.concat([$3])
  ]

  Object: [
    o("{ ObjectItems }") => ["Object", $2]
    o("{ NEWLINE INDENT ObjectItems NEWLINE DEDENT NEWLINE }") => ["Object", $4]
  ]

  ObjectItem: [
    o("Id : Expression") => [$1, $3]
    o("String : Expression") => [$1, $3]
  ]

  ObjectItems: [
    o("ObjectItem") => [$1]
    o("ObjectItems , ObjectItem") => $1.concat([$3])
    o("ObjectItems NEWLINE ObjectItem") => $1.concat([$3])
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
    o("Source : Expression") => ["Assign", $1, $3]
    o("Source = Expression") => ["Assign", $1, $3]
  ]

  Source: [
    o("Id")
    o("Source PROPERTY") => ["Property", $1[1] + yytext]
  ]

  Function: [
    o("ROCKET Expression") => ["Function", [], $2]
    o("Id ROCKET Expression") => ["Function", [$1], $3]
  ]

  VarListItem: [
    o("Id")
    o("Splat")
  ]

  VarList: [
    o("VarListItem") => [$1]
    o("VarList , VarListItem") => $1.concat($3)
  ]

  Splat: [
    o("Id DOTDOTDOT") => ["Splat", $1[1]]
  ]

  Id: [
    o("ID") => ["ID", yytext]
  ]



}

CoffeePot.grammar: grammar
