root: exports ? this
CoffeePot: (root.CoffeePot ?= {})
CoffeePot.tokenize ?= require('coffeepot/lexer').CoffeePot.tokenize
CoffeePot.parse ?= require('coffeepot/parser').CoffeePot.parse
CoffeePot.generate ?= require('coffeepot/generator').CoffeePot.generate

CoffeePot.compile: code =>
  tokens: CoffeePot.tokenize(code)
  tree: CoffeePot.parse(tokens)
  CoffeePot.generate(tree)


