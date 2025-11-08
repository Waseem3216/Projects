from flask import Flask, request, jsonify, g
import creds
from sql import execute_query, execute_read_query, create_tables
from mysql.connector import pooling

c = creds.Creds()  #Read connection details from a single source
try:
    pool = pooling.MySQLConnectionPool(
        pool_name="recipe_pool",
        pool_size=8,
        pool_reset_session=True,
        host=c.conString,
        user=c.userName,
        password=c.password,
        database=c.dbName
    )
except Exception as e:
    raise SystemExit(f"Cannot start API: database connection pool failed ({e})")

#Ensure all required tables exist before serving requests.
with pool.get_connection() as conn:
    create_tables(conn)

#Create the Flask application instance
app = Flask(__name__)

def get_conn():
    """Get a connection from the pool for each request."""
    if "db" not in g: g.db = pool.get_connection()
    return g.db

@app.teardown_appcontext
def close_conn(exception):
    """Close the pooled connection at the end of each request."""
    db = g.pop("db", None)
    if db is not None: db.close()

def bad(msg, code=400): return jsonify({"error": msg}), code  # Consistent error payload

def json_body():
    """Helper to ensure JSON input."""
    if not request.is_json: return None, bad("Send JSON")
    return request.get_json(), None


#Ingredients
# CRUD endpoints for ingredient inventory. Supports optional 'sku' per item.

@app.get("/api/ingredients")
def ingredients_list():
    """Return all ingredient rows as JSON."""
    rows = execute_read_query(get_conn(),
        "SELECT id, sku, ingredientname, totalamount FROM ingredient ORDER BY ingredientname")
    return jsonify(rows)

@app.post("/api/ingredients")
def ingredients_add():
    """Create a new ingredient."""
    data, err = json_body()
    if err: return err
    name = (data.get("ingredientname") or "").strip()
    sku = (data.get("sku") or "").strip()
    try: total = float(data.get("totalamount", 0))
    except: return bad("totalamount must be a number")
    if not name: return bad("ingredientname is required")
    if total < 0: return bad("totalamount must be >= 0")
    conn = get_conn()
    if execute_read_query(conn, "SELECT id FROM ingredient WHERE ingredientname=%s", (name,)):
        return bad("ingredient already exists", 409)
    if sku and execute_read_query(conn, "SELECT id FROM ingredient WHERE sku=%s", (sku,)):
        return bad("sku already exists", 409)
    q = ("INSERT INTO ingredient (sku, ingredientname, totalamount) VALUES (%s,%s,%s)"
         if sku else "INSERT INTO ingredient (ingredientname, totalamount) VALUES (%s,%s)")
    vals = (sku, name, total) if sku else (name, total)
    if not execute_query(conn, q, vals): return bad("insert failed", 500)
    row = execute_read_query(conn,
        "SELECT id, sku, ingredientname, totalamount FROM ingredient WHERE ingredientname=%s", (name,))
    return jsonify(row[0]), 201

@app.get("/api/ingredients/<int:ing_id>")
def ingredients_get(ing_id):
    """Fetch a single ingredient by primary key id."""
    row = execute_read_query(get_conn(),
        "SELECT id, sku, ingredientname, totalamount FROM ingredient WHERE id=%s", (ing_id,))
    return jsonify(row[0]) if row else bad("not found", 404)

@app.put("/api/ingredients/<int:ing_id>")
def ingredients_update(ing_id):
    """Update fields on an ingredient."""
    data, err = json_body()
    if err: return err
    conn = get_conn()
    if "ingredientname" in data:
        name = (data.get("ingredientname") or "").strip()
        if not name: return bad("ingredientname cannot be empty")
        if execute_read_query(conn,
            "SELECT id FROM ingredient WHERE ingredientname=%s AND id<>%s", (name, ing_id)):
            return bad("name already used", 409)
        execute_query(conn, "UPDATE ingredient SET ingredientname=%s WHERE id=%s", (name, ing_id))
    if "sku" in data:
        sku = (data.get("sku") or "").strip()
        if sku:
            if execute_read_query(conn,
                "SELECT id FROM ingredient WHERE sku=%s AND id<>%s", (sku, ing_id)):
                return bad("sku already used", 409)
            execute_query(conn, "UPDATE ingredient SET sku=%s WHERE id=%s", (sku, ing_id))
        else: execute_query(conn, "UPDATE ingredient SET sku=NULL WHERE id=%s", (ing_id,))
    if "totalamount" in data:
        try: t = float(data.get("totalamount"))
        except: return bad("totalamount must be a number")
        if t < 0: return bad("totalamount must be >= 0")
        execute_query(conn, "UPDATE ingredient SET totalamount=%s WHERE id=%s", (t, ing_id))
    return ingredients_get(ing_id)

