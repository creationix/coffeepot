process.mixin(require('sys'))
root: exports ? this
CoffeePot: (root.CoffeePot ?= {})

# Transforms the generated javascript to a snipped as expected by Jison
unwrap: /function\s*\(\)\s*\{\s*return\s*([\s\S]*);\s*\}/

Helper: {

  # Converts the generated function into something Jison likes
  option: pattern_string, fn =>
    if fn
      fn: if match: (fn + "").match(unwrap)
        match[1]
      else
        "(" + fn + "())"
      [pattern_string, "$$ = " + fn + ";"]
    else
      [pattern_string, "$$ = $1;"]

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
