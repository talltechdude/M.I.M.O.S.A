FROM python:3.7

WORKDIR /usr/src/app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir /data
WORKDIR /data

VOLUME [ "/data" ]

EXPOSE 5000 

CMD [ "python", "/usr/src/app/app.py" ]