@app.delete("/api/ingredients/<int:ing_id>")
def ingredients_delete(ing_id):
    """Delete an ingredient by id."""
    execute_query(get_conn(), "DELETE FROM ingredient WHERE id=%s", (ing_id,))
    return ("", 204)


#Recipes
#Ingredient lines are handled separately

@app.get("/api/recipes")
def recipes_list():
    """Return all recipe rows."""
    rows = execute_read_query(get_conn(),
        "SELECT id, instructions, recipeingredientid FROM recipe ORDER BY id")
    return jsonify(rows)

@app.post("/api/recipes")
def recipes_add():
    """Create a new recipe."""
    data, err = json_body()
    if err: return err
    instr = (data.get("instructions") or "").strip()
    if not instr: return bad("instructions is required")
    conn = get_conn()
    if not execute_query(conn, "INSERT INTO recipe (instructions) VALUES (%s)", (instr,)):
        return bad("insert failed", 500)
    row = execute_read_query(conn,
        "SELECT id, instructions, recipeingredientid FROM recipe ORDER BY id DESC LIMIT 1")
    return jsonify(row[0]), 201

@app.get("/api/recipes/<int:rid>")
def recipes_get(rid):
    """Fetch one recipe by id with line items."""
    conn = get_conn()
    row = execute_read_query(conn,
        "SELECT id, instructions, recipeingredientid FROM recipe WHERE id=%s", (rid,))
    if not row: return bad("not found", 404)
    items = execute_read_query(conn,
        "SELECT ri.id, ri.ingredientid, ri.amount, i.ingredientname "
        "FROM recipeingredient ri JOIN ingredient i ON i.id=i.id "
        "WHERE ri.recipe_id=%s ORDER BY ri.id", (rid,))
    r = row[0]; r["items"] = items
    return jsonify(r)

@app.put("/api/recipes/<int:rid>")
def recipes_update(rid):
    """Update recipe instructions."""
    data, err = json_body()
    if err: return err
    instr = (data.get("instructions") or "").strip()
    if not instr: return bad("instructions cannot be empty")
    if not execute_query(get_conn(),
        "UPDATE recipe SET instructions=%s WHERE id=%s", (instr, rid)):
        return bad("update failed", 500)
    return recipes_get(rid)

@app.delete("/api/recipes/<int:rid>")
def recipes_delete(rid):
    """Delete a recipe and its ingredients."""
    conn = get_conn()
    execute_query(conn, "DELETE FROM recipeingredient WHERE recipe_id=%s", (rid,))
    execute_query(conn, "DELETE FROM recipe WHERE id=%s", (rid,))
    return ("", 204)


#RECIPE-INGREDIENT
#CRUD over lines that connect a recipe to a specific ingredient and amount.

@app.get("/api/recipe-ingredients")
def lines_list():
    """Return all recipe line items."""
    rows = execute_read_query(get_conn(),
        "SELECT id, recipe_id, ingredientid, amount FROM recipeingredient ORDER BY id")
    return jsonify(rows)

@app.post("/api/recipe-ingredients")
def lines_add():
    """Create a new line item associating recipe and ingredient."""
    data, err = json_body()
    if err: return err
    try:
        recipe_id, ingredientid, amount = int(data["recipe_id"]), int(data["ingredientid"]), float(data["amount"])
    except: return bad("recipe_id/ingredientid must be ints; amount a number")
    if amount <= 0: return bad("amount must be > 0")
    conn = get_conn()
    if not execute_read_query(conn, "SELECT id FROM recipe WHERE id=%s", (recipe_id,)):
        return bad("recipe_id does not exist")
    if not execute_read_query(conn, "SELECT id FROM ingredient WHERE id=%s", (ingredientid,)):
        return bad("ingredientid does not exist")
    if not execute_query(conn,
        "INSERT INTO recipeingredient (recipe_id, ingredientid, amount) VALUES (%s,%s,%s)",
        (recipe_id, ingredientid, amount)):
        return bad("insert failed", 500)
    row = execute_read_query(conn,
        "SELECT id, recipe_id, ingredientid, amount FROM recipeingredient ORDER BY id DESC LIMIT 1")
    return jsonify(row[0]), 201

