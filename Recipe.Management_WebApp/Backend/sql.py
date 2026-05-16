import mysql.connector
from mysql.connector import Error

def create_connection(host, user, pwd, db=None):
    """
    Open a connection to MySQL.
    - If 'db' is None: connect to the server (no default database selected)
    - If 'db' is provided: connect directly to that database
    """
    try:
        # If a database is specified, connect with that database selected
        if db:
            # Attempt to connect with a default database.
            conn = mysql.connector.connect(host=host, user=user, password=pwd, database=db)
            # If successful, return the live connection object
            return conn
        # Otherwise connect only to the server (used before database creation)
        conn = mysql.connector.connect(host=host, user=user, password=pwd)
        return conn  # Return server-level connection
    except Error as e:
        # If anything goes wrong, print the error and return None for the caller to handle
        print("Connection error:", e)
        return None

def execute_query(conn, query, values=None):
    """
    Run a non-SELECT statement (INSERT, UPDATE, DELETE, CREATE TABLE, etc.).
    Commits changes if execution succeeds.
    Returns True on success, False on error.
    """
    try:
        # Create a cursor for executing the SQL statement
        cur = conn.cursor()
        # If values are provided, use parameterized execution to avoid injection
        if values is None:
            cur.execute(query)               # Execute raw query with no parameters
        else:
            cur.execute(query, values)       # Execute query with parameters
        conn.commit()                        # Persist changes to the database
        cur.close()                          # Close the cursor to free resources
        return True                          # Indicate success to the caller
    except Error as e:
        # On error, print a message and return False
        print("Query error:", e)
        return False

def execute_read_query(conn, query, values=None):
    """
    Run a SELECT statement and return results as a list of dictionaries.
    Using dictionary=True lets us access columns by name (e.g., row["id"]).
    """
    try:
        # Create a cursor that yields dict rows
        cur = conn.cursor(dictionary=True)
        # Execute with or without parameters depending on input
        if values is None:
            cur.execute(query)              # Execute raw SELECT
        else:
            cur.execute(query, values)    # Execute parameterized SELECT
        rows = cur.fetchall()              # Fetch all resulting rows at once
        cur.close()                         # Close cursor to release resources
        return rows                          # Returns list[dict] to the caller
    except Error as e:
        # On error, log and return an empty list to keep calling code simple.
        print("Read error:", e)
        return []

def create_tables(conn):
    """
    Create the schema used by the API if it does not exist yet.

    Tables:
      - ingredient(id, sku, ingredientname, totalamount)
      - recipe(id, instructions, recipeingredientid)
      - recipeingredient(id, ingredientid, amount, recipe_id)
    """
    # Create ingredient table: optional sku is a UI-friendly code; name is unique.
    execute_query(conn, (
        "CREATE TABLE IF NOT EXISTS ingredient ("
        " id INT AUTO_INCREMENT PRIMARY KEY,"
        " sku VARCHAR(40) UNIQUE,"
        " ingredientname VARCHAR(120) NOT NULL UNIQUE,"
        " totalamount DOUBLE NOT NULL DEFAULT 0"
        ")"))

    # Create recipe table: keep recipeingredientid per spec; it’s not used for joins.
    execute_query(conn, (
        "CREATE TABLE IF NOT EXISTS recipe ("
        " id INT AUTO_INCREMENT PRIMARY KEY,"
        " instructions TEXT NOT NULL,"
        " recipeingredientid INT"
        ")"))

    # Create linking table between recipe and ingredient with required amount per line.
    execute_query(conn, (
        "CREATE TABLE IF NOT EXISTS recipeingredient ("
        " id INT AUTO_INCREMENT PRIMARY KEY,"
        " ingredientid INT NOT NULL,"
        " amount DOUBLE NOT NULL,"
        " recipe_id INT NOT NULL,"
        " FOREIGN KEY (ingredientid) REFERENCES ingredient(id),"
        " FOREIGN KEY (recipe_id) REFERENCES recipe(id)"
        ")"))