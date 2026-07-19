from fastapi import FastAPI

app = FastAPI(title="R4C BIM Worker", version="0.1.0")


@app.get("/health")
def health() -> dict[str, str]:
    return {"service": "r4c-bim-worker", "status": "ok"}
