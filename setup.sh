#!/bin/bash -x
exec > >(logger -p user.info) 2> >(logger -p user.warn)

logger "** Trying to install docker: step 1 **"

mkdir -p /mnt/var/lib/docker
ln -s /mnt/var/lib/docker /var/lib/docker

REGISTRY=docker-registry.acorn.cirrostratus.org
S3_CERT_URL="s3://sequoia-install/certs-and-keys/dockerregistrySSL/${REGISTRY}.crt"
aws s3 cp "${S3_CERT_URL}" "/etc/docker/certs.d/${REGISTRY}/ca.crt"
COMPOSE_URL="https://github.com/docker/compose/releases/download/1.16.1/docker-compose-$(uname -s)-$(uname -m)"
curl -L "${COMPOSE_URL}" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
chown root:root /src/install-docker.sh
chmod 755 /src/install-docker.sh
echo "/src/install-docker.sh" | at now + 1 minute
