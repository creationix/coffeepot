(function(){

  // Wait for the dom to be built before moving on.
  this.onload = function onload() {
    var compile, onChange, output, sample, source, timer;
    // Store references to our textareas.
    source = document.getElementById("source");
    output = document.getElementById("output");
    // Load the sample code out of the script tag in the head.
    sample = document.getElementById("sample").innerHTML;
    sample = sample.substr(1, sample.length);
    // Called
    compile = function compile() {
      var code, js;
      code = source.value;
      try {
        js = CoffeePot.compile(code);
        return (output.innerText = js);
      } catch (e) {
        return (output.innerText = e.stack);
      }
    };
    // Fill in the box with the input and call compile
    source.value = sample;
    compile();
    // Recompile after 500ms of idle time after any activity.
    timer = null;
    onChange = function onChange(e) {
      console.log("Change");
      if (timer) {
        clearTimeout(timer);
      }
      return timer = setTimeout(compile, 1000);
    };
    // Bind onkeyup and onchange in the text field
    source.addEventListener('keyup', onChange);
    return source.addEventListener('change', onChange);
  };
})();
