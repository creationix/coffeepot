CoffeePot: require('coffeepot').CoffeePot

process.mixin(require('sys'))
file: require('file')
file.read("sample.coffee").addCallback() code =>
  try
    tree: CoffeePot.parse(code)
    try
      js: CoffeePot.generate(tree)
      puts("\nJS:\n")
      puts(js)
      puts("\nTree:\n")
      puts(inspect(tree))
    catch e
      puts(e.stack)
  catch e
    puts(e.message)
