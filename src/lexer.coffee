
Keywords: [
  "if", "else", "then", "unless"
  "true", "false", "yes", "no", "on", "off"
  "and", "or", "is", "isnt", "not"
  "new", "return"
  "try", "catch", "finally", "throw"
  "break", "continue"
  "for", "in", "of", "by", "where", "while"
  "switch", "when"
  "super", "extends"
  "arguments"
  "delete", "instanceof", "typeof"
]

# Remember that regular expressions are really functions, so for the special
# cases where regular expressions aren't powerful enough, we can use a custom
# function.
Tokens: {
  NEWLINE: /^(\n)/
  WS: /^([ \t]+)/
  COMMENT: /^(#.*)\n?/
  ID: /^([a-z_][a-z0-9_]*)/i
  PROPERTY: /^(\.[a-z_][a-z0-9_]*)/i
  COLON: /^(:)/
  ROCKET: /^(=>)/
  OPERATOR: /^([+\*&|\/\-%=<>:!]+)/
  BRACE: /^([\[\]\{\}])/
  PAREN: /^([\(\)])/
  COMMA: /^(,)/
  DOTDOTDOT: /^(\.\.\.)/
  EXISTENTIAL: /^(\?)/

  # A little cheating to keep from having to write a proper number parser
  NUMBER: code =>
    if !code[0].match(/[0-9.-]/)
      return null
    if not isNaN(num: parseInt(code) || parseFloat(code))
      {"1": num + ""}

  # We're really cheating here.  Just JSON parse the partial string over and
  # over till it comes back successful.  It would probably be faster to
  # implement our own state machine, but this works for now and is very safe.
  STRING: code =>
    quote: code[0]
    return null unless quote == "\"" or quote == "\'"
    pos: 1
    len: code.length + 1
    done: false
    while not done and pos < len
      try
        JSON.parse(code.substr(0, pos))
        done: true
      catch e
        pos++
    if pos >= len
      null
    else
      {"1":code.substr(0, pos)}

  # Same story as strings, but even more evil!
  REGEXP: code =>
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

# Turns a long string into a stream of tokens
tokenize: source =>
  length: source.length
  pos: 0
  while pos < length
    [type, match, consume] = match_token(source.substr(pos, length))
    tokens.push([type, match])
    pos += match.length
  analyse(tokens)

# Take a raw token stream and strip out unneeded whitespace tokens and insert
# indent/dedent tokens. By using a stack of indentation levels, we can support
# mixed spaces and tabs as long the programmer is consistent within blocks.
analyse: tokens =>
  last: null
  result: []
  stack: [""]
  for token in tokens
    if token[0] == "WS" and last and last[0] == "NEWLINE"
      top: stack[stack.length - 1]
      indent: token[1]

      # Look for dedents
      while indent.length < top.length
        if indent != top.substr(0, indent.length)
          throw new Error("Indentation mismatch")
        result.push(["DEDENT", top])
        stack.pop()
        top: stack[stack.length - 1]

      # Check for indents
      if indent.length > top.length
        if top != indent.substr(0, top.length)
          throw new Error("Indentation mismatch")
        result.push(["INDENT", indent])
        stack.push(indent)

      # Check for other possible mismatch
      if indent.length == top.length && indent != top
        throw new Error("Indentation mismatch")

    # Strip out unwanted whitespace tokens
    if token[0] != "WS"
      if !(token[0] == "NEWLINE" && (!last || last[0] == "NEWLINE"))
        if token[0] == "ID" and Keywords.indexOf(token[1]) >= 0
          token[0] = "KEYWORD"
        result.push(token)
        last: token

  # Flush the stack
  while stack.length > 1
    result.push(["DEDENT", stack.pop()])

  # Tack on tail to make parsing easier
  result.push(["END", ""])

  result

# Works as CommonJS module too
if `exports`
  `exports.tokenize = tokenize`

# # Read the script from the current file
# File: require('file')
# process.mixin(require('sys'))
#
# File.read('../test/sample.coffee').addCallback() coffee =>
#   # puts("\nCoffeeScript\n")
#   # puts(coffee)
#   puts("\nTokens\n")
#   puts(inspect(tokens: tokenize(coffee)))
#
