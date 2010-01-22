var file = require('file');
var CoffeePot = require('coffeepot/grammar').CoffeePot;
file.write("lib/coffeepot/parser.js", CoffeePot.generate_parser());