CoffeePot: require('coffeepot').CoffeePot

process.mixin(require('sys'))
file: require('file')
file.read("sample.coffee").addCallback() code =>
  tokens: CoffeePot.tokenize(code)
  # puts("\nTokens:\n")
  # puts(inspect(tokens.map(token => token[0])))
  try
    tree: CoffeePot.parse(tokens, code)
    try
      js: CoffeePot.generate(tree)
      puts("\nJS:\n")
      puts(js)
      puts("\nTree:\n")
      puts(inspect(tree))
    catch e
      puts(e.stack)
  catch e
    puts(e.stack)
