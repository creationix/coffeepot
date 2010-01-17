process.mixin(require('sys'))

CoffeePot: `exports`
process.mixin(CoffeePot, require("coffeepot/grammar"))
process.mixin(CoffeePot, require("coffeepot/lexer"))

puts(inspect(CoffeePot.grammar))