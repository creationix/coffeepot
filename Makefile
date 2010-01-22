all: folder single
folder:
	coffee src/coffeepot.coffee -o lib
	coffee src/coffeepot/*.coffee -o lib/coffeepot

test_code:
	coffee test/*.coffee -o test

test: test_code
	cd test && node test_node.js | less

single: folder
	echo "\n// coffeepot/helper.coffee" > public/coffeepot.js
	cat lib/coffeepot/helper.js >> public/coffeepot.js
	echo "\n// coffeepot/lexer.coffee" >> public/coffeepot.js
	cat lib/coffeepot/lexer.js >> public/coffeepot.js
	echo "\n// coffeepot/grammar.coffee" >> public/coffeepot.js
	cat lib/coffeepot/grammar.js >> public/coffeepot.js
	echo "\n// coffeepot/parser.coffee" >> public/coffeepot.js
	cat lib/coffeepot/parser.js >> public/coffeepot.js
	echo "\n// coffeepot/generator.coffee" >> public/coffeepot.js
	cat lib/coffeepot/generator.js >> public/coffeepot.js
	echo "\n// coffeepot.coffee" >> public/coffeepot.js
	cat lib/coffeepot.js >> public/coffeepot.js

compressed: single
	# Requires google closure compiler in the parent directory
	java -jar ../compiler.jar --js public/coffeepot.js --js_output_file public/coffeepot-min.js

clean:
	find lib -name "*.js" | xargs rm
	find . -name ".DS_Store" | xargs rm
