-- I ran this in MySQL Workbench
CREATE DATABASE IF NOT EXISTS recipe_db;
USE recipe_db;

CREATE TABLE IF NOT EXISTS ingredient (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ingredientname VARCHAR(120) NOT NULL UNIQUE,
  totalamount DOUBLE NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS recipe (
  id INT AUTO_INCREMENT PRIMARY KEY,
  instructions TEXT NOT NULL,
  recipeingredientid INT
);

CREATE TABLE IF NOT EXISTS recipeingredient (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ingredientid INT NOT NULL,
  amount DOUBLE NOT NULL,
  recipe_id INT NOT NULL,
  CONSTRAINT fk_ri_ingredient FOREIGN KEY (ingredientid) REFERENCES ingredient(id),
  CONSTRAINT fk_ri_recipe FOREIGN KEY (recipe_id) REFERENCES recipe(id)
);
