CoffeePot ?= require('coffeepot').CoffeePot

process.mixin(require('sys'))
file: require('file')
file.read("sample.coffee").addCallback() code =>
  {
    tokens: tokens
    tree: tree
    js: js
  } = CoffeePot.compile(code)
  puts("\nJS:\n")
  puts(js)
  puts("\nTree:\n")
  puts(inspect(tree))
  puts("\nTokens:\n")
  puts(inspect(tokens))
  puts("Code:\n")
  puts(code)
