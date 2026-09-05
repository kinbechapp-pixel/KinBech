.PHONY: run dev install stop start-mongodb stop-mongodb

run: start-mongodb
	@echo "🚀 Starting Admin and Backend..."
	@cd Backend && npm run dev &
	@cd Admin && npm run dev &
	@echo "✅ Admin: http://localhost:5173"
	@echo "✅ Backend: http://localhost:5001"
	@echo "Press Ctrl+C to stop both servers"

dev: run

install:
	@echo "📦 Installing dependencies..."
	@cd Backend && npm install
	@cd Admin && npm install
	@cd Mobile && npm install

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

stop:
	@echo "Stopping Admin and Backend..."
	@pkill -f "vite"
	@pkill -f "nodemon"
	@echo "Servers stopped"
