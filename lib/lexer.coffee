CoffeeScript: {}

CoffeeScript: exports if exports

# The lexer reads a stream of CoffeeScript and divvys it up into tagged
# tokens. A minor bit of the ambiguity in the grammar has been avoided by
# pushing some extra smarts into the Lexer.

# The list of keywords passed verbatim to the parser.
CoffeeScript.Lexer: =>
  KEYWORDS: [
    "if", "else", "then", "unless"
    "true", "false", "yes", "no", "on", "off"
    "and", "or", "is", "isnt", "not"
    "new", "return"
    "try", "catch", "finally", "throw"
    "break", "continue"
    "for", "in", "by", "where", "while"
    "switch", "when"
    "super", "extends"
    "arguments"
    "delete", "instanceof", "typeof"
  ]

# TODO:   looking through them quickly, I think the only difference with JS is \A\Z vs ^$, and the \m directive in Ruby

  # Token matching regexes.
  IDENTIFIER: /^([a-zA-Z$_]\w*)/
  NUMBER:     /^(\b((0(x|X)[0-9a-fA-F]+)|([0-9]+(\.[0-9]+)?(e[+\-]?[0-9]+)?)))\b/i
  STRING:     /^(""|''|"(.*?)[^\\]"|'(.*?)[^\\]')/m
  JS:         /^(``|`(.*?)[^\\]`)/m
  OPERATOR:   /^([+\*&|\/\-%=<>:!]+)/
  WHITESPACE: /^([ \t]+)/
  COMMENT:    /^(((\n?[ \t]*)?#.*$)+)/
  CODE:       /^(=>)/
  REGEX:      /^(\/(.*?)[^\\]\/[imgy]{0,4})/
  MULTI_DENT: /^((\n([ \t]*)?)+)/
  LAST_DENT:  /\n([ \t]*)/g
  ASSIGNMENT: /^(:|=)$/

  # Token cleaning regexes.
  JS_CLEANER: /(\A`|`\Z)/
  MULTILINER: /\n/g
  COMMENT_CLEANER: /(^\s*#|\n\s*$)/g
  NO_NEWLINE: /\A([+\*&|\/\-%=<>:!.\\][<>=&|]*|and|or|is|isnt|not|delete|typeof|instanceof)\Z/

  # Tokens which a regular expression will never immediately follow, but which
  # a division operator might.
  # See: http://www.mozilla.org/js/language/js20-2002-04/rationale/syntax.html#regular-expressions
  NOT_REGEX: [
    "IDENTIFIER", "NUMBER", "REGEX", "STRING"
    ')', '++', '--', ']', '}'
    "FALSE", "NULL", "THIS", "TRUE"
  ]

  # Scan by attempting to match tokens one character at a time. Slow and steady.
  this.tokenize: code =>

    this.code: code.trim() # Cleanup code by remove extra line breaks
    this.i: 0              # Current character position we're parsing
    this.line: 1           # The current line.
    this.indent: 0         # The current indent level.
    this.indents: []       # The stack of all indent levels we are currently within.
    this.tokens: []        # Collection of all parsed tokens in the form [:TOKEN_TYPE, value]
    while this.i < this.code.length
      this.chunk: this.code.substr(this.i, 1)
      this.extract_next_token()

    # TODO: translate this somehow
    # puts "original stream: #{@tokens.inspect}" if ENV['VERBOSE']

    this.close_indentation()
    (new Rewriter()).rewrite(this.tokens)


  # At every position, run through this list of attempted matches,
  # short-circuiting if any of them succeed.
  this.extract_next_token: =>
    this.identifier_token() or
    this.number_token() or
    this.string_token() or
    this.js_token() or
    this.regex_token() or
    this.indent_token() or
    this.comment_token() or
    this.whitespace_token() or
    this.literal_token()


  # Tokenizers ==========================================================

  # Matches identifying literals: variables, keywords, method names, etc.
  this.identifier_token: =>
    return false unless identifier: this.match_token(IDENTIFIER)
    # Keywords are special identifiers tagged with their own name,
    # 'if' will result in an [:IF, "if"] token.
    tag: if KEYWORDS.indexOf(identifier) >= 0 then identifier.toUpperCase() else "IDENTIFIER"
    tag: "LEADING_WHEN" if tag == "WHEN" and ["OUTDENT", "INDENT", "\n"].indexOf(last_tag) >= 0
    this.tokens[-1][0]: "PROPERTY_ACCESS" if tag == "IDENTIFIER" and this.last_value() == '.' and !(this.tokens[-2][1] == '.')
    this.token(tag, identifier)
    this.i += identifier.length

  # Matches numbers, including decimals, hex, and exponential notation.
  this.number_token: =>
   return false unless number: this.match_token(IDENTIFIER)
   this.token("NUMBER", number)
   this.i += number.length

  # Matches strings, including multi-line strings.
  this.string_token: =>
    return false unless string: this.match_token(STRING)
    escaped: string.replace(MULTILINER) match =>
      this.line += 1
      " \\\n"
    this.token("STRING", escaped)
    this.i += string.length

  # Matches interpolated JavaScript.
  this.js_token: =>
    return false unless script: this.match_token(JS)
    this.token("JS", script.replace(JS_CLEANER, ''))
    this.i += script.length

  # Matches regular expression literals.
  this.regex_token: =>
    return false unless regex: this.match_token(REGEX)
    return false if NOT_REGEX.indexOf(last_tag) >= 0
    this.token("REGEX", regex)
    this.i += regex.length


  # Matches and consumes comments.
  this.comment_token: =>
    return false unless comment: this.match_token(COMMENT)
    this.line += if (match: comment.match(MULTILINER)) then match.length else 0
    this.token("COMMENT", comment.replace(COMMENT_CLEANER, '').split(MULTILINER))
    this.token("\n", "\n")
    this.i += comment.length

  # Record tokens for indentation differing from the previous line.
  this.indent_token: =>
    return false unless indent: this.match_token(MULTI_DENT)
    this.line += indent.match(MULTILINER).length
    this.i += indent.length
    return suppress_newlines(indent) if this.last_value().match(NO_NEWLINE) and this.last_value() != "=>"
    size: indent.match(LAST_DENT).pop().pop().length
    return newline_token(indent) if size == this.indent
    if size > this.indent
      this.token("INDENT", size - this.indent)
      this.indents.push(size - this.indent)
    else
      outdent_token(this.indent - size)
    this.indent = size

  # Record an oudent token or tokens, if we're moving back inwards past
  # multiple recorded indents.
  this.outdent_token: move_out =>
    while move_out > 0 and this.indents.length > 0
      last_indent: this.indents.pop()
      this.token("OUTDENT", this.last_indent())
      move_out -= this.last_indent()
    this.token("\n", "\n")

  # Matches and consumes non-meaningful whitespace.
  this.whitespace_token: =>
    return false unless whitespace: this.match_token(WHITESPACE)
    this.i += whitespace.length

  # Multiple newlines get merged together.
  # Use a trailing \ to escape newlines.
  this.newline_token: newlines =>
    this.token("\n", "\n") unless this.last_value() == "\n"
    true

  # Tokens to explicitly escape newlines are removed once their job is done.
  this.suppress_newlines: newlines =>
    this.tokens.pop() if this.last_value() == "\\"
    true

  # We treat all other single characters as a token. Eg.: ( ) , . !
  # Multi-character operators are also literal tokens, so that Racc can assign
  # the proper order of operations.
  this.literal_token: =>
    value: this.match_token(OPERATOR)
    this.tag_parameters() if value and value.match(CODE)
    value ||= this.chunk[0]
    tag: (if value.match(ASSIGNMENT) then "ASSIGN" else value)
    this.token(tag, value)
    this.i += value.length


  # Helpers ==========================================================

  # Returns the first match or null if not matched
  this.match_token: regex =>
    (match: regex(this.chunk)) and match[1]

  # Add a token to the results, taking note of the line number, and
  # immediately-preceding comment.
  this.token: tag, value =>
    this.tokens.push([tag, new Value(value, this.line)])

  # Peek at the previous token's value.
  this.last_value: =>
    (last: this.tokens[this.tokens.length - 1]) and last[1]

  # Peek at the previous token's tag.
  this.last_tag: =>
    (last: this.tokens[this.tokens.length - 1]) and last[0]

  # A source of ambiguity in our grammar was parameter lists in function
  # definitions (as opposed to argument lists in function calls). Tag
  # parameter identifiers in order to avoid this. Also, parameter lists can
  # make use of splats.
  this.tag_parameters: =>
    i: 0
    while true
      i -= 1
      tok: this.tokens[i]
      return if !tok
      next if ['.', ','].indexOf(tok[0]) >= 0
      return if tok[0] != "IDENTIFIER"
      tok[0]: "PARAM"


  # Close up all remaining open blocks. IF the first token is an indent,
  # axe it.
  this.close_indentation: =>
    this.outdent_token(this.indent)

Value: value, length =>
  this.match: =>
    puts("TODO: Implement")


# Read the script from the current file
File: require('file')
process.mixin(require('sys'))

File.read('../test/sample.coffee').addCallback() coffee =>
  lexer: new CoffeeScript.Lexer()
  # puts("\nCoffeeScript\n")
  # puts(coffee)
  puts("\nTokens\n")
  puts(inspect(lexer.tokenize(coffee)))
