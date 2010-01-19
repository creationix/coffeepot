public: exports ? this
public.onload: =>
  tags: document.getElementsByTagName("script")
  for tag in tags when tag.type == "text/coffeescript"
    code: CoffeePot.Helper.block_trim(tag.innerText)
    js: CoffeePot.compile(code)
    scriptTag: document.createElement("script")
    scriptTag.setAttribute("type", "text/javascript")
    scriptTag.innerHTML = js
    head: document.getElementsByTagName("head")[0]
    head.appendChild(scriptTag)


