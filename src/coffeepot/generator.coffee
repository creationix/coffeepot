root: exports ? this
CoffeePot: (root.CoffeePot ?= {})

Generators: {

  Block: contents =>
    self: this
    self.vars: {}
    content: contents.map() statement =>
      self(statement) + ";\n"
    names: for name, exists of self.vars
      name
    if names.length > 0
      "var " + names.join(", ") + ";\n" + content
    else
      content

  Assign: id, exp =>
    if id[0] == "ID"
      this.vars[id[1]] = true
    this(id) + " = " + this(exp)

  Binop: op, exp1, exp2 =>
    first: this(exp1)
    second: this(exp2)
    content: if op == "?"
      '(typeof ' + first + ' !== "undefined" && ' + first + ' !== null)' +
      ' ? ' + first + ' : ' + second
    else
      first + " " + op + " " + second
    "(" + content + ")"
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