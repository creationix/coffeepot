# Read the script from the current file
File: require('file')
process.mixin(require('sys'))

# Remember that regular expressions are really functions, so for the special
# cases where regular expressions aren't powerful enough, we can use a custom # function.
Tokens: {
  NEWLINE: /^(\n)/
  WS: /^([ \t]+)/
  COMMENT: /^(#.*)\n/
  IDENTIFIER: /^([a-z_][a-z0-9_]*)/i
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

tokenize: source =>
  length: source.length
  pos: 0
  while pos < length
    [type, match, consume] = match_token(source.substr(pos, length))
    tokens.push([type, match])
    pos += match.length
  tokens

File.read('../test/sample.coffee').addCallback() coffee =>
  # puts("\nCoffeeScript\n")
  # puts(coffee)
  puts("\nTokens\n")
  puts(inspect(tokenize(coffee)))

