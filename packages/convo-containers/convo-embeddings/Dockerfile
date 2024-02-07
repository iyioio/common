FROM python:3.11

WORKDIR /app

RUN python3 -m pip install --upgrade pip

COPY requirements.txt .

RUN python3 -m pip install --no-cache-dir -r requirements.txt

COPY models/ ./models

COPY main.py .

COPY src/ ./src

EXPOSE 8080

CMD [ "python3", "/app/main.py" ]
