// Express + EJS front end that talks to the Flask API.
// Pages: /ingredients, /recipes, /recipes/:rid
// No primary keys shown to users; UI uses SKU + ingredient name.

const express = require("express");
const axios = require("axios");
const path = require("path");

const app = express();
const API_BASE = process.env.API_BASE || "http://127.0.0.1:5000";

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public"))); // serves /css/main.css

app.get("/", (req, res) => res.redirect("/ingredients"));

/*  INGREDIENTS */
app.get("/ingredients", async (req, res) => {
  try {
    const { data: ingredients } = await axios.get(`${API_BASE}/api/ingredients`);
    res.render("ingredients", { ingredients, message: null, error: null });
  } catch {
    res.render("ingredients", { ingredients: [], message: null, error: "Failed to load ingredients." });
  }
});

app.post("/ingredients/new", async (req, res) => {
  const sku = (req.body.sku || "").trim();
  const ingredientname = (req.body.ingredientname || "").trim();
  const totalamount = Number(req.body.totalamount || 0);
  try {
    await axios.post(`${API_BASE}/api/ingredients`, { sku, ingredientname, totalamount });
    const { data: ingredients } = await axios.get(`${API_BASE}/api/ingredients`);
    res.render("ingredients", { ingredients, message: "Ingredient added.", error: null });
  } catch (err) {
    const apiErr = err?.response?.data?.error || "Create failed.";
    const { data: ingredients } = await axios.get(`${API_BASE}/api/ingredients`).catch(() => ({ data: [] }));
    res.render("ingredients", { ingredients, message: null, error: apiErr });
  }
});

app.post("/ingredients/:id/update", async (req, res) => {
  const id = req.params.id; // not displayed to user
  const payload = {
    sku: (req.body.sku || "").trim(),
    ingredientname: (req.body.ingredientname || "").trim()
  };
  if (req.body.totalamount !== "") payload.totalamount = Number(req.body.totalamount);
  try {
    await axios.put(`${API_BASE}/api/ingredients/${id}`, payload);
    const { data: ingredients } = await axios.get(`${API_BASE}/api/ingredients`);
    res.render("ingredients", { ingredients, message: "Ingredient updated.", error: null });
  } catch (err) {
    const apiErr = err?.response?.data?.error || "Update failed.";
    const { data: ingredients } = await axios.get(`${API_BASE}/api/ingredients`).catch(() => ({ data: [] }));
    res.render("ingredients", { ingredients, message: null, error: apiErr });
  }
});

app.post("/ingredients/:id/delete", async (req, res) => {
  const id = req.params.id;
  try {
    await axios.delete(`${API_BASE}/api/ingredients/${id}`);
    const { data: ingredients } = await axios.get(`${API_BASE}/api/ingredients`);
    res.render("ingredients", { ingredients, message: "Ingredient deleted.", error: null });
  } catch (err) {
    const apiErr = err?.response?.data?.error || "Delete failed.";
    const { data: ingredients } = await axios.get(`${API_BASE}/api/ingredients`).catch(() => ({ data: [] }));
    res.render("ingredients", { ingredients, message: null, error: apiErr });
  }
});

/*RECIPES*/
app.get("/recipes", async (req, res) => {
  try {
    const { data: recipes } = await axios.get(`${API_BASE}/api/recipes`);
    res.render("recipes", { recipes, message: null, error: null });
  } catch {
    res.render("recipes", { recipes: [], message: null, error: "Failed to load recipes." });
  }
});

app.post("/recipes/new", async (req, res) => {
  const instructions = (req.body.instructions || "").trim();
  try {
    await axios.post(`${API_BASE}/api/recipes`, { instructions });
    const { data: recipes } = await axios.get(`${API_BASE}/api/recipes`);
    res.render("recipes", { recipes, message: "Recipe added.", error: null });
  } catch (err) {
    const apiErr = err?.response?.data?.error || "Create failed.";
    const { data: recipes } = await axios.get(`${API_BASE}/api/recipes`).catch(() => ({ data: [] }));
    res.render("recipes", { recipes, message: null, error: apiErr });
  }
});

app.post("/recipes/:rid/delete", async (req, res) => {
  const rid = req.params.rid;
  try {
    await axios.delete(`${API_BASE}/api/recipes/${rid}`);
    const { data: recipes } = await axios.get(`${API_BASE}/api/recipes`);
    res.render("recipes", { recipes, message: "Recipe deleted.", error: null });
  } catch (err) {
    const apiErr = err?.response?.data?.error || "Delete failed.";
    const { data: recipes } = await axios.get(`${API_BASE}/api/recipes`).catch(() => ({ data: [] }));
    res.render("recipes", { recipes, message: null, error: apiErr });
  }
});

