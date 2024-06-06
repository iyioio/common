#!/bin/bash
set -e
cd "$(dirname "$0")/.."

ngrok http --subdomain=convo-crawler-out file://$(pwd)/convo-crawler-out
