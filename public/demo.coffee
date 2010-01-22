# Wait for the dom to be built before moving on.
this.onload: =>

  # Store references to our textareas.
  source: document.getElementById("source")
  output: document.getElementById("output")

  # Load the sample code out of the script tag in the head.
  sample: document.getElementById("sample").innerHTML
  sample = sample.substr(1, sample.length)

  # Called
  compile: =>
    code: source.value
    tokens: CoffeePot.tokenize(code)
    console.log(tokens)
    js: CoffeePot.compile(code)
    output.value = js

  # Fill in the box with the input and call compile
  source.value = sample
  compile()





