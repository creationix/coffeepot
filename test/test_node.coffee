CoffeePot: require('coffeepot').CoffeePot

process.mixin(require('sys'))
file: require('file')
file.read("sample.coffee").addCallback() code =>
  puts("Code:\n")
  puts(code)
  tokens: CoffeePot.tokenize(code)
  puts("\nTokens:\n")
  puts(inspect(tokens))
  tree: CoffeePot.parse(tokens)
  puts("\nTree:\n")
  puts(inspect(tree))
  js: CoffeePot.generate(tree)
  puts("\nJS:\n")
  puts(js)
