To run the code type the following in your terminal:

python3 -m venv .venv

Windows: .venv\Scripts\activate
macOS/Linux: source .venv/bin/activate
pip install mysql-connector-python

pip install Flask

python db_create.py

python crudops.py

Note about the 2nd Commit for the backend code: The crudops.py code is faster, safer, and more reliable than the old version. Instead of using one long-running database connection that could crash or freeze under load (which did when I tested it for the recipeingredient table requests), it now uses a MySQL connection pool (which successfully works after multiple tests in Postman), which automatically manages multiple connections and gives each request its own. This prevents those “connection not available” errors and memory issues I encountered. It also closes connections properly after every request to keep things stable. In summary, the 2nd commit version keeps the same features but is written in a cleaner and more efficient way.

References:

https://www.youtube.com/watch?v=jDk95_C5I1s

https://stackoverflow.com/questions/24101056/how-to-use-mysql-connection-db-pool-with-python-flask?utm_source=chatgpt.com

https://www.youtube.com/watch?v=gaOFk3bqM_4

https://muneebdev.com/flask-database-connection-pool/?utm_source=chatgpt.com