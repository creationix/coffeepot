root: exports ? this
CoffeePot: (root.CoffeePot ?= {})

Generators: {

  Block: contents =>
    self: this
    self.vars: {}
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
    names: for name, exists of self.vars
      name
    content = content.join("\n")
    if names.length > 0
      "var " + names.join(", ") + ";\n" + content
    else
      content

  # ["Function",[["ID","x"]],["Binop",["OPERATOR","*"],["ID","x"],["ID","x"]]];
  Function: args, expression, name =>
    name ?= ""
    "function " + name + "(" + (arg[1] for arg in args).join(", ") + ") { " + this(expression) + "; }"

  COMMENT: content => "//" + content

  If: condition, exp1, exp2 =>
    "if (" + this(condition) + ") { " + this(exp1) + "; }"

  Assign: id, exp =>
    if id[0] == "ID"
      name: id[1]
      if exp[0] == "Function"
        exp[3] = name
      this.vars[name] = true
    this(id) + " = " + this(exp)


  Binop: op, exp1, exp2 =>
    first: this(exp1)
    second: this(exp2)
    content: if op[1] == "?"
      '(typeof ' + first + ' !== "undefined" && ' + first + ' !== null)' +
      ' ? ' + first + ' : ' + second
    else
      first + " " + op[1] + " " + second

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