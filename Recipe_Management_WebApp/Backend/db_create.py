#A script to ensure the database and tables exist before the API runs

import creds
from sql import create_connection, execute_query, create_tables

# Builds a Creds instance to read host/user/password/db from one place
c = creds.Creds()

#Connect to the MySQL server without choosing a database
root_conn = create_connection(c.conString, c.userName, c.password)
# If server connection failed, there is nothing else to do.
if root_conn is None:
    # Early exit if connection didn’t work; prints happened in create_connection.
    raise SystemExit("Cannot connect to MySQL server to create database.")

#Create the application database if it does not exist yet.
execute_query(root_conn, f"CREATE DATABASE IF NOT EXISTS {c.dbName}")
# Close the server-level connection to clean up resources.
root_conn.close()

#Connect again, this time selecting the application database.
conn = create_connection(c.conString, c.userName, c.password, c.dbName)
# If this connection fails, schema creation cannot proceed.
if conn is None:
    raise SystemExit("Cannot connect to application database after creation.")

#Create the required tables using the shared helper.
create_tables(conn)
# Prints a confirmation so it’s obvious this step finished
print("Database and tables are set.")