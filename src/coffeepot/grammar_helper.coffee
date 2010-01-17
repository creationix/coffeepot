if `exports`
  Helper: `exports`
else
  {}
process.mixin(Helper, require('sys'))

# Splits a non-terminal pattern into an array of plain strings.
split: pattern =>
  if pattern == ""
    []
  else
    pattern.match(/('[^']+'|\S+)/g).map() item =>
      item.replace(/'/g, '')

# Helper for non-terminal definitions
Helper.g: options, fn =>
  non_terminal: {
    options: options
  }
  non_terminal.filter: fn if fn
  non_terminal

# Helper for non-terminal pattern options
Helper.p: pattern_string, fn =>
  option: {
    pattern: split(pattern_string)
  }
  option.filter: fn if fn
  option


Helper.define: grammar =>
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


