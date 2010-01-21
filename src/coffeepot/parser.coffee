process.mixin(require('sys'))
root: exports ? this
CoffeePot: (root.CoffeePot ?= {})
CoffeePot.grammar ?= require('coffeepot/grammar').CoffeePot.grammar
CoffeePot.tokenize ?= require('coffeepot/lexer').CoffeePot.tokenize
Parser: require('jison').Parser

bnf: {}
tokens: []
for name, non_terminal of CoffeePot.grammar
  bnf[name]: for option in non_terminal
    for part in option[0].split(" ")
      if !CoffeePot.grammar[part]
        tokens.push(part)
    if name == "Root"
      option[1] = "return " + option[1]
    option
tokens = tokens.join(" ")

parser: new Parser({tokens: tokens, bnf: bnf}, {debug: false})

# Thin wrapper around the real lexer
parser.lexer = {
  lex: =>
    token: this.tokens[this.pos] || [""]
    this.pos++
    this.yytext = token[2]
    token[0]
  setInput: tokens =>
    this.tokens = tokens
    this.pos = 0
  upcomingInput: => ""
  showPosition: => this.pos
}

CoffeePot.parse: code =>
  tokens: CoffeePot.tokenize(code)
  try
    parser.parse(tokens)
  catch e
    [message, num] = e.message.split("\n")
    token: tokens[num - 1]
    before: code.substr(0, token[1]).split("\n")
    line_no: before.length
    before: before[line_no - 1]
    after: code.substr(token[1], code.length).split("\n")[0]

    e.message: message + "\n" +
      "Line " + line_no + ": " + inspect(before) + " !! " + inspect(after) + "\n" +
      "Token " + num + ": " + JSON.stringify(tokens[num - 1])
    throw e
