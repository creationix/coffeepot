CoffeePot: `exports`
process.mixin(CoffeePot, require("coffeepot/grammar"))
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

# Recursive decent grammar interpreter!
parse: tokens =>
  grammar: CoffeePot.grammar

  # Tries to match a non-terminal at a specified location in the token stream
  try_nonterminal: name, offset =>
    if name == "Expressions" || name == "Terminal"
      puts("non-terminal: " + name)
      puts(tokens[offset])

    length: null
    match: null

    # Try all the options in the non-terminal's definition
    old_offset: offset
      offset: old_offset
    for pattern_string, callback of grammar[name]
      try
        result: try_pattern(split(pattern_string), offset)
        offset = result[1]
        result = result[0]
        if !length || result.length > length
          length: result.length
          match: result
      catch e
        if (e == "NO_PATTERN")
          fail(name, offset)
        else
          throw new Error(e)
    return false unless match
    if match.length == 0
      [[name], offset]
    else if match.length == 1
      [[name, match[0]], offset]
    else
      [[name, match], offset]

  # Try's to match a single line in the grammar
  try_pattern: pattern, offset =>

    puts("  pattern: " + pattern)
    # Ignore empty patterns for now
    if pattern.length == 0
      []

    contents: for item in pattern
      result: try_item(item, offset) unless already(item, offset)
      # puts("  result: " + inspect(result))
      throw "NO_PATTERN" unless result
      offset = result[1]
      result[0]
    [contents, offset]

  # Tries to match a single item in the grammar
  try_item: item, offset =>
    # puts("    item: " + item + " against " + tokens[offset][0])
    # Match nested non-terminals
      try_nonterminal(item, offset) unless already(item, offset)
    if grammar[item]
    else
      if item == tokens[offset][0]
        puts ("ACCEPT:" + tokens[offset] + " " + offset)
        return [tokens[offset], offset + 1]

  [tree, offset] = try_nonterminal("Root", 0)
  if tokens[offset][0] != "END"
    puts("DUMP OF TREE: " + inspect(tree))
    throw new Error("Unexpected token: " + tokens[offset])
  tree



CoffeePot.compile: code =>
  tokens: CoffeePot.tokenize(code)
  tree: parse(tokens)
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