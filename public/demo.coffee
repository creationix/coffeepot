source: null
output: null

setOutput: js =>
  # Remove the contents
  while output.firstChild
    output.removeChild(output.firstChild)

  # put in new contents
  output.appendChild(document.createTextNode(js))

# Called
compile: =>
  code: source.value
  try
    js: CoffeePot.compile(code)
    setOutput(js)
  catch e
    setOutput(e.stack)
    throw e


# Recompile after 500ms of idle time after any activity.
timer: null
onChange: e =>
  clearTimeout(timer) if timer
  timer: setTimeout(compile, 1000)

# Wait for the dom to be built before moving on.
this.onload: =>

  # Store references to our textareas.
  source: document.getElementById("source")
  output: document.getElementById("output")

  # Load the sample code out of the script tag in the head.
  sample: document.getElementById("sample").innerHTML
  sample = sample.substr(1, sample.length)

  # Fill in the box with the input and call compile
  source.value = sample
  compile()

  # Bind onkeyup and onchange in the text field
  source.addEventListener('keyup', onChange, false)
  source.addEventListener('change', onChange, false)
