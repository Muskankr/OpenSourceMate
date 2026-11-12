# Tutorial: Adding a Backend Endpoint

This tutorial explains how to add a REST API endpoint to OpenSourceMate using FastAPI, Pydantic serializers, and pytest.

The example adds a simple endpoint to the existing Issues router. It demonstrates route definition, response validation, router registration, and API testing.

## 1. Prerequisites

Before starting, make sure you have:

- Python installed.
- The OpenSourceMate repository cloned locally.
- Backend dependencies installed.
- Basic knowledge of Python, FastAPI, and Pydantic.

Navigate to the backend directory:

```bash
cd backend
```

Install the dependencies using the repository's documented setup instructions.

## 2. Understand the Backend Structure

The backend uses FastAPI and organizes its code into routes, schemas, services, and tests.

Relevant files:

```text
backend/
├── app/
│   ├── api/
│   │   └── routes/
│   │       ├── issues.py
│   │       ├── github.py
│   │       ├── matching.py
│   │       └── ai.py
│   ├── schemas/
│   │   └── serializers.py
│   ├── services/
│   └── main.py
└── tests/
    ├── conftest.py
    └── test_api.py
```

Responsibilities:

| File or directory            | Purpose                                                           |
| ---------------------------- | ----------------------------------------------------------------- |
| `app/api/routes/`            | Defines API endpoints using FastAPI routers.                      |
| `app/schemas/serializers.py` | Defines Pydantic request and response models.                     |
| `app/services/`              | Contains reusable business logic and external service operations. |
| `app/main.py`                | Creates the FastAPI application and registers routers.            |
| `tests/`                     | Contains automated backend tests.                                 |

## 3. Understand an Existing Endpoint

Open:

`backend/app/api/routes/issues.py`

The existing issue search endpoint follows this structure:

```python
@router.get(
    "/search",
    response_model=IssueSearchResponseSerializer,
    summary="Search good first issues on GitHub",
)
async def search_issues(
    language: str | None = Query(default=None),
    label: str | None = Query(default=None),
    keyword: str | None = Query(default=None),
    per_page: int = Query(default=20, ge=1, le=100),
):
    ...
```

Important concepts:

- `@router.get()` defines a GET endpoint.
- `response_model` specifies the expected response structure.
- `Query()` defines and validates query parameters.
- The endpoint can call a service function to perform its business logic.

Follow existing conventions when implementing a new endpoint.

## 4. Define a Response Serializer

Open:

`backend/app/schemas/serializers.py`

OpenSourceMate uses Pydantic's `BaseModel` and `Field` to define response structures.

For this example, add the following model:

```python
class TutorialExampleResponseSerializer(BaseModel):
    message: str = Field(
        ...,
        description="Example response message",
    )
```

Place it in an appropriate section of the serializers file.

A response serializer helps FastAPI validate and document the endpoint's output.

## 5. Implement the Endpoint

Open:

`backend/app/api/routes/issues.py`

The file already defines an `APIRouter`:

```python
router = APIRouter(
    prefix="/issues",
    tags=["Issues"],
)
```

Add the following imports:

```python
from app.schemas.serializers import TutorialExampleResponseSerializer
```

Then add this example endpoint:

```python
@router.get(
    "/tutorial-example",
    response_model=TutorialExampleResponseSerializer,
    summary="Example tutorial endpoint",
)
async def tutorial_example(
    name: str = Query(default="Developer", min_length=1, max_length=50),
):
    return {
        "message": f"Hello, {name}!",
    }
```

The endpoint demonstrates:

- A GET route.
- Query parameter validation.
- A Pydantic response model.
- A structured JSON response.

Because this endpoint is added to the existing Issues router, its URL is generated using the router prefix and the application prefix.

## 6. Understand Router Registration

Open:

`backend/app/main.py`

The application imports the existing router:

```python
from app.api.routes.issues import router as issues_router
```

It registers the router under two API prefixes:

```python
app.include_router(
    issues_router,
    prefix="/api/v1",
    include_in_schema=True,
)

app.include_router(
    issues_router,
    prefix="/api",
    include_in_schema=False,
)
```

This provides:

- Versioned endpoint: `/api/v1/issues/tutorial-example`
- Legacy-compatible endpoint: `/api/issues/tutorial-example`

**Important:** If you add an endpoint to an already registered router, you do not need to register that router again.

If you create an entirely new router, you must import and register it in `main.py` under both prefixes when appropriate.

## 7. Test the Endpoint

Open:

`backend/tests/test_api.py`

The existing tests use an asynchronous HTTP client with FastAPI's ASGI transport.

The test fixture is already defined in that file:

```python
@pytest.fixture
async def api():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(
        transport=transport,
        base_url="http://test",
    ) as client:
        yield client
```

Add the following test to the same test file:

```python
async def test_tutorial_example_endpoint(api):
    response = await api.get(
        "/api/v1/issues/tutorial-example",
        params={"name": "OpenSourceMate"},
    )

    assert response.status_code == 200
    assert response.json() == {
        "message": "Hello, OpenSourceMate!",
    }
```

You can also test query parameter validation:

```python
async def test_tutorial_example_rejects_empty_name(api):
    response = await api.get(
        "/api/v1/issues/tutorial-example",
        params={"name": ""},
    )

    assert response.status_code == 422
```

The second test verifies that FastAPI rejects an empty value because the parameter has `min_length=1`.

## 8. Run the Tests

From the repository's `backend/` directory, run:

```bash
python -m pytest tests/test_api.py -q
```

To run the complete backend test suite:

```bash
python -m pytest -q
```

If a test fails, inspect the traceback and verify the route, imports, response serializer, and test expectations.

## 9. Verify the Endpoint Using Swagger UI

Start the backend using the repository's configured development command.

Open:

```text
http://localhost:8000/docs
```

Find the Issues section and locate:

`GET /api/v1/issues/tutorial-example`

Use the Swagger UI interface to execute the endpoint with a query parameter such as `name=OpenSourceMate`.

Expected response:

```json
{
  "message": "Hello, OpenSourceMate!"
}
```

## 10. Common Mistakes

| Mistake                                    | Solution                                                                                |
| ------------------------------------------ | --------------------------------------------------------------------------------------- |
| Forgetting the router prefix               | Include the existing router prefix when determining the final URL.                      |
| Missing the response model                 | Define and import an appropriate Pydantic serializer.                                   |
| Incorrect query validation                 | Use FastAPI's `Query()` constraints.                                                    |
| Forgetting router registration             | Register new routers in `main.py`; existing routers do not need duplicate registration. |
| Testing the wrong URL                      | Include the API version and router prefixes.                                            |
| Making external API calls in unit tests    | Use the existing `github_mock` fixture when mocking GitHub requests is necessary.       |
| Returning an unexpected response structure | Ensure the returned data matches the declared response model.                           |

## 11. Completion Checklist

Before submitting your changes, verify:

- [ ] Identified the appropriate existing router or created a new router.
- [ ] Defined the required Pydantic serializer.
- [ ] Implemented the endpoint using FastAPI conventions.
- [ ] Added appropriate parameter validation.
- [ ] Registered a new router in `main.py` if required.
- [ ] Considered both versioned and legacy API prefixes.
- [ ] Added tests for successful responses.
- [ ] Added tests for invalid input where appropriate.
- [ ] Ran the relevant backend tests.
- [ ] Verified the endpoint using Swagger UI.
- [ ] Confirmed that existing endpoints remain unaffected.
