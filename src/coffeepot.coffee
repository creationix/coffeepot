root: exports ? this
CoffeePot: (root.CoffeePot ?= {})
CoffeePot.tokenize ?= require('coffeepot/lexer').CoffeePot.tokenize
CoffeePot.parse ?= require('coffeepot/parser').CoffeePot.parse
CoffeePot.generate ?= require('coffeepot/generator').CoffeePot.generate

CoffeePot.compile: (code) ->
  tokens: CoffeePot.tokenize(code)
  try
    tree: CoffeePot.parse(tokens)
  catch e
    [message, num] = e.message.split("\n")
    num: parseInt(num) - 1
    if token: tokens[num]
      line_no: token[1] and (token[1][1] + 1)
      before: code.substr(0, token[1][0]).match(/\n?.*$/)[0]
      after: code.substr(token[1][0], code.length).match(/^.*\n?/)[0]
      token_before: tokens.slice(0, num).filter (token) -> token[1] && (token[1][1] == line_no - 1)
      token_before: token_before.map (token) -> token[0]
      token_after: tokens.slice(num, tokens.length).filter (token) -> token[1] && (token[1][1] == line_no - 1)
      token_after: token_after.map (token) -> token[0]
      e.message: message + "\n" +
        "but found '" + token[0] + "'\n" +
        "Line " + line_no + ": " + JSON.stringify(before) + " !! " + JSON.stringify(after) + "'\n" +
        "Tokens " + JSON.stringify(token_before) + " !! " + JSON.stringify(token_after)
    throw e
  CoffeePot.generate(tree)


