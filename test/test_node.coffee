CoffeePot: require('coffeepot').CoffeePot

process.mixin(require('sys'))
file: require('file')
file.read("sample.coffee").addCallback() code =>
  js: CoffeePot.compile(code)
  # # puts("\nTokens:\n")
  # # puts(inspect(tokens))
  # try
  #   tree: CoffeePot.parse(tokens, code)
  #   try
  #     js: CoffeePot.generate(tree)
  #     puts("\nJS:\n")
  #     puts(js)
  #     puts("\nTree:\n")
  #     puts(inspect(tree))
  #   catch e
  #     puts(e.stack)
  # catch e
  #   puts(e.stack)
