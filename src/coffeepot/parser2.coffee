process.mixin(require('sys'))

Jison: require('jison')
puts(inspect(Jison))

grammar: {
  lex: {
    rules: [
      ["\\s+", "/* skip whitespace */"]
      ["[a-f0-9]+", "return 'HEX';"]
    ]
  }

  bnf: {
    start: [
      ["hex_strings", "return $$ = $1;"]
    ]
    hex_strings: [
      ["hex_strings HEX", "$$ = $1.concat([yytext])"]
      ["HEX", "$$ = [yytext];"]
    ]
  }
}

# parser: new Parser(grammar)

# generate source, ready to be written to disk

# puts(inspect(parser.parse("adfe34bc e82a 123 456 789")))

# We can generate a JavaScript parser too
# print(parser.generate())


