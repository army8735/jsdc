gulp:
	@gulp

test: gulp test-jsdc

test-jsdc:
	@mocha tests/test.js -R spec

coveralls:
	@mocha tests/test.js --require blanket --reporter mocha-lcov-reporter | ./node_modules/coveralls/bin/coveralls.js

test-cov:
	@mocha tests/test.js --require blanket -R html-cov > tests/covrage.html