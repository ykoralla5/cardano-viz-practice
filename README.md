# Master Thesis Interactive visualization of Cardano blockchain
Repository for Master thesis as part of UZH Masters in Information Systems.

## Description
As a part of their Master Thesis at the University of Zurich, the author has designed and implemented a visualization tool that shows decentralisation and network health of Cardano blockchain in the form of a bubble map. This repository contains all the code necessary to run the tool.

## Goal
A visualization tool to show Cardano's staking network.

## System architecture
### Data collection
Relevant data is collected in real-time from a Cardano node's PostgreSQL database into a secondary PostgreSQL database using PostgreSQL's publication/subscription feature. Cron jobs run every few minutes to summarize raw transaction data into epoch-wise data and store them in summary tables. Indexes on base tables (tables with exact structure and data from main Cardano node) and summary tables (filtered and aggregated data) help improve query performance.

The code for the cron jobs are available in the TXT file at [backend/backend/psql.txt](https://github.com/ykoralla5/cardano-viz-practice/blob/main/backend/backend/psql.txt).
### Backend
The backend uses Django. Django's models help map to database tables and Django's Views help aggregate data from various models and format them to JSON to be used by the frontend.

### Frontend
The frontend uses React 19. D3.js is used to generate the bubble map for the network, and TailwindCSS is used to design the frontend.

The workflow of the system architecture is summarized in the picture below:

## Software versions used:

React version 19.1.0  
Django 5.2.1  
Python version 3.11.6  
PostgreSQL version 15.7  
Node version 20.19.2  
NVM version 0.39.7  
TailwindCSS version 4.1.14  

## Other System requirements: 
A minimum of 250 GB is required to store the relevant tables for the dashboard and for the summary tables. 

## Installation guide:
Pre-requisites: Running Cardano *cardano_db_sync* node

Clone repository.

### Django
Create virtual environment for python and install required packages from requirements.txt file: 
```
cd backend
python -m venv
source venv/bin/activate
pip install -r requirements.txt
```

Create new Django application *api*
```
python manage.py startapp api
```

Run database migrations
```
python manage.py migrate
```

### Generating summary tables

Cron jobs run every few minutes to generate epoch-wise summary rows of transaction data. The cron jobs run the .sql files in the `psql_incremental_updates` folder. The SQL files also create the summary tables. Ensure that these tables are given relevant permissions so that Django can access them (ideally provide only SELECT priviliges). Logs are stored and rotated for every 8 days.

Example command to create a cron job that runs every 5 minutes:
```
*/5 * * * * echo "[$(date)] Starting delegation_summary_update" >> /cardano-viz-practice/psql_incremental_updates/logs/delegation_summary.log && psql -d cardano_db_filtered -f /cardano-viz-practice/psql_incremental_updates/update_delegation.sql >> /cardano-viz-practice/psql_incremental_updates/logs/delegation_summary.log 2>&1 && echo "[$(date)] Finished delegation_summary_update" >> /cardano-viz-practice/psql_incremental_updates/logs/delegation_summary.log
```

### React
Create new React Vite app in the frontend directory:
```
cd frontend
npm create vite@latest frontend --template react
```

Install packages from package.json file
```
npm install
```

### Environment variables

Create a .env file inside the `backend` folder and add variables to connect to the backend PostgreSQL databases for Django and the post-processed Cardano database. Currently, the :

DB_DJANGO_NAME=django_database_name  
DB_DJANGO_USER=django_database_name  
DB_DJANGO_PASSWORD=django_database_name  
DB_DJANGO_HOST=localhost  
DB_DJANGO_PORT=5432  
DB_CARDANO_NAME=postprocessed_cardano_database_name  
DB_CARDANO_USER=postprocessed_cardano_database_user  
DB_CARDANO_PASSWORD=postprocessed_cardano_database_password  
DB_CARDANO_HOST=localhost  
DB_CARDANO_PORT=5432  

### Running the visualization tool

Run the backend:
```
python manage.py runserver
```

Run the frontend:
```
npm run dev
```

Access the frontend on: http://localhost:5173  
Access the Django API endpoints on: http://localhost:8000/api
