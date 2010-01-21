process.mixin(require('sys'))
root: exports ? this
CoffeePot: (root.CoffeePot ?= {})
CoffeePot.grammar ?= require('coffeepot/grammar').CoffeePot.grammar
Parser: require('jison').Parser

bnf: {}
for name, non_terminal of CoffeePot.grammar
  bnf[name]: for option in non_terminal
    if option[1] and name == "Start"
      option[1] = "return " + option[1]
    option
# puts(inspect(bnf))

parser: new Parser({tokens: "NEWLINE COMMENT ;", bnf: bnf}, {debug: false})

# Thin wrapper around the real lexer
parser.lexer = {
  lex: =>
    token: this.tokens[this.pos] || [""]
    # puts(inspect(token))
    this.pos++
    this.yytext = token[1]
    token[0]
  setInput: tokens =>
    this.tokens = tokens
    this.pos = 0
  upcomingInput: => ""
  showPosition: => this.pos
}

CoffeePot.parse: tokens =>
  parser.parse(tokens)