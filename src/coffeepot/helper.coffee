root: exports ? this
CoffeePot: (root.CoffeePot ?= {})

# Splits a non-terminal pattern into an array of plain strings.
split: pattern =>
  if pattern == ""
    []
  else
    pattern.match(/('[^']+'|\S+)/g).map() item =>
      item.replace(/'/g, '')

Helper: {
  # Helper for non-terminal definitions
  non_terminal: options, fn =>
    non_terminal: {
      options: options
    }
    non_terminal.filter: fn if fn
    non_terminal

  # Helper for non-terminal pattern options
  option: pattern_string, fn =>
    option: {
      pattern: split(pattern_string)
    }
    option.filter: fn if fn
    option

  # Takes a grammer object and calculates the firsts for it
  define: grammar =>
    # Finds the firsts for each non-terminal
    find_firsts: name, non_terminal =>
      return non_terminal.firsts if non_terminal.firsts
      non_terminal.firsts: {}
      for option in non_terminal.options
        option.firsts: {}
        pattern: option.pattern
        if pattern.length > 0
          first: pattern[0]
          if grammar[first]
            for name, exists of find_firsts(name, grammar[first])
              non_terminal.firsts[name] = exists
              option.firsts[name] = exists
          else
            non_terminal.firsts[first] = true
            option.firsts[first] = true
      non_terminal.firsts

    for name, non_terminal of grammar
      find_firsts(name, non_terminal)
    grammar

  # Trims leading whitespace from a block of text
  block_trim: text =>
    lines: text.split("\n")
    min: null
    for line in lines
      continue unless (match: line.match(/^(\s*)\S/))
      indent: match[1].length
      if min == null or indent < min
        min: indent
    lines: lines.map() line =>
      line.substr(min, line.length)
    lines.join("\n")

}

CoffeePot.Helper = Helper
