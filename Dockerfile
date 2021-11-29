FROM node:latest

# run -v /host/path/to/certs:/root/nodeApi

WORKDIR /root/nodeApi

# make self-signed cert
RUN openssl req -x509 -nodes -days 365 \
    -subj  "/C=CA/ST=QC/O=Company Inc/CN=example.com" \
     -newkey rsa:2048 -keyout ./app.key \
     -out ./app.crt;

COPY index.js package.json example.secrets.json website/ /root/nodeApi/

RUN mv example.secrets.json secrets.json; \
    npm install;

CMD node index.js

