# Master Thesis Interactive visualization of Cardano blockchain
Repository for Master thesis as part of UZH Masters in Information Systems.

## Description
As a part of their Master Thesis at the University of Zurich, the author has designed and implemented a visualization tool that shows decentralisation and network health of Cardano blockchain in the form of a bubble map. This repository contains all the code necessary to run the tool.

## Goal
A visualization tool to show Cardano's staking network.

## System architecture
### Data collection
Relevant data is collected in real-time from a Cardano node's PostgreSQL database into a secondary PostgreSQL database using PostgreSQL's publication/subscription feature. Cron jobs run every few minutes to summarize raw transaction data into epoch-wise data and store them in summary tables. Indexes on base tables (tables with exact structure and data from main Cardano node) and summary tables (filtered and aggregated data) help improve query performance.

The code for the cron jobs are available under --.

### Backend
The backend uses Django. Django's models help map to database tables and Django's Views help aggregate data from various models and format them to JSON to be used by the frontend.

### Frontend
The frontend uses React 19. D3.js is used to generate the bubble map for the network, and TailwindCSS is used to design the frontend.

The workflow of the system architecture is summarized in the picture below:

## Software versions used:

## System requirements:

## Installation guide:
Pre-requisits: Running Cardano *cardano_db_sync* node

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

Create a .env file
```
cd backend
```

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
