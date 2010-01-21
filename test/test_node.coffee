CoffeePot: require('coffeepot').CoffeePot

process.mixin(require('sys'))
file: require('file')
file.read("sample.coffee").addCallback() code =>
  try
    tree: CoffeePot.parse(code)
    puts("\nTree:\n")
    puts(inspect(tree))
  catch e
    puts(e.message)
