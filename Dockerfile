FROM n8nio/n8n
USER root
RUN apt-get update && apt-get install -y python3 && apt-get clean && rm -rf /var/lib/apt/lists/*
USER node
