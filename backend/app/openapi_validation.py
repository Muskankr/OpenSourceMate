"""Offline structural/reference check for the generated FastAPI OpenAPI document.

Run from backend: python -m app.openapi_validation [optional-document.json].
Uses FastAPI's installed OpenAPI models, without adding a validator dependency or
fetching external references. This is a bounded check of this app's generated
schema, not a claim to implement every OpenAPI/JSON-Schema semantic rule.
"""

import argparse
import json
from pathlib import Path
from typing import Any

from fastapi.openapi.models import OpenAPI, Operation, Response


def validate_document(document: dict[str, Any]) -> None:
    """Reject invalid structure, version and unresolved local schema references."""
    OpenAPI.model_validate(document)
    if not document["openapi"].startswith(("3.0.", "3.1.")):
        raise ValueError("Expected an OpenAPI 3.0/3.1 document")
    if not isinstance(document.get("paths"), dict) or not document["paths"]:
        raise ValueError("The API document must contain paths")

    # FastAPI permits raw dict extensions in its root OpenAPI model. Validate
    # actual operations/responses too, so a malformed dict cannot bypass it.
    methods = {"get", "put", "post", "delete", "options", "head", "patch", "trace"}
    for path_item in document["paths"].values():
        if not isinstance(path_item, dict):
            raise ValueError("Path items must be objects")
        for method in methods & path_item.keys():
            operation = path_item[method]
            Operation.model_validate(operation)
            if (
                not isinstance(operation.get("responses"), dict)
                or not operation["responses"]
            ):
                raise ValueError("Operations must document their responses")
            for response in operation["responses"].values():
                if not isinstance(response, dict):
                    raise ValueError("Responses must be objects")
                if "$ref" not in response:
                    Response.model_validate(response)

    def walk(value: Any) -> None:
        if isinstance(value, list):
            for item in value:
                walk(item)
        elif isinstance(value, dict):
            reference = value.get("$ref")
            if reference is not None:
                if not isinstance(reference, str) or not reference.startswith("#/"):
                    raise ValueError(
                        "Only local references are allowed in this generated schema"
                    )
                target: Any = document
                try:
                    for segment in reference[2:].split("/"):
                        target = target[segment.replace("~1", "/").replace("~0", "~")]
                except (KeyError, TypeError) as exc:
                    raise ValueError(
                        f"Unresolved local reference: {reference}"
                    ) from exc
            for child in value.values():
                walk(child)

    walk(document)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("document", nargs="?", type=Path)
    args = parser.parse_args()
    try:
        if args.document:
            document = json.loads(args.document.read_text(encoding="utf-8"))
        else:
            from app.main import app

            document = app.openapi()
        validate_document(document)
    except (OSError, ValueError, TypeError, KeyError) as exc:
        parser.exit(1, f"OpenAPI check failed: {exc}\n")
    print(
        f"OpenAPI structure and local references valid: {len(document['paths'])} paths"
    )


if __name__ == "__main__":
    main()
