# From the root of the remove run `npx nx run convo-crawler:build-docker` to build

FROM  --platform=linux/amd64 ubuntu:20.04

ENV DEBIAN_FRONTEND=noninteractive
ENV NODE_VERSION=v18.17.1
ENV NVM_DIR /usr/src/.nvm
ENV NODE_PATH $NVM_DIR/versions/node/$NODE_VERSION/bin
ENV APP_DIR=/app
ENV PATH $NODE_PATH:$APP_DIR/bin:$PATH
ENV DISPLAY=:1
ENV TZ=America/New_York
ENV NODE_ENV=production

RUN apt-get update; apt-get clean

# Add a user for running applications.
RUN useradd apps
RUN mkdir -p /home/apps && chown apps:apps /home/apps

RUN mkdir -p $APP_DIR $NVM_DIR
WORKDIR $APP_DIR

# apt deps
RUN apt-get install -y \
    x11vnc \
    xvfb \
    fluxbox \
    wget \
    wmctrl \
    dbus-x11 \
    python3 \
    build-essential \
    libssl-dev \
    git

# install nvm
RUN \
    wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash && \
    . $NVM_DIR/nvm.sh && \
    nvm install $NODE_VERSION

# install chrome
RUN wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
RUN apt install -y ./google-chrome-stable_current_amd64.deb
RUN rm google-chrome-stable_current_amd64.deb

# install NPM Deps
RUN npm i ngrok

RUN mkdir $APP_DIR/bin

# build / install websoketify
RUN \
    git clone https://github.com/novnc/websockify-other.git && \
    cd websockify-other/c && \
    make && \
    cp websockify $APP_DIR/bin


RUN echo 2
COPY docker/bootstrap.sh .
COPY ./bin/convo-web.js bin/convo-web

RUN \
    cp node_modules/ngrok/bin/ngrok $APP_DIR/bin && \
    chmod +x bin/convo-web && \
    chmod +x ./bootstrap.sh && \
    chown apps:apps -R $APP_DIR


CMD '/app/bootstrap.sh'
