CoffeePot ?= {}
grammar: CoffeePot.Helper ? require('coffeepot/grammar').CoffeePot.grammar

debug: false

# Helpers to memoize the functions
cache: {}
locks: {}
store: offset, name, value =>
  cache[offset] = [] unless cache[offset]
  cache[offset][name] = value
check: offset, name =>
  # return true if locks[offset+name]
  cache[offset] && cache[offset].hasOwnProperty(name)
get: offset, name =>
  # return false if locks[offset+name]
  cache[offset][name]
lock: offset, name =>
  locks[offset+name] = true
unlock: offset, name =>
  delete locks[offset+name]

memoize: fn =>
  memoized: name, offset =>
    return get(offset, name) if check(offset, name)
    store(offset, name, fn(name, offset))

# Recursive decent grammar interpreter!
parse: tokens =>

  prefix: offset =>
    token: tokens[offset][0] + ""
    num: offset + ""
    "\n" + num + " " + token + "           ".substr(token.length + num.length)

  # Tries to match a non-terminal at a specified location in the token stream
  try_nonterminal: name, offset =>
    print(prefix(offset) + name) if debug

    match: null
    non_terminal: grammar[name]

    # Try all the options in the non-terminal's definition
    for option in non_terminal.options
      continue unless option.firsts[tokens[offset][0]]
      result: try_pattern(option.pattern, offset)
      print(" o") if debug
      if result
        token: if option.filter
          option.filter.call(result[0])
        else
          result[0]
        if !match || result.offset > match.longest
          match: {
            longest: token.offset
            token: token
            offset: result[1]
          }

    return unless match
    print(" O") if debug
    node: if non_terminal.filter
      match.token: non_terminal.filter.call(match.token, name)
    else
      [name, match.token]
    print(" " + JSON.stringify(node)) if debug
    [node, match.offset]

  # Try's to match a single line in the grammar
  try_pattern: pattern, offset =>
    print(prefix(offset) + "  " + pattern) if debug

    # While loops don't mess with scope, so they work well here.
    pos: 0
    length: pattern.length
    contents: []
    while pos < length
      return unless result: try_item(pattern[pos], offset)
      print(" .") if debug
      offset = result[1]
      contents.push(result[0])
      pos++
    [contents, offset]

  # Tries to match a single item in the grammar
  try_item: item, offset =>
    print(prefix(offset) + "    " + item) if debug
    return if offset >= tokens.length
    if grammar[item]
      return try_nonterminal(item, offset)
    else if item == tokens[offset][0]
        return [tokens[offset], offset + 1]

  try_nonterminal("Block", 0)[0]


(exports ? this).CoffeePot: {
  parse: parse
}


