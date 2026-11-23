.PHONY: help install install-backend install-frontend dev-frontend dev-backend lint format test test-backend test-frontend clean docker-up docker-down docker-build

help:
	@echo "OpenSourceMate Development Commands:"
	@echo "  make install        Install backend and frontend dependencies"
	@echo "  make dev-frontend   Start Next.js frontend development server"
	@echo "  make dev-backend    Start FastAPI backend development server"
	@echo "  make docker-up      Start all services with docker compose"
	@echo "  make docker-down    Stop all docker compose services"
	@echo "  make docker-build   Build or rebuild docker compose images"
	@echo "  make lint           Run backend (ruff) and frontend (eslint) linters"
	@echo "  make format         Run backend (ruff) and frontend (prettier) formatters"
	@echo "  make test           Run both backend and frontend test suites"
	@echo "  make test-backend   Run pytest test suite"
	@echo "  make test-frontend  Run Jest frontend tests"
	@echo "  make clean          Clean temporary build and cache files"

install: install-backend install-frontend

install-backend:
	cd backend && pip install -r requirements.txt -r requirements-dev.txt

install-frontend:
	cd frontend && npm install

dev-frontend:
	cd frontend && npm run dev

dev-backend:
	cd backend && uvicorn app.main:app --reload --port 8000

docker-up:
	docker compose up

docker-down:
	docker compose down

docker-build:
	docker compose build

lint:
	ruff check backend
	cd frontend && npm run lint

format:
	ruff format backend
	cd frontend && npm run format

test: test-backend test-frontend

test-backend:
	cd backend && pytest

test-frontend:
	cd frontend && npm test

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	find . -type d -name ".next" -exec rm -rf {} +
