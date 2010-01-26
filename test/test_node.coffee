CoffeePot: require('coffeepot').CoffeePot

process.mixin(require('sys'))
file: require('file')
file.read("sample.coffee").addCallback (code) ->
  try
    js: CoffeePot.compile(code)
    puts("\nJS:\n")
    puts(js)
  catch e
    puts(e.stack)
