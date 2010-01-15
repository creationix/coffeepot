CoffeePot: `exports`
process.mixin(CoffeePot, require("coffeepot/grammar"))
process.mixin(CoffeePot, require("coffeepot/lexer"))
process.mixin(CoffeePot, require("coffeepot/parser"))

# Splits a non-terminal pattern into an array of plain strings.
split: pattern =>
  pattern = pattern.substr(1, pattern.length - 2)
  if pattern == ""
    []
  else
    pattern.match(/('[^']+'|\S+)/g).map() item =>
      item.replace(/'/g, '')

# Helpers to memoize the functions
cache: {}
store: offset, name, value =>
  # puts("Storing " + inspect(value) + " at " + inspect(name) + "," + offset)
  cache[offset] = [] unless cache[offset]
  cache[offset][name] = value
check: offset, name =>
  cache[offset] && cache[offset].hasOwnProperty(name)
get: offset, name =>
  cache[offset][name]

memoize: fn =>
  memoized: name, offset =>
    # puts(inspect(name) + " at " + offset)
    return get(offset, name) if check(offset, name)
    store(offset, name, fn(name, offset))

# Recursive decent grammar interpreter!
parse: tokens =>
  grammar: CoffeePot.grammar

  # Tries to match a non-terminal at a specified location in the token stream
  try_nonterminal: memoize() name, offset =>
    puts("non-terminal: " + name + " " + offset)

    match: null

    # Try all the options in the non-terminal's definition
    for pattern_pair, callback in grammar[name]
      pattern_string: pattern_pair[0]
      if result: try_pattern("[" + pattern_string + "]", offset)
        fn: pattern_pair[1]
        token: if fn
          fn.call(result[0])
        else
          result[0]
        if !match || result.offset > match.longest
          puts("Matched " + offset + " " + name + " to " + JSON.stringify(token))
          match: {
            longest: token.offset
            token: token
            offset: result[1]
          }

    return unless match
    puts("Longest match " + offset + " " + name + " is " + JSON.stringify(match.token))
    return [[name], match.offset] if match.length == 0
    return [[name, match.token[0]], match.offset] if match.length == 1
    [[name, match.token], match.offset]

  # Try's to match a single line in the grammar
  try_pattern: memoize() pattern_string, offset =>
    puts("  pattern: " + pattern_string + " " + offset)

    # Prevent infinite recursion
    store(offset, pattern_string, false) unless check(offset, pattern_string)

    pattern: split(pattern_string)

    # While loops don't mess with scope, so they work well here.
    pos: 0
    length: pattern.length
    contents: []
    while pos < length
      return unless result: try_item(pattern[pos], offset)
      puts ("    ACCEPT: " + pattern[pos] + " " + JSON.stringify(result))
      offset = result[1]
      contents.push(result[0])
      pos++
    [contents, offset]

  # Tries to match a single item in the grammar
  try_item: memoize() item, offset =>
    puts("    item: " + item + " against " + tokens[offset][0] + " " + offset)
    # Match nested non-terminals
    if grammar[item]
      return try_nonterminal(item, offset)
    else if item == tokens[offset][0]
        return [tokens[offset], offset + 1]

  try_nonterminal("Root", 0)[0]



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