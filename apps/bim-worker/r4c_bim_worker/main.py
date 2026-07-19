import hmac
import tempfile
from pathlib import Path
from urllib.parse import urlparse

import httpx
from fastapi import FastAPI, Header, HTTPException, status
from pydantic import AnyHttpUrl, BaseModel

from .extractor import extract_ifc
from .settings import settings


app = FastAPI(title="R4C BIM Worker", version="0.2.0")


class ProcessRequest(BaseModel):
    sourceUrl: AnyHttpUrl


@app.get("/health")
def health() -> dict[str, str]:
    return {"service": "r4c-bim-worker", "status": "ok"}


@app.post("/process")
def process_ifc(
    request: ProcessRequest,
    authorization: str | None = Header(default=None),
) -> dict:
    expected = f"Bearer {settings.bim_worker_token}"
    if not authorization or not hmac.compare_digest(authorization, expected):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")

    source_url = str(request.sourceUrl)
    parsed = urlparse(source_url)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        raise HTTPException(status_code=400, detail="Invalid source URL")
    if parsed.hostname.lower() not in settings.allowed_hosts:
        raise HTTPException(status_code=400, detail="Source host is not allowed")

    temp_path: Path | None = None
    try:
        with httpx.stream(
            "GET",
            source_url,
            follow_redirects=False,
            timeout=httpx.Timeout(60, read=300),
        ) as response:
            response.raise_for_status()
            declared_size = int(response.headers.get("content-length", "0"))
            if declared_size > settings.bim_max_file_bytes:
                raise HTTPException(status_code=413, detail="IFC file exceeds configured limit")

            with tempfile.NamedTemporaryFile(suffix=".ifc", delete=False) as temp:
                temp_path = Path(temp.name)
                downloaded = 0
                for chunk in response.iter_bytes():
                    downloaded += len(chunk)
                    if downloaded > settings.bim_max_file_bytes:
                        raise HTTPException(
                            status_code=413,
                            detail="IFC file exceeds configured limit",
                        )
                    temp.write(chunk)

        if not temp_path or temp_path.stat().st_size == 0:
            raise HTTPException(status_code=422, detail="IFC file is empty")

        return extract_ifc(temp_path, settings.bim_max_elements)
    except HTTPException:
        raise
    except (httpx.HTTPError, OSError, ValueError, RuntimeError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)[:1000]) from exc
    finally:
        if temp_path:
            temp_path.unlink(missing_ok=True)
