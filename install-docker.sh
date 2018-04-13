#!/bin/bash -x
logger "** Trying to install docker: step 2 **"
exec > >(logger -p user.info) 2> >(logger -p user.warn)

apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys 0EBFCD88 >/dev/null 2>&1 && echo " ... OK" || echo " ... failed"
add-apt-repository \
   "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
   $(lsb_release -cs) \
   stable"

#This will limit the apt-update to the /etc/apt/sources-list to save some time.
apt-get -y update -o Dir::Etc::sourcelist=sources.list
apt-get -y install docker-ce

# change docker config and allow ubuntu to run docker commands
echo "DOCKER_OPTS=\"-H unix:///var/run/docker.sock -H 127.0.0.1:2375\"" > /etc/default/docker
usermod -aG docker ubuntu
service docker stop
sleep 5
service docker start
sleep 15
cat /etc/profile.d/sagoku.sh
source /etc/profile.d/sagoku.sh
cd /src || ( echo "/src does not exist, exiting" && exit 1)

docker-compose build
DOCKER_HOST_IP=$(hostname -i) docker-compose up | bittybuffer -t ${SGK_APP} -c "docker"
