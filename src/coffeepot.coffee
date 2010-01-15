CoffeePot: `exports`
process.mixin(CoffeePot, require("coffeepot/grammer"))
process.mixin(CoffeePot, require("coffeepot/lexer"))
process.mixin(CoffeePot, require("coffeepot/parser"))

# Splits a non-terminal pattern into an array of plain strings.
split: pattern =>
  if pattern == ""
    []
  else
    pattern.match(/('[^']+'|\S+)/g).map() item =>
      item.replace(/'/g, '')

failed_cache: {}

# Store an item in the failure cache
fail: name, offset =>
  failed_cache[offset] = [] unless failed_cache[offset]
  return false if failed_cache[offset].indexOf(name) >= 0
  failed_cache[offset].push(name)
  false

# Check the failure cache
already: name, offset =>
  failed_cache[offset] && failed_cache[offset].indexOf(name) >= 0

# Recursive decent grammer interpreter!
parse: tokens =>
  grammer: CoffeePot.grammer

  # Tries to match a non-terminal at a specified location in the token stream
  try_nonterminal: name, offset =>
    puts("non-terminal: " + name)
    # Try all the options in the non-terminal's definition
    for pattern_string, callback of grammer[name]
      try
        result: try_pattern(split(pattern_string), offset)
        puts("SUCCESS!!! " + inspect(result))
        throw("SUCCESS")
        return result
      catch e
        if (e == "NO_PATTERN")
          fail(name, offset)
        else
          throw new Error(e)
    false

  # Try's to match a single line in the grammer
  try_pattern: pattern, offset =>

    puts("  pattern: " + pattern)
    # Ignore empty patterns for now
    if pattern.length == 0
      throw "NO_PATTERN"

    for item in pattern
      result: try_item(item, offset) unless already(item, offset)
      puts("  result: " + inspect(result))
      throw "NO_PATTERN" unless result
      result

  # Tries to match a single item in the grammer
  try_item: item, offset =>
    puts("    item: " + item + " against " + tokens[offset][0])
    # Match nested non-terminals
    if grammer[item]
      try_nonterminal(item, offset) unless already(item, offset)
    else
      item == tokens[offset][0]

  accept: offset =>
    puts("Accepted:" + inspect(tokens[offset]))


  try_nonterminal("Root", 0)



CoffeePot.compile: code =>
  tokens: CoffeePot.tokenize(code)
  tree: parse(tokens)
  puts("\nFailed Cache:\n")
  puts(inspect(failed_cache))
  puts("\nTree:\n")
  puts(inspect(tree))
  puts("\nTokens:\n")
  puts(inspect(tokens))
  puts("Code:\n")
  puts(code)

process.mixin(require('sys'))
file: require('file')
file.read("../test/parse.coffee").addCallback(CoffeePot.compile).addErrback() error =>
  debug(error)