
root: exports ? this
CoffeePot: (root.CoffeePot ?= {})

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
      pattern: pattern_string
    }
    option.filter: fn if fn
    option

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

# Define Object.keys for browsers that don't have it.
Object.keys: (obj => key for key, value of obj) unless Object.keys?

CoffeePot.Helper = Helper
