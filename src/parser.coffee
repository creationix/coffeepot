
parse: tokens =>
  pos: 0
  done: false
  tree: []

  end: =>
    if (node: tokens[pos][0]) == "END"
      done: true
      node

  comment: =>
    if tokens[pos][0] == "COMMENT"
      node: tokens[pos]
      pos++
      if tokens[pos][0] == "NEWLINE"
        pos++
      node

  statement: =>
    if (exp: expression())
      if newline()
        ["STATEMENT", exp]

  expression: =>
    post_if() ||
    assignment() ||
    number() ||
    boolean()

  post_if: =>
    old_pos: pos
    if (exp: expression())
      if tokens[pos][0] == "KEYWORD" && tokens[pos][1] == "if"
        pos++
        if exp2: expression()
          ["POST_IF", exp, exp2]
    pos: old_pos
    null


  boolean: =>
    node: tokens[pos]
    if node[0] == "KEYWORD"
      if node[1] == "true" or node[1] == "false"
        pos++
        ["BOOLEAN", node[1]]

  number: =>
    if tokens[pos][0] == "NUMBER"
      node: tokens[pos]
      pos++
      node

  newline: =>
    if tokens[pos][0] == "NEWLINE"
      node: tokens[pos]
      pos++
      node

  assignment: =>
    if tokens[pos][0] == "ID"
      variable: tokens[pos]
      pos += 1
      if tokens[pos][0] == "COLON"
        pos += 1
        if (exp: expression())
          ["ASSIGNMENT", [variable, exp]]

  while not done
    next: comment() || statement() || end()
    if next
      tree.push(next)
    else
      debug(inspect(tree))
      throw new Error("Parse Error: " + tokens[pos])
  tree



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