/*RECIPE DETAIL: items, status, cook*/
app.get("/recipes/:rid", async (req, res) => {
  const rid = req.params.rid;
  try {
    const [recipeRes, ingRes, statusRes] = await Promise.all([
      axios.get(`${API_BASE}/api/recipes/${rid}`),
      axios.get(`${API_BASE}/api/ingredients`),
      axios.get(`${API_BASE}/api/recipes/${rid}/status`)
    ]);
    res.render("recipe_edit", {
      recipe: recipeRes.data,
      ingredients: ingRes.data,
      status: statusRes.data,
      message: null,
      error: null
    });
  } catch {
    res.render("recipe_edit", { recipe: null, ingredients: [], status: null, message: null, error: "Failed to load recipe." });
  }
});

app.post("/recipes/:rid/update", async (req, res) => {
  const rid = req.params.rid;
  const instructions = (req.body.instructions || "").trim();
  try {
    await axios.put(`${API_BASE}/api/recipes/${rid}`, { instructions });
    const [recipeRes, ingRes, statusRes] = await Promise.all([
      axios.get(`${API_BASE}/api/recipes/${rid}`),
      axios.get(`${API_BASE}/api/ingredients`),
      axios.get(`${API_BASE}/api/recipes/${rid}/status`)
    ]);
    res.render("recipe_edit", { recipe: recipeRes.data, ingredients: ingRes.data, status: statusRes.data, message: "Instructions updated.", error: null });
  } catch (err) {
    const apiErr = err?.response?.data?.error || "Update failed.";
    const [recipeRes, ingRes, statusRes] = await Promise.allSettled([
      axios.get(`${API_BASE}/api/recipes/${rid}`),
      axios.get(`${API_BASE}/api/ingredients`),
      axios.get(`${API_BASE}/api/recipes/${rid}/status`)
    ]);
    res.render("recipe_edit", { recipe: recipeRes.value?.data || null, ingredients: ingRes.value?.data || [], status: statusRes.value?.data || null, message: null, error: apiErr });
  }
});

app.post("/recipes/:rid/items/add", async (req, res) => {
  const rid = req.params.rid;
  const ingredientid = Number(req.body.ingredientid);
  const amount = Number(req.body.amount);
  try {
    await axios.post(`${API_BASE}/api/recipe-ingredients`, { recipe_id: Number(rid), ingredientid, amount });
    const [recipeRes, ingRes, statusRes] = await Promise.all([
      axios.get(`${API_BASE}/api/recipes/${rid}`),
      axios.get(`${API_BASE}/api/ingredients`),
      axios.get(`${API_BASE}/api/recipes/${rid}/status`)
    ]);
    res.render("recipe_edit", { recipe: recipeRes.data, ingredients: ingRes.data, status: statusRes.data, message: "Ingredient added to recipe.", error: null });
  } catch (err) {
    const apiErr = err?.response?.data?.error || "Add failed.";
    const [recipeRes, ingRes, statusRes] = await Promise.allSettled([
      axios.get(`${API_BASE}/api/recipes/${rid}`),
      axios.get(`${API_BASE}/api/ingredients`),
      axios.get(`${API_BASE}/api/recipes/${rid}/status`)
    ]);
    res.render("recipe_edit", { recipe: recipeRes.value?.data || null, ingredients: ingRes.value?.data || [], status: statusRes.value?.data || null, message: null, error: apiErr });
  }
});

app.post("/recipes/:rid/cook", async (req, res) => {
  const rid = req.params.rid;
  try {
    await axios.post(`${API_BASE}/api/recipes/${rid}/cook`);
    const [recipeRes, ingRes, statusRes] = await Promise.all([
      axios.get(`${API_BASE}/api/recipes/${rid}`),
      axios.get(`${API_BASE}/api/ingredients`),
      axios.get(`${API_BASE}/api/recipes/${rid}/status`)
    ]);
    res.render("recipe_edit", { recipe: recipeRes.data, ingredients: ingRes.data, status: statusRes.data, message: "Cooked successfully; inventory updated.", error: null });
  } catch (err) {
    const apiErr = err?.response?.data?.error || "Cook failed.";
    const shortages = err?.response?.data?.shortages || null;
    const [recipeRes, ingRes, statusRes] = await Promise.allSettled([
      axios.get(`${API_BASE}/api/recipes/${rid}`),
      axios.get(`${API_BASE}/api/ingredients`),
      axios.get(`${API_BASE}/api/recipes/${rid}/status`)
    ]);
    res.render("recipe_edit", {
      recipe: recipeRes.value?.data || null, ingredients: ingRes.value?.data || [], status: statusRes.value?.data || null,
      message: null, error: shortages ? `${apiErr}: see shortages below` : apiErr
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Front-end on http://127.0.0.1:${PORT}`);
  console.log(`Talking to API at ${API_BASE}`);
});