@app.get("/api/recipe-ingredients/<int:line_id>")
def lines_get(line_id):
    """Fetch a single line item by id."""
    row = execute_read_query(get_conn(),
        "SELECT id, recipe_id, ingredientid, amount FROM recipeingredient WHERE id=%s", (line_id,))
    return jsonify(row[0]) if row else bad("not found", 404)

@app.put("/api/recipe-ingredients/<int:line_id>")
def lines_update(line_id):
    """Update fields on a line item."""
    data, err = json_body()
    if err: return err
    conn = get_conn()
    if "ingredientid" in data:
        try: new_ing = int(data.get("ingredientid"))
        except: return bad("ingredientid must be int")
        if not execute_query(conn,
            "UPDATE recipeingredient SET ingredientid=%s WHERE id=%s", (new_ing, line_id)):
            return bad("update ingredientid failed", 500)
    if "amount" in data:
        try: new_amt = float(data.get("amount"))
        except: return bad("amount must be number")
        if new_amt <= 0: return bad("amount must be > 0")
        if not execute_query(conn,
            "UPDATE recipeingredient SET amount=%s WHERE id=%s", (new_amt, line_id)):
            return bad("update amount failed", 500)
    return lines_get(line_id)

@app.delete("/api/recipe-ingredients/<int:line_id>")
def lines_delete(line_id):
    """Delete a line item."""
    execute_query(get_conn(), "DELETE FROM recipeingredient WHERE id=%s", (line_id,))
    return ("", 204)


# COOKING WORKFLOW
# Validate whether a recipe can be cooked and perform the deduction when allowed.

def check_status(recipe_id):
    """Determine if a recipe can be cooked with current inventory."""
    items = execute_read_query(get_conn(),
        "SELECT ri.ingredientid, ri.amount, i.ingredientname, i.totalamount "
        "FROM recipeingredient ri JOIN ingredient i ON i.id=ri.ingredientid WHERE ri.recipe_id=%s", (recipe_id,))
    if not items: return {"can_cook": False, "shortages": [{"ingredientname":"no items","need":1,"have":0}]}
    shortages = [{"ingredientid":it["ingredientid"],"ingredientname":it["ingredientname"],
                  "have":float(it["totalamount"]),"need":float(it["amount"]),
                  "missing":round(float(it["amount"])-float(it["totalamount"]),4)}
                 for it in items if float(it["totalamount"])<float(it["amount"])]
    return {"can_cook":not shortages,"shortages":shortages}

@app.get("/api/recipes/<int:rid>/status")
def status(rid):
    """Return whether the given recipe can be cooked right now."""
    if not execute_read_query(get_conn(), "SELECT id FROM recipe WHERE id=%s", (rid,)):
        return bad("not found", 404)
    result = check_status(rid)
    return jsonify({"recipe_id": rid, **result})

@app.post("/api/recipes/<int:rid>/cook")
def cook(rid):
    """Deduct inventory based on the recipe's lines if allowed."""
    conn = get_conn()
    if not execute_read_query(conn, "SELECT id FROM recipe WHERE id=%s", (rid,)):
        return bad("not found", 404)
    result = check_status(rid)
    if not result["can_cook"]:
        return jsonify({"error": "Cannot cook", "shortages": result["shortages"]}), 409
    items = execute_read_query(conn,
        "SELECT ingredientid, amount FROM recipeingredient WHERE recipe_id=%s", (rid,))
    for it in items:
        execute_query(conn,
            "UPDATE ingredient SET totalamount=totalamount-%s WHERE id=%s",
            (float(it["amount"]), int(it["ingredientid"])))
    return jsonify({"message": "Cooked; inventory updated"})


print("Recipe API on http://127.0.0.1:5000")
app.run(debug=True)  #Runs Flask’s dev server with debug enabled.