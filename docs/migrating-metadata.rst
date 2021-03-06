..  Licensed to the Apache Software Foundation (ASF) under one
    or more contributor license agreements.  See the NOTICE file
    distributed with this work for additional information
    regarding copyright ownership.  The ASF licenses this file
    to you under the Apache License, Version 2.0 (the
    "License"); you may not use this file except in compliance
    with the License.  You may obtain a copy of the License at

..    http://www.apache.org/licenses/LICENSE-2.0

..  Unless required by applicable law or agreed to in writing,
    software distributed under the License is distributed on an
    "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, either express or implied.  See the License for the
    specific language governing permissions and limitations
    under the License.

Migrating RVF Metadata between instances
========================================

Mirgrating RVF's metadata between instances is done through dumping the metadata from postgres and importing it to an another instance. Using this method, we can get fully configured superset as it stores every metadata in the configured postgres table. It addresses the known issues which arises when one's deploying on a target machine (different instance).

Steps
-----
1. Locate setup where superset is storing it's metadata. (eg. Using deployemnt file: raf-viz-fwk-deployment.yaml)
2. Consider following vars in the deployment file: ::

    - name: POSTGRES_DB
        value: rvf
    - name: POSTGRES_HOST
        value: "x.x.x.x"
    - name: POSTGRES_PORT
        value: "5432"
    - name: POSTGRES_USER
        value: "postgres"
    - name: POSTGRES_PASSWORD
        value: "postgres"

3. Connect to **POSTGRES_HOST** setup
4. Change directory: ::

    cd /usr/pgsql-9.6/bin/
    # Note: Don't use `pg_dump` directly as some setups gone through upgrade of 9.2 -> 9.6 might have some problem due to non - removal of older binaries.

5. Use **POSTGRES_DB** from the deployment file. Execute the following: ::
    
    ./pg_dump -U postgres -h `hostname` -W -F p {POSTGRES_DB} > rvf_dump_backup.sql
    # Note: Replace {POSTGRES_DB} with the value

6. If prompt for **username/ password**, refer deployment file. 
7. Copy the generated dump **rvf_dump_backup.sql** to the target machine where superset will store it's metadata.
8. On the target machine: ::

    psql -U postgres -h `hostname`

9. Inside the psql shell: ::

    create database {POSTGRES_DB};
    \c {POSTGRES_DB};
    \i {PATH_TO_EXPORTED_DUMP}

    # {PATH_TO_EXPORTED_DUMP} = /path/to/rvf_dump_backup.sql
    # Note: Replace {POSTGRES_DB} and {PATH_TO_EXPORTED_DUMP} with the value
10. Now deploy using **raf-viz-fwk-deployment.yaml**

* **Note**: ::

    1. Do the migration of metadata before rvf deployment
    2. Make sure to change the datasource DB's address under `Sources` > `Databases` > `DB_Name` > `SQLAlchemy URI`

* **Open issue**: As we can't change the table name later on, try to have same table names for the datasource.

You have now successfully deployed Superset will all the dashboards and their configurations. 

Benefits
--------
This methods benefits the user by addressing the following errors:

* To ship/ replicate superset as whole, no steps were available. One needed to individually export and import dashboards. Now we can ship it as an exact replica.
* Manual efforts to correctly configure publishers and subscribers for all charts (Risk of human errors). It's now automated.