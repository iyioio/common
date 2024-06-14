#!/bin/bash
set -e

docker run --rm --name convo-web --shm-size=2gb -p 5900:5900 -p 7000:7000 -e VNC_SERVER_PASSWORD=password --user apps convo-web
