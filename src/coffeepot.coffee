root: exports ? this
CoffeePot: (root.CoffeePot ?= {})
CoffeePot.tokenize ?= require('coffeepot/lexer').CoffeePot.tokenize
CoffeePot.parse ?= require('coffeepot/parser').CoffeePot.parse
CoffeePot.generate ?= require('coffeepot/generator').CoffeePot.generate

CoffeePot.compile: code =>
  tokens: CoffeePot.tokenize(code)
  tree: CoffeePot.parse(tokens)
  js: CoffeePot.generate(tree)
  { tokens: tokens, tree: tree, js: js}


