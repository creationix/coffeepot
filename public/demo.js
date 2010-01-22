(function(){
  var compile, onChange, output, setOutput, source, timer;
  source = null;
  output = null;
  setOutput = function setOutput(js) {
    // Remove the contents
    while (output.firstChild) {
      output.removeChild(output.firstChild);
    }
    // put in new contents
    return output.appendChild(document.createTextNode(js));
  };
  // Called
  compile = function compile() {
    var code, js;
    code = source.value;
    try {
      js = CoffeePot.compile(code);
      return setOutput(js);
    } catch (e) {
      setOutput(e.stack);
      throw e;
    }
  };
  // Recompile after 500ms of idle time after any activity.
  timer = null;
  onChange = function onChange(e) {
    if (timer) {
      clearTimeout(timer);
    }
    return timer = setTimeout(compile, 1000);
  };
  // Wait for the dom to be built before moving on.
  this.onload = function onload() {
    var sample;
    // Store references to our textareas.
    source = document.getElementById("source");
    output = document.getElementById("output");
    // Load the sample code out of the script tag in the head.
    sample = document.getElementById("sample").innerHTML;
    sample = sample.substr(1, sample.length);
    // Fill in the box with the input and call compile
    source.value = sample;
    compile();
    // Bind onkeyup and onchange in the text field
    source.addEventListener('keyup', onChange, false);
    return source.addEventListener('change', onChange, false);
  };
})();
