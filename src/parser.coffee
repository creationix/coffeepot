parse: tokens =>
  pos: 0
  old: pos

  # Shortcut to eat the next token
  eat: =>
    pos++
    tokens[pos - 1]

  # Shortcut for the type of the next token
  next_type: =>
    tokens[pos][0]

  # Shortcut for the value of the next token
  next_value: =>
    tokens[pos][1]

  # Shortcut for [](){}
  grouping: value =>
    if next_type() == "GROUPING" and next_value() == value
      eat()

  keyword: value =>
    if next_type() == "KEYWORD" and next_value() == value
      eat()

  same: type =>
    if next_type() == type
      eat()

  newline: =>
    same("NEWLINE")

  fail: =>
    pos: old
    null

  #############################################

  expression: =>
    old: pos
    if (e: same("NUMBER") || same("BOOLEAN") || assignment() || same("ID"))
      return ["EXPRESSION", e]
    fail()

  post_if: =>
    old: pos
    if (e: expression()) and keyword("if") and (c: expression())
      return ["POST_IF", e, c]
    fail()

  assignment: =>
    old: pos
    if (v: same("ID")) and same("COLON") and (e: expression())
      return ["ASSIGNMENT", [v, e]]
    fail()

  statement: =>
    old: pos
    if (s: post_if() || expression()) && newline()
      return ["STATEMENT", s]
    fail()

  block: =>
    old: pos
    code: []
    while (s: statement() or same("COMMENT") or newline())
      if (s[0] != "NEWLINE")
        debug(inspect(s))
        code.push(s)
    if code.length > 0
      return ["BLOCK", code]
    fail()

  debug(inspect(block()))
  debug(inspect(tokens[pos]))

# Read the script from the current file
File: require('file')
process.mixin(require('sys'))
lexer: require('coffeepot/lexer')
File.read('../test/parse.coffee').addCallback() coffee =>
  tokens: lexer.tokenize(coffee)
  puts("\nTokens\n")
  puts(inspect(tokens))
  tree: parse(tokens)
  puts("\nTree\n")
  puts(inspect(tree))

