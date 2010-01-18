root: exports ? this
CoffeePot: (root.CoffeePot ?= {})

# Splits a non-terminal pattern into an array of plain strings.
split: pattern =>
  if pattern == ""
    []
  else
    pattern.match(/('[^']+'|\S+)/g).map() item =>
      item.replace(/'/g, '')


# Takes a grammer object and calculates the FIRST set for it
calc_firsts: grammar =>
  # Finds the firsts for each non-terminal
  find_firsts: name, non_terminal =>
    non_terminal.firsts ?= {}
    for option in non_terminal.options
      option.firsts ?= {}
      pattern: option.pattern
      continue if ignore[pattern]
      if pattern.length == 0
        non_terminal.firsts["~"] = true
        option.firsts["~"] = true
      else
        check_first: index =>
          first: pattern[index]
          if grammar[first]
            ignore[pattern] = true
            for name, exists of find_firsts(name, grammar[first])
              if name == "~" and index < pattern.length - 1
                check_first(index + 1)
              else
                non_terminal.firsts[name] = true
                option.firsts[name] = true
          else
            non_terminal.firsts[first] = true
            option.firsts[first] = true
        check_first(0)
    non_terminal.firsts

  # Keep running till no new firsts are found
  old_sum: -1
  sum: 0
  while (old_sum < sum)
    for name, non_terminal of grammar
      ignore: {}
      find_firsts(name, non_terminal)
    old_sum: sum
    sum: 0
    for name, non_terminal of grammar
      sum += Object.keys(non_terminal.firsts).length
      for option in non_terminal.options
        sum += Object.keys(option.firsts).length


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

  define: grammar =>
    calc_firsts(grammar)
    calc_follows(grammar)
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
