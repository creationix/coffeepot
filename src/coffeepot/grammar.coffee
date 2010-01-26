root: exports ? this
CoffeePot: (root.CoffeePot ?= {})
Parser: require('jison').Parser

# Helper to make our pretty syntax work with Jison
o: (pattern_string, fn) ->
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
    o "Block", -> ["Root", ["Block", $1]]
    o "", -> false
  ]

  Block: [
    o "Statement NEWLINE", -> [$1]
    o "Block Statement NEWLINE", -> $1.concat([$2])
  ]

  Statement: [
    o "Expression if Expression", -> ["If", $3, $1]
    o "Expression unless Expression", -> ["If", ["Not", $3], $1]
    o("Expression")
    o "COMMENT", -> ["COMMENT", yytext]
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
    o "Id CallArgs", -> ["Call", null, $1, $2]
    o "Expression . Id CallArgs", -> ["Call", $1, $3, $4]
  ]

  CallArgs: [
    o "( )", -> []
    o "( Expressionlist )", -> $2
    o "Expressionlist", -> $1
  ]

  ExpressionList: [
    o "Expression", -> [$1]
    o "ExpressionList , Expression", -> $1.concat([$3])
  ]

  Binop: [
    o "Expression Operator Expression", -> ["Binop", $2, $1, $3]
  ]

  Array: [
    o "[ ArrayItems ]", -> ["Array", $2]
    o "[ INDENT ArrayItems NEWLINE DEDENT NEWLINE ]", -> ["Array", $3]
  ]

  ArrayItems: [
    o "Expression", -> [$1]
    o "ArrayItems , Expression", -> $1.concat([$3])
    o "ArrayItems NEWLINE Expression", -> $1.concat([$3])
  ]

  Object: [
    o "{ ObjectItems }", -> ["Object", $2]
    o "{ INDENT ObjectItems NEWLINE DEDENT NEWLINE }", -> ["Object", $3]
  ]

  ObjectItem: [
    o "Id : Expression", -> [$1, $3]
    o "String : Expression", -> [$1, $3]
  ]

  ObjectItems: [
    o "ObjectItem", -> [$1]
    o "ObjectItems , ObjectItem", -> $1.concat([$3])
    o "ObjectItems NEWLINE ObjectItem", -> $1.concat([$3])
  ]

  Operator: [
    o "OPERATOR", -> yytext
  ]

  Literal: [
    o "NUMBER", -> ["NUMBER", yytext]
    o "BOOLEAN", -> ["BOOLEAN", yytext]
    o "REGEX", -> ["REGEX", yytext]
    o "STRING", -> ["STRING", yytext]
  ]

  Assign: [
    o "Source : Expression", -> ["Assign", $1, $3]
    o "Source = Expression", -> ["Assign", $1, $3]
  ]

  Property: [
    o "Expression . Id", -> ["Property", []]
  ]

  Source: [
    o("Id")
    o "Source . Id", -> ["Property", $1, $3]
    o "Source [ Expression ]", -> ["Property", $1, 3]
  ]

  FunctionBody: [
    o "Expression", -> $1
    o "INDENT Block DEDENT", -> ["Block", $2]
    o "", -> false
  ]

  Function: [
    o "ARROW FunctionBody", -> ["Function", [], $2]
    o "( VarList ) ARROW FunctionBody", -> ["Function", $2, $5]
  ]

  VarListItem: [
    o("Id")
    o("Splat")
  ]

  VarList: [
    o "VarListItem", -> [$1]
    o "VarList , VarListItem", -> $1.concat([$3])
  ]

  Splat: [
    o "Id DOTDOTDOT", -> ["Splat", $1[1]]
  ]

  Id: [
    o "ID", -> ["ID", yytext]
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
  lex: ->
    token: this.tokens[this.pos] || [""]
    this.pos++
    this.yylineno = token and token[1] and token[1][1]
    this.yytext = token[2]
    token[0]
  setInput: (tokens) ->
    this.tokens = tokens
    this.pos = 0
  upcomingInput: -> ""
  showPosition: -> this.pos
}

CoffeePot.parse: (tokens) ->
  parser.parse(tokens)

CoffeePot.generate_parser: ->

  # Generate the parser code
  jison: parser.generate({
    moduleType: "js",
    lexerSource: "\n\nvar lexer = {\n    " +
      ((name +": " + value) for name, value of parser.lexer).join(",\n    ") +
      "\n};\n"
  })

  # Footer put at end of code
  footer: ->
    root: exports ? this
    CoffeePot: (root.CoffeePot ?= {})
    CoffeePot.parse: (tokens) ->
      parser.parse(tokens)
    # Define Object.keys for browsers that don't have it.
    Object.keys: (obj -> key for key, value of obj) unless Object.keys?


  "(function () {\n" +
    (("  " + line) for line in jison.split("\n")).join("\n") + "\n" +
    (footer + "").match(/\{([\s\S]*)\}/)[1] +
    "\n}());\n";
