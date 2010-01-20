root: exports ? this
CoffeePot: (root.CoffeePot ?= {})
CoffeePot.tokenize ?= require('coffeepot/lexer').CoffeePot.tokenize
CoffeePot.parse ?= require('coffeepot/parser').CoffeePot.parse
block_vars: []

sub_compile: expr =>
  tokens: CoffeePot.tokenize(expr)
  tree: CoffeePot.parse(tokens, "Expression")
  render(tree)

Generators: {

  Start: block =>
    "(function () {" + this(block) + "}());"

  Not: expr =>
    "!(" + this(expr) + ")"

  Block: contents =>
    self: this
    block_vars.push({})
    last_comment: false
    content: contents.map() statement =>
      type: statement[0]
      content: self(statement)

      content: switch type
        when "COMMENT"
          (if last_comment then "" else "\n") + content
        when "If"
          content
        else
          content + ";"
      last_comment: type == "COMMENT"
      content
    content: content.join("\n")
    names: name for name, exists of block_vars.pop()
    if names.length > 0
      content: "var " + names.join(", ") + ";\n" + content
    content: "\n" + (("  " + line) for line in content.split("\n")).join("\n") + "\n"
    content


  # ["Function",[["ID","x"]],["Binop",["OPERATOR","*"],["ID","x"],["ID","x"]]];
  Function: args, content, name =>
    name ?= ""
    content: if content[0] == "Block"
      this(content)
    else
      " " + this(content) + "; "
    "function " + name + "(" + (arg[1] for arg in args).join(", ") + ") {" + content + "}"

  COMMENT: content => "//" + content
  STRING: content =>
    if content.match(/[^\\]?#{.*[^\\]}/)
      output: []
      pos: 0
      len: content.length
      while pos < len

        # Grab plain text chunks
        start: pos
        pos: content.substr(pos, len).indexOf("#{")
        console.log(pos)
        if pos < 0
          pos = len
          output.push(JSON.stringify(content.substr(start, len - start)))
          continue
        pos += start
        output.push(JSON.stringify(content.substr(start, pos - start)))

        pos += 2
        start: pos
        level: 1
        quote: false
        done: false
        while not done and pos < len
          char: content.substr(pos, 1)
          pos++
          if char == "\\"
            pos++
            continue
          if quote
            quote = false if char == quote
            continue
          if char == "{"
            level++
          else if char == "}"
            level--
            done = true if level == 0
          else if char == "\"" or char == "'"
            quote: char
        code: content.substr(start, pos - start - 1)
        output.push(sub_compile(code))

      output.join(" + ")
    else
      JSON.stringify(content)

  If: condition, exp1, exp2 =>
    "if (" + this(condition) + ") { " + this(exp1) + "; }"

  Assign: id, exp =>
    if id[0] == "ID"
      name: id[1]
      if exp[0] == "Function"
        exp[3] = name
      block_vars[block_vars.length - 1][name] = true
    this(id) + " = " + this(exp)

  Source: parts =>
    (part[1] for part in parts).join("")

  Call: method, args =>
    this(method) + "(" + this(args) + ")"

  ExpressionList: items =>
    self: this
    (self(item) for item in items).join(", ")


  Compound: parts =>
    self: this
    (this(part) for part in parts).join("")

  Binop: op, exp1, exp2 =>
    first: this(exp1)
    second: this(exp2)
    content: if op[1] == "?"
      '(typeof ' + first + ' !== "undefined" && ' + first + ' !== null)' +
      ' ? ' + first + ' : ' + second
    else
      "(" + first + " " + op[1] + " " + second + ")"

  Array: items =>
    self: this
    "[" + (self(item) for item in items).join(", ") + "]"

  Object: items =>
    self: this
    pairs: (item[0] + ": " + self(item[1])) for item in items
    "{\n\t" + pairs.join(",\n\t") + "\n}"
}


render: node =>
  return "" unless node
  [name, args...] = node
  if Generators[name]
    Generators[name].apply(render, args)
  else if (name.match(/^[A-Z]+$/))
    args[0]
  else
    JSON.stringify(node)


CoffeePot.generate = render