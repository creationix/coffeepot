root: exports ? this
CoffeePot: (root.CoffeePot ?= {})

Booleans: [
  "true", "false"
  "yes", "no"
  "on", "off"
]

Keywords: [
  "if", "else", "then", "unless"
  "and", "or", "is", "isnt", "not"
  "new", "return"
  "try", "catch", "finally", "throw"
  "break", "continue"
  "for", "in", "of", "by", "where", "while"
  "switch", "when"
  "super", "extends"
  "arguments", "var"
  "delete", "instanceof", "typeof"
]

# Tokens that contain a value
Containers: [
  "COMMENT", "ID", "PROPERTY"
  "OPERATOR", "NUMBER", "BOOLEAN"
  "RAW", "HEREDOC", "STRING", "REGEX"
]


# Remember that regular expressions are really functions, so for the special
# cases where regular expressions aren't powerful enough, we can use a custom
# function.
Tokens: {
  # These are taken literally
  CODE: /^([\(\)\[\]\{\}:=;,.])/
  NEWLINE: /^([ \t]*\n)/
  WS: /^([ \t]+)/
  COMMENT: /^(#.*)\n?/
  ID: /^([a-z_$][a-z0-9_$]*)/i
  ROCKET: /^(=>)/
  OPERATOR: /^([+\*&|\/\-%=<>!?]+)/
  DOTDOTDOT: /^(\.\.\.)/
  DOTDOT: /^(\.\.)/

  # A little cheating to keep from having to write a proper number parser
  NUMBER: code =>
    if !code[0].match(/[0-9.-]/)
      return null
    if not isNaN(num: parseInt(code) || parseFloat(code))
      {"1": num + ""}

  # Embedded raw JavaScript
  JS: code =>
    if code[0] != "`"
      return null
    pos: 1
    len: code.length + 1
    done: false
    while not done and pos < len
      if code[pos] == "`"
        done: true
      if code[pos] == "\\"
        pos++
      pos++
    if pos >= len
      null
    else
      {"1":code.substr(0, pos)}

  # Parse heredoc strings using a simple state machine
  HEREDOC: code =>
    if !(slice: code.match(/^("""|''')\n/))
      return null
    slice: slice[1]
    pos: 3
    len: code.length + 1
    done: false
    while not done and pos < len
      if code.substr(pos, 3) == slice
        done: true
        pos += 2
      pos++
    if pos >= len
      null
    else
      {"1":code.substr(0, pos)}

  # Parse strings using a simple state machine
  STRING: code =>
    quote: code[0]
    return null unless quote == "\"" or quote == "\'"
    pos: 1
    len: code.length + 1
    done: false
    while not done and pos < len
      if code[pos] == quote
        done: true
      if code[pos] == "\\"
        pos++
      pos++
    if pos >= len
      null
    else
      {"1":code.substr(0, pos)}

  # Same story as strings, but even more evil!
  REGEX: code =>
    start: code[0]
    return null unless code[0] == "\/"
    pos: 1
    len: code.length + 1
    done: false
    while not done and pos < len
      try
        eval(code.substr(0, pos))
        done: true
      catch e
        pos++
    if pos >= len
      null
    else
      {"1":code.substr(0, pos)}

}

tokens: []

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

# Does a simple longest match algorithm
match_token: code =>
  result: null
  for name, matcher of Tokens
    if (match: matcher(code))
      if result == null || match[1].length > result[1].length
        result: [name, match[1]]
  if result
    result
  else
    debug(inspect(tokens))
    throw new Error("Unknown Token: " + JSON.stringify(code.split("\n")[0]))

strip_heredoc: raw =>
  lines: Helper.block_trim(raw.substr(4, raw.length - 7))

# Take a raw token stream and strip out unneeded whitespace tokens and insert
# indent/dedent tokens. By using a stack of indentation levels, we can support
# mixed spaces and tabs as long the programmer is consistent within blocks.
analyse: tokens =>
  last: null
  result: []
  stack: [""]
  for token in tokens
    if last and last[0] == "NEWLINE" and token[0] != "NEWLINE"
      top: stack[stack.length - 1]
      indent: if token[0] == "WS"
        token[2]
      else
        ""

      # Look for dedents
      while indent.length < top.length
        if indent != top.substr(0, indent.length)
          throw new Error("Indentation mismatch")
        result.push(["DEDENT", token[1], top])
        # result.push(["NEWLINE", token[1] ])
        stack.pop()
        top: stack[stack.length - 1]

      # Check for indents
      if indent.length > top.length
        if top != indent.substr(0, top.length)
          throw new Error("Indentation mismatch")
        result.push(["INDENT", token[1], indent])
        stack.push(indent)

      # Check for other possible mismatch
      if indent.length == top.length && indent != top
        throw new Error("Indentation mismatch")

    # Strip out unwanted whitespace tokens
    if token[0] != "WS"
      if !(token[0] == "NEWLINE" && (!last || last[0] == "NEWLINE"))

        # Look for reserved identifiers and mark them
        if token[0] == "ID"
          if Keywords.indexOf(token[2]) >= 0
            token[0] = token[2]
          else if (idx: Booleans.indexOf(token[2])) >= 0
            token[0] = "BOOLEAN"
            token[2] = idx % 2 == 0

        # Convert strings to their raw value
        if token[0] == "STRING"
          token[2] =
          token[2]: try
            token[2] = JSON.parse(token[2].replace(/\n/g, "\\n"))
          catch e

            false

        # Strip leading whitespace off heredoc blocks
        if token[0] == "HEREDOC"
          token[2] = strip_heredoc(token[2])
          token[0] = "STRING"

        if token[0] == "COMMENT"
          token[2] = token[2].substr(1, token[2].length)

        if token[0] == "CODE"
          token[0] = token[2]
        if Containers.indexOf(token[0]) < 0
          token.length = 2

        result.push(token)
    last: token

  # Flush the stack
  while stack.length > 1
    result.push(["DEDENT", last[1], stack.pop()])

  result

# Turns a long string into a stream of tokens
CoffeePot.tokenize: source =>
  source += "\n"
  length: source.length
  pos: 0
  tokens: []
  while pos < length
    [type, match, consume] = match_token(source.substr(pos, length))
    line_no: source.substr(0, pos).replace(/[^\n]/g, "").length
    tokens.push([type, [pos, line_no], match])
    pos += match.length
  analyse(tokens)
