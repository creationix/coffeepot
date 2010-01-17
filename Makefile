all: folder single compressed

folder:
	coffee src/coffeepot.coffee -o lib
	coffee src/coffeepot/*.coffee -o lib/coffeepot

single:
	coffee src/coffeepot/helper.coffee -p > build/coffeepot.js
	coffee src/coffeepot/lexer.coffee -p >> build/coffeepot.js
	coffee src/coffeepot/grammar.coffee -p >> build/coffeepot.js
	coffee src/coffeepot/parser.coffee -p >> build/coffeepot.js
	coffee src/coffeepot/generator.coffee -p >> build/coffeepot.js
	coffee src/coffeepot.coffee -p >> build/coffeepot.js

compressed: single
	java -jar goodies/compiler.jar --js build/coffeepot.js --js_output_file build/coffeepot-min.js

clean:
	find . -name "*.js" | xargs rm
