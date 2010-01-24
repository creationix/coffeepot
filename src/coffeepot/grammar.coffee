root: exports ? this
CoffeePot: (root.CoffeePot ?= {})
Parser: require('jison').Parser

# Helper to make our pretty syntax work with Jison
o: pattern_string, fn =>
  if fn
    fn: if match: (fn + "").match(unwrap)
      match[1]
    else
      "(" + fn + "())"
    [pattern_string, "$$ = " + fn + ";"]
  else
    [pattern_string, "$$ = $1;"]
unwrap: /function\s*\(\)\s*\{\s*return\s*([\s\S]*);\s*\}/

# grammar for the CoffeeScript language's parser
grammar: {

  Root: [
    o("Block") => ["Root", ["Block", $1]]
    o("") => false
  ]

  Block: [
    o("Statement NEWLINE") => [$1]
    o("Block Statement NEWLINE") => $1.concat([$2])
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
    o("Id ( )") => ["Call", null, $1, []]
    o("Expression . Id ( )") => ["Call", $1, $3, []]
    o("Id ( ExpressionList )") => ["Call", null, $1, $3]
    o("Expression . Id ( ExpressionList )") => ["Call", $1, $3, $5]
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
    o("[ NEWLINE INDENT ArrayItems NEWLINE DEDENT ]") => ["Array", $4]
  ]

  ArrayItems: [
    o("Expression") => [$1]
    o("ArrayItems , Expression") => $1.concat([$3])
    o("ArrayItems NEWLINE Expression") => $1.concat([$3])
  ]

  Object: [
    o("{ ObjectItems }") => ["Object", $2]
    o("{ NEWLINE INDENT ObjectItems NEWLINE DEDENT }") => ["Object", $4]
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

  Property: [
    o("Expression . Id") => ["Property", []]
  ]

  Source: [
    o("Id")
    o("Source . Id") => ["Property", $1, $3]
    o("Source [ Expression ]") => ["Property", $1, 3]
  ]

  Function: [
    o("ROCKET Expression") => ["Function", [], $2]
    o("Id ROCKET Expression") => ["Function", [$1], $3]
    o("Id , Splat ROCKET Expression") => ["Function", [$1, $3], $5]
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

# Make a Jison parser
bnf: {}
tokens: []
for name, non_terminal of grammar
  bnf[name]: for option in non_terminal
    for part in option[0].split(" ")
      if !grammar[part]
        tokens.push(part)
    if name == "Root"
      option[1] = "return " + option[1]
    option
tokens = tokens.join(" ")
parser: new Parser({tokens: tokens, bnf: bnf}, {debug: false})

# Thin wrapper around the real lexer
parser.lexer: {
  lex: =>
    token: this.tokens[this.pos] || [""]
    this.pos++
    # this.yyline = token[1][1]
    this.yytext = token[2]
    token[0]
  setInput: tokens =>
    this.tokens = tokens
    this.pos = 0
  upcomingInput: => ""
  showPosition: => this.pos
}

# Parse function with nice error reporting
parse: tokens, code =>
  try
    parser.parse(tokens)
  catch e
    [message, num] = e.message.split("\n")
    token: tokens[num[0] - 1]
    before: code.substr(0, token[1]).split("\n")
    line_no: before.length
    before: before[line_no - 1]
    after: code.substr(token[1], code.length).split("\n")[0]
    e.message: message + "\n" +
      "Line " + line_no + ": " + inspect(before) + " !! " + inspect(after) + "\n" +
      "Token " + num + ": " + JSON.stringify(tokens[num - 1])
    throw e

CoffeePot.parse: args... =>
  parser.parse(args...)

CoffeePot.generate_parser: =>

  # Generate the parser code
  jison: parser.generate({
    moduleType: "js",
    lexerSource: "\n\nvar lexer = {\n    " +
      ((name +": " + value) for name, value of parser.lexer).join(",\n    ") +
      "\n};\n"
  })

  # Footer put at end of code
  footer: =>
    root: exports ? this
    CoffeePot: (root.CoffeePot ?= {})
    CoffeePot.parse: args... =>
      parser.parse(args...)
    # Define Object.keys for browsers that don't have it.
    Object.keys: (obj => key for key, value of obj) unless Object.keys?


  "(function () {\n" +
    (("  " + line) for line in jison.split("\n")).join("\n") + "\n" +
    (footer + "").match(/\{([\s\S]*)\}/)[1] +
    "\n}());\n";
