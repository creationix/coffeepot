root: exports ? this
CoffeePot: (root.CoffeePot ?= {})
block_vars: []

Generators: {

  Root: block =>
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
      " return " + this(content) + "; "
    "function " + name + "(" + (arg[1] for arg in args).join(", ") + ") {" + content + "}"

  COMMENT: content => "//" + content
  STRING: content => JSON.stringify(content)

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

  Call: target, message, args =>
    self: this
    args: args.map() arg => self(arg)
    call: this(message) + "(" + args.join(", ") + ")"
    if target
      this(target) + "." + call
    else
      call

  ExpressionList: items =>
    self: this
    (self(item) for item in items).join(", ")


  Compound: parts =>
    self: this
    (this(part) for part in parts).join("")

  Binop: op, exp1, exp2 =>
    first: this(exp1)
    second: this(exp2)
    content: if op == "?"
      '(typeof ' + first + ' !== "undefined" && ' + first + ' !== null)' +
      ' ? ' + first + ' : ' + second
    else
      first + " " + op + " " + second

  Property: source, id =>
    this(source) + "." + this(id)

  Array: items =>
    self: this
    "[" + (self(item) for item in items).join(", ") + "]"

  Object: items =>
    self: this
    pairs: (self(item[0]) + ": " + self(item[1])) for item in items
    "{\n  " + pairs.join(",\n  ") + "\n}"
}


render: node =>
  return "" unless node
  [name, args...] = node
  if Generators[name]
    Generators[name].apply(render, args)
  else if (typeof name == "string" and name.match(/^[A-Z]+$/))
    args[0]
  else
    JSON.stringify(node)


CoffeePot.generate = render