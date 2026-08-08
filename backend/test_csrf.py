"""Self-check for the CSRF middleware — a client with no cookie must be issued one
even when its request is rejected, or guest checkout 403s forever.
Run with: .venv/bin/python test_csrf.py
"""

import asyncio
import re

from starlette.requests import Request
from starlette.responses import JSONResponse

from app.main import CSRF_COOKIE_NAME, CSRF_HEADER_NAME, CSRFMiddleware

middleware = CSRFMiddleware(app=None)


async def ok(_request):
    return JSONResponse({"ok": True})


def call(method: str, cookie: str | None = None, header: str | None = None):
    """Drive one request through the middleware; return (status, minted_cookie_or_None)."""
    headers = []
    if cookie:
        headers.append((b"cookie", f"{CSRF_COOKIE_NAME}={cookie}".encode()))
    if header:
        headers.append((CSRF_HEADER_NAME.lower().encode(), header.encode()))
    request = Request(
        {
            "type": "http",
            "method": method,
            "path": "/api/orders",
            "query_string": b"",
            "headers": headers,
        }
    )
    response = asyncio.run(middleware.dispatch(request, ok))
    minted = None
    for key, value in response.raw_headers:
        if key.lower() == b"set-cookie":
            match = re.match(rf"{CSRF_COOKIE_NAME}=([^;]+)", value.decode())
            if match:
                minted = match.group(1)
    return response.status_code, minted


# A safe request mints the token.
status, minted = call("GET")
assert status == 200 and minted, (status, minted)

# With that cookie echoed in the header, the POST goes through — and nothing is re-minted.
status, reminted = call("POST", cookie=minted, header=minted)
assert status == 200, status
assert reminted is None, "an existing cookie must not be rotated on every request"

# A cookie-less POST is rejected — but still leaves with a token, so the retry works.
status, issued = call("POST")
assert status == 403, status
assert issued, "a rejected POST must still mint a cookie, else the client can never recover"
assert call("POST", cookie=issued, header=issued)[0] == 200

# The cookie alone is never enough: a missing or wrong header still fails.
assert call("POST", cookie=minted)[0] == 403
assert call("POST", cookie=minted, header="not-the-cookie")[0] == 403

print("CSRF middleware checks passed")
