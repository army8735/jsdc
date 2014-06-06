gulp:
	@gulp

test: gulp test-jsdc

test-jsdc:
	@mocha tests/

coveralls:
	@mocha tests/ --require blanket --reporter mocha-lcov-reporter | ./node_modules/coveralls/bin/coveralls.js

test-cov:
	@mocha tests/ --require blanket -R html-cov > tests/covrage.html