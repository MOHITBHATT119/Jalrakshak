FROM python:3.12-slim

WORKDIR /app

# Install dependencies first (cache-friendly)
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code and data
COPY backend/ .
COPY data/ ./data/

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
