CoffeePot: require('coffeepot').CoffeePot

process.mixin(require('sys'))
file: require('file')
file.read("sample.coffee").addCallback() code =>
  # puts("Code:\n")
  # puts(code)
  tokens: CoffeePot.tokenize(code)
  # puts("\nTokens:\n")
  # puts(inspect(tokens))
  js: CoffeePot.parse(tokens)
  puts("\nJS:\n")
  puts(js)
