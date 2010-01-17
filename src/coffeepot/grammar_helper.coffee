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


