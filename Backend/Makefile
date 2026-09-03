.PHONY: run dev install test start-mongodb stop-mongodb

run: start-mongodb
	npm run dev

start-mongodb:
	@echo "Starting MongoDB..."
	@if ! lsof -i :27017 > /dev/null 2>&1; then \
		mongod --config /opt/homebrew/etc/mongod.conf --fork --logpath /tmp/mongodb.log > /dev/null 2>&1; \
		echo "MongoDB started on port 27017"; \
	else \
		echo "MongoDB already running on port 27017"; \
	fi

stop-mongodb:
	@echo "Stopping MongoDB..."
	@if lsof -i :27017 > /dev/null 2>&1; then \
		pkill -f mongod; \
		echo "MongoDB stopped"; \
	else \
		echo "MongoDB not running"; \
	fi

dev:
	npm run dev

install:
	npm install

test:
	npm test
