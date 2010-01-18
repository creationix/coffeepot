all: folder single
folder:
	coffee src/coffeepot.coffee -o lib
	coffee src/coffeepot/*.coffee -o lib/coffeepot

test_code:
	coffee test/*.coffee -o test

test: test_code
	cd test && node test_node.js | less

single: folder
	echo "\n// coffeepot/helper.coffee" > build/coffeepot.js
	cat lib/coffeepot/helper.js >> build/coffeepot.js
	echo "\n// coffeepot/lexer.coffee" >> build/coffeepot.js
	cat lib/coffeepot/lexer.js >> build/coffeepot.js
	echo "\n// coffeepot/grammar.coffee" >> build/coffeepot.js
	cat lib/coffeepot/grammar.js >> build/coffeepot.js
	echo "\n// coffeepot/parser.coffee" >> build/coffeepot.js
	cat lib/coffeepot/parser.js >> build/coffeepot.js
	echo "\n// coffeepot/generator.coffee" >> build/coffeepot.js
	cat lib/coffeepot/generator.js >> build/coffeepot.js
	echo "\n// coffeepot.coffee" >> build/coffeepot.js
	cat lib/coffeepot.js >> build/coffeepot.js

compressed: single

	java -jar goodies/compiler.jar --compilation_level ADVANCED_OPTIMIZATIONS --js build/coffeepot.js --js_output_file build/coffeepot-min.js

clean:
	find . -name "*.js" | xargs rm
	find . -name ".DS_Store" | xargs rm
