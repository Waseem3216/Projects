#creds.py
#This module holds the MySQL connection details in one place.
#Other files import Creds to avoid hardcoding these values everywhere.

class Creds:
    def __init__(self):
        #Hostname or IP of the MySQL server
        self.conString = "recipedb.cr24a6a4cotv.us-east-2.rds.amazonaws.com"
        #Username that has permissions on the target database
        self.userName = "admin"
        #Password associated with that MySQL user
        self.password = "password1231234"
        #Name of the database that this app uses
        self.dbName = "recipe_db"
