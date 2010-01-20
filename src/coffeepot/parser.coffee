process.mixin(require('sys'))
root: exports ? this
CoffeePot: (root.CoffeePot ?= {})
CoffeePot.grammar ?= require('coffeepot/grammar').CoffeePot.grammar
Parser: require('jison').Parser

bnf: {}
for name, non_terminal of CoffeePot.grammar
  bnf[name] = []
  for option in non_terminal.options
    # TODO: ["ONE more", "$$ = ['ONE', yytext, $2]"]
    bnf[name].push(option.pattern)

parser: new Parser({bnf: bnf}, {debug: false})

# Thin wrapper around the real lexer
parser.lexer = {
  lex: =>
    token: this.tokens[this.pos]
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