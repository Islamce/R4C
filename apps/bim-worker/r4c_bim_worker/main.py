import hashlib
import hmac
import tempfile
from pathlib import Path
from urllib.parse import urlparse

import httpx
from fastapi import FastAPI, Header, HTTPException, status
from pydantic import AnyHttpUrl, BaseModel

from .extractor import extract_ifc
from .geometry import generate_glb
from .settings import settings

app = FastAPI(title="R4C BIM Worker", version="0.3.0")


class ProcessRequest(BaseModel):
    sourceUrl: AnyHttpUrl
    artifactUploadUrl: AnyHttpUrl


@app.get("/health")
def health() -> dict[str, str]:
    return {"service": "r4c-bim-worker", "status": "ok"}


def validate_storage_url(value: str) -> None:
    parsed = urlparse(value)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        raise HTTPException(status_code=400, detail="Invalid storage URL")
    if parsed.hostname.lower() not in settings.allowed_hosts:
        raise HTTPException(status_code=400, detail="Storage host is not allowed")


@app.post("/process")
def process_ifc(
    request: ProcessRequest,
    authorization: str | None = Header(default=None),
) -> dict:
    expected = f"Bearer {settings.bim_worker_token}"
    if not authorization or not hmac.compare_digest(authorization, expected):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")

    source_url = str(request.sourceUrl)
    artifact_upload_url = str(request.artifactUploadUrl)
    validate_storage_url(source_url)
    validate_storage_url(artifact_upload_url)

    ifc_path: Path | None = None
    glb_path: Path | None = None
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
                ifc_path = Path(temp.name)
                downloaded = 0
                for chunk in response.iter_bytes():
                    downloaded += len(chunk)
                    if downloaded > settings.bim_max_file_bytes:
                        raise HTTPException(
                            status_code=413,
                            detail="IFC file exceeds configured limit",
                        )
                    temp.write(chunk)

        if not ifc_path or ifc_path.stat().st_size == 0:
            raise HTTPException(status_code=422, detail="IFC file is empty")

        semantic = extract_ifc(ifc_path, settings.bim_max_elements)
        with tempfile.NamedTemporaryFile(suffix=".glb", delete=False) as temp_glb:
            glb_path = Path(temp_glb.name)
        geometry = generate_glb(ifc_path, glb_path, settings.bim_max_elements)

        digest = hashlib.sha256()
        with glb_path.open("rb") as artifact:
            for chunk in iter(lambda: artifact.read(1024 * 1024), b""):
                digest.update(chunk)
        checksum = digest.hexdigest()

        with glb_path.open("rb") as artifact:
            upload = httpx.put(
                artifact_upload_url,
                content=artifact,
                headers={"content-type": "model/gltf-binary"},
                follow_redirects=False,
                timeout=httpx.Timeout(60, write=300),
            )
            upload.raise_for_status()

        return {
            **semantic,
            "artifact": {
                "format": "GLB",
                "mimeType": "model/gltf-binary",
                "sizeBytes": geometry["sizeBytes"],
                "geometryElements": geometry["geometryElements"],
                "checksumSha256": checksum,
            },
        }
    except HTTPException:
        raise
    except (httpx.HTTPError, OSError, ValueError, RuntimeError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)[:1000]) from exc
    finally:
        if ifc_path:
            ifc_path.unlink(missing_ok=True)
        if glb_path:
            glb_path.unlink(missing_ok=True)
