exports ? this
public: exports ? this
public.onload: =>
  tags: document.getElementsByTagName("script")
  for tag in tags when tag.type == "text/coffeescript"
    code: CoffeePot.Helper.block_trim(tag.innerText)
    console.log(code)
    tokens: CoffeePot.tokenize(code)
    console.log(tokens)
    tree: CoffeePot.parse(tokens)
    console.log(tree)
    js: CoffeePot.generate(tree)
    console.log(js)
