all: folder single
folder:
	coffee src/coffeepot.coffee -o lib
	coffee src/coffeepot/*.coffee -o lib/coffeepot
	node build.js

single: folder
	echo "// coffeepot/lexer.coffee\n" > public/coffeepot.js
	cat lib/coffeepot/lexer.js >> public/coffeepot.js
	echo "// coffeepot/parser.coffee\n" >> public/coffeepot.js
	cat lib/coffeepot/parser.js >> public/coffeepot.js
	echo "// coffeepot/generator.coffee\n" >> public/coffeepot.js
	cat lib/coffeepot/generator.js >> public/coffeepot.js
	echo "// coffeepot.coffee\n" >> public/coffeepot.js
	cat lib/coffeepot.js >> public/coffeepot.js

test_code:
	coffee test/*.coffee -o test

test: test_code
	cd test && node test_node.js | less

clean:
	find lib -name "*.js" | xargs rm
	find public -name "*.js" | xargs rm
	find . -name ".DS_Store" | xargs rm
