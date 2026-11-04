"""Loopback-only local API. Source images are not retained between requests."""
import argparse
import json
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.trustedhost import TrustedHostMiddleware

from . import __version__
from .pipeline import CATALOG, MAX_BYTES, run_plan, validate_plan

WEB = Path(__file__).parent / "web"
ROOT = Path(__file__).resolve().parents[2]
app = FastAPI(title="Gazoken local workbench", version=__version__, docs_url=None, redoc_url=None)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["127.0.0.1", "localhost", "[::1]", "testserver"])


class LocalRequestBoundary:
    """Bound request bytes before multipart parsing; reject foreign browser writes."""
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http" or scope["method"] != "POST":
            return await self.app(scope, receive, send)
        headers = dict(scope["headers"])
        origin = headers.get(b"origin")
        expected = (scope["scheme"] + "://" + headers.get(b"host", b"").decode()).encode()
        if (origin and origin != expected) or headers.get(b"sec-fetch-site") == b"cross-site":
            return await JSONResponse({"detail": "Cross-origin requests are not accepted."}, status_code=403)(scope, receive, send)
        chunks, total = [], 0
        while True:
            message = await receive()
            if message["type"] == "http.disconnect":
                return
            chunk = message.get("body", b"")
            total += len(chunk)
            if total > MAX_BYTES + 128 * 1024:
                return await JSONResponse({"detail": "JPEG upload exceeds 25 MiB."}, status_code=413)(scope, receive, send)
            chunks.append(chunk)
            if not message.get("more_body", False):
                break
        body = b"".join(chunks)
        delivered = False

        async def replay():
            nonlocal delivered
            if not delivered:
                delivered = True
                return {"type": "http.request", "body": body, "more_body": False}
            return await receive()

        return await self.app(scope, replay, send)


app.add_middleware(LocalRequestBoundary)


@app.get("/api/catalog")
def catalog():
    return {"version": __version__, "steps": CATALOG, "mode": "local_python"}


@app.post("/api/run")
async def run(image: UploadFile = File(...), configuration: str = Form(...)):
    try:
        if len(configuration) > 32768:
            raise ValueError("Configuration is too large.")
        plan = validate_plan(json.loads(configuration))
        data = await image.read(MAX_BYTES + 1)
        if len(data) > MAX_BYTES:
            raise HTTPException(413, "JPEG upload exceeds 25 MiB.")
        return run_plan(data, image.filename or "source.jpg", plan)
    except (ValueError, TypeError) as exc:
        raise HTTPException(400, str(exc)) from exc
    finally:
        await image.close()


@app.get("/")
def home():
    return FileResponse(WEB / "index.html")


@app.get("/api/sample")
def sample():
    return FileResponse(ROOT / "tests/fixtures/images/02-reference-q90.jpg", media_type="image/jpeg")


app.mount("/ui", StaticFiles(directory=WEB), name="ui")
app.mount("/inspector", StaticFiles(directory=ROOT / "assets/js"), name="inspector")


def main():
    import uvicorn
    parser = argparse.ArgumentParser(description="Gazoken local research workbench")
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()
    print(f"Gazoken workbench: http://127.0.0.1:{args.port}")
    uvicorn.run(app, host="127.0.0.1", port=args.port)


if __name__ == "__main__":
    main()
