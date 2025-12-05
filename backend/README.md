# Backend directory structure

`/backend/api`: Django application for the purpose of creating and managing API calls.  
`/backend/api/models.py`: Structure of the database tables is defined here (either using `python manage.py migrate` or by manually creating classes).  
`/backend/api/views.py`: Django Functions that take http requests from the frontend, generate and return JSON responses by querying the database.  
`/backend/api/urls.py`: Map views to their URL paths.  
`/backend/cardano_backend`: The main Django application.  
`/backend/cardano_backend/settings.py`: All settings for the Django application, such as databases, logging, allowed domains, etc. Note that the tool uses PostgreSQL instead of the default SQLite.  
`/backend/manage.py`: The main python file to run the application.  
`/graphs.ipynb`:  Jupyter notebook to run exploratory analysis.  
`/requirements.txt`: TXT file containing packages and their versions.  
`/psql.txt`: A TXT file providing example commands to create summary tables and run cron jobs.