FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN useradd --create-home --uid 10001 r4c
WORKDIR /app

COPY pyproject.toml ./
COPY r4c_bim_worker ./r4c_bim_worker
RUN pip install --no-cache-dir .

USER r4c
EXPOSE 8000

CMD ["uvicorn", "r4c_bim_worker.main:app", "--host", "0.0.0.0", "--port", "8000"]
