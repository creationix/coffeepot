root: exports ? this
CoffeePot: (root.CoffeePot ?= {})
grammar: CoffeePot.grammar ? require('coffeepot/grammar').CoffeePot.grammar

debug: false

# Recursive decent grammar interpreter!
parse: tokens =>

  # Helper for debug lines
  prefix: offset =>
    token: if offset < tokens.length then tokens[offset][0] + "" else ""
    num: offset + ""
    "\n" + num + " " + token + "           ".substr(token.length + num.length)

  # Tries to match a non-terminal at a specified location in the token stream
  try_nonterminal: name, offset =>
    print(prefix(offset) + name) if debug

    # Find the option with the longest match
    node: false
    filter: false
    new_offset: offset - 1
    next_token: tokens[offset][0]
    for option in grammar[name].options when option.firsts[next_token]
      result: try_pattern(option.pattern, offset)
      if result and result.offset > new_offset
        new_offset: result.offset
        node: result.node
        filter: option.filter

    # Fail if there are no matches
    return unless node

    # Apply filters
    node: filter.call(node) if filter
    node: if grammar[name].filter
      grammar[name].filter.call(node, name)
    else
      [name, node]

    print(prefix(offset) + JSON.stringify(node)) if debug
    { node: node, offset: new_offset }

  # Try's to match a single line in the grammar
  try_pattern: pattern, offset =>
    print(prefix(offset) + "  " + pattern.join(" ")) if debug

    contents: []
    for item in pattern
      return unless result: try_item(item, offset)
      offset = result.offset
      contents.push(result.node)

    print(prefix(offset) + "  " + JSON.stringify(contents)) if debug
    { node: contents, offset: offset }

  # Tries to match a single item in the grammar
  try_item: item, offset =>
    print(prefix(offset) + "    " + item) if debug
    return if offset >= tokens.length
    result: if grammar[item]
      try_nonterminal(item, offset)
    else if item == tokens[offset][0]
      { node: tokens[offset], offset: offset + 1 }
    return unless result
    print(prefix(offset) + "    " + JSON.stringify(result.node)) if debug
    result

  if tree: try_nonterminal("Start", 0)
    tree.node
  else
    false

CoffeePot.parse: parse


