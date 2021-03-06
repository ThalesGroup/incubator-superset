#
# Licensed to the Apache Software Foundation (ASF) under one or more
# contributor license agreements.  See the NOTICE file distributed with
# this work for additional information regarding copyright ownership.
# The ASF licenses this file to You under the Apache License, Version 2.0
# (the "License"); you may not use this file except in compliance with
# the License.  You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

FROM python:3.6-slim

# Configure environment
ENV user=guavus-raf

ENV LANG=C.UTF-8 \
    LC_ALL=C.UTF-8 \
    HOME=/home/${user} \
    DEBIAN_FRONTEND=noninteractive \
    PATH=/home/${user}/incubator-superset/superset/bin:$PATH \
    PYTHONPATH=./superset/:$PYTHONPATH
    
RUN useradd --user-group --create-home --no-log-init --shell /bin/bash ${user} \
    && \
    mkdir -p $HOME/incubator-superset \
    mkdir -p /etc/security/keytabs/ \
    mkdir -p /etc/cert/ && \
    chmod +x /etc/cert && \
    chmod +x /usr/local/bin && \
    chown -R ${user}:${user} $HOME


RUN apt-get update && \
    apt-get install -y build-essential libssl-dev curl gcc \
        libffi-dev libsasl2-dev libldap2-dev \
        libsasl2-modules libsasl2-2 libsasl2-modules-gssapi-mit libkrb5-dev krb5-user  && \
    apt-get clean && \
    rm -r /var/lib/apt/lists/* && \
    apt-get autoremove -y && \
    curl -sL https://deb.nodesource.com/setup_10.x | bash - \
    && \
    apt-get install -y nodejs 
    


WORKDIR $HOME/incubator-superset


COPY ./ ./

RUN pip install --upgrade setuptools pip \
    && pip install --no-cache-dir wheel \
    && pip install --no-cache-dir pywinrm[kerberos]

RUN python ./setup.py bdist_wheel \ 
    && pip install --no-cache-dir ./dist/*.whl \
    && rm -rf /root/.cache/pip


RUN cd superset/assets && npm install \
    && npm run sync-backend \
    && npm run build  \
    && rm -rf node_modules \
    && npm cache clean --force

RUN apt-get remove -y \
    \*-dev \
    build-essential \
    python-wheel

RUN apt-get purge --auto-remove -y nodejs

RUN chown -R ${user}:${user} ./superset     

COPY docker-init.sh /usr/local/bin/

COPY auth-kerberized.sh /usr/local/bin/

RUN chmod +x /usr/local/bin/docker-init.sh /usr/local/bin/auth-kerberized.sh

USER ${user}

ENTRYPOINT ["docker-init.sh"]

EXPOSE 8088