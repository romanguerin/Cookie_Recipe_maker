let recipesJson = {};
let pairingsJson = {};
let jsonString1 = "";
let jsonString2 = "";
let recipes = [];
let pairings = [];
let allIngredients = [];
let population = [];
let populationSize = 50;
let recipe_number = 0;
let history = [];
let bg;
let fontRegular, fontBold;

function preload() {
  //load json
  recipesJson = loadJSON("recipes.json");
  pairingsJson = loadJSON("pairings.json");
  //load font
  fontRegular = loadFont('font/Nunito-Regular.ttf');
  fontBold = loadFont('font/Calligraffitti-Regular.ttf');
}

function setup() {
  bg = loadImage('image/book.PNG');
  createCanvas(1280, 720);
  jsonString1 = JSON.stringify(recipesJson);
  recipes = recipesJson.recipes;

  //extract pairings
  jsonString2 = JSON.stringify(pairingsJson);
  pairings = pairingsJson.pairings;

  // extract all of the ingredients from the inspiring set
  for (const r of recipes) {
    //The for...of statement creates a loop iterating over iterable objects
    for (const i of r.ingredients) {
      allIngredients.push(i);
    }
  }

  // create an initial population
  for (let i = 0; i < populationSize; i++) {
    population.push(random(recipes));
  }
  evaluateRecipes(population);
  population.sort((a, b) => b.fitness - a.fitness);
  frameRate(2);

}

//fitness function
function evaluateRecipes(recipes) {

  for (const rec of recipes) {
    const ingredients = rec.ingredients;
    rec.fitness = 0;

    let flour         = countOccurences(ingredients, 'flour');
    let sugar         = countOccurences(ingredients, 'sugar');
    let bindingAgent  = countOccurences(ingredients, 'binding agent');
    let fat           = countOccurences(ingredients, 'fat');
    let spices        = countOccurences(ingredients, 'spice');
    let salt          = countOccurences(ingredients, 'salt');
    let toppings      = countOccurences(ingredients, 'topping');

    //select main
    let main = selectMain(toppings,spices,ingredients);

    if(flour === 1){
      rec.fitness += 2;
    }
    if(flour > 1){
      rec.fitness -= 3;
    }

    if(fat === 1){
      rec.fitness += 2;
    }
    if(fat > 1){
      rec.fitness -= 3;
    }

    if(sugar > 0 && sugar < 3){
      rec.fitness += 3;
    }
    if(sugar > 2){
      rec.fitness -= 3;
    }

    if(bindingAgent === 1){
      rec.fitness += 2;
    }
    if(bindingAgent > 1){
      rec.fitness -= 3;
    }

    if(spices <= 3){
      rec.fitness += 2;
    }
    if(spices > 3){
      rec.fitness -= 3;
    }

    if(salt <= 1){
      rec.fitness += 2;
    }
    if(salt > 1){
      rec.fitness -= 3;
    }

    if(toppings > 2){
      rec.fitness -= 4;
    }

    if(rec.ingredients.length > 10){
      rec.fitness -= 10;
    }

    let vanillaSugar = ingredients.find(obj => obj.ingredient == 'vanilla sugar');
    if(vanillaSugar){
      if(vanillaSugar.amount <= 24){
        rec.fitness -= 2;
      }
    }

    for(const ing of ingredients){
      //select pair
      if (main !== undefined) {
        selectPair(rec, ing, main);
      }

      //switcher
      selectAmount(rec,ing);

      //not to many tea spoons of ingredients
      if(ing.unit === 'ts' && parseFloat(ing.amount) > 10){
        rec.fitness -= 1;
      }
      //to less gram of ingredients
      if(ing.unit === 'g' && parseFloat(ing.amount) < 10){
        rec.fitness -= 1;
      }
      //to less gram of ingredients
      if(ing.unit === 'u' && parseFloat(ing.amount) > 5){
        rec.fitness -= 5;
      }
    }
  }
}

function selectMain(toppings,spices,ingredients){
  //who wins?
  let master = toppings > spices;
  let arrIn = [];
  let arrOut = [];
  let main;

  //choose pair
  for(const ing of ingredients){
    if(master){
      if(ing.type === "topping"){
        arrIn.push(ing.ingredient);
      }
    } else {
      if(ing.type === "spice"){
        arrIn.push(ing.ingredient);
      }
    }
  }

  for (let j = 0; j < pairings.length; j++) {
    for (let i = 0; i < arrIn.length; i++) {
      if(arrIn[i].includes(pairings[j].name)) {
        arrOut.push(pairings[j].name);
      }
    }
  }

  if (arrOut.length > 0){
    let rand = floor(random(0,arrOut.length));
    main = arrOut[rand];
  }
  return main;
}

function selectAmount(rec,ing){

  if(ing.type === 'fat' && parseFloat(ing.amount) < 300){
    rec.fitness += 1;
  }
  //Ingredient includes ‘floar’
  if(ing.type === 'flour' && parseFloat(ing.amount) > 50 && parseFloat(ing.amount) < 300){
    rec.fitness += 1;
  }

  //Ingredient includes ‘butter’
  if(ing.type === 'sugar' && parseFloat(ing.amount) > 100){
    rec.fitness -= 1;
  }

  //Ingredient includes ‘butter’
  if(ing.type === 'topping' && parseFloat(ing.amount) > 200){
    rec.fitness -= 1;
  }

}

function selectPair(rec, ing, main) {
  for (const pair of pairings) {
    if(pair.name.includes(main)){
      const pairing = pair.combinations;
      for (const pa of pairing) {
        for (const p of pa){
          if (ing.ingredient.includes(p)) {
            if(ing.ingredient.includes('chocolate')){
              rec.fitness -= 1;
            }
            rec.fitness += 1;
          }
        }
      }
    }
  }
}

// Implements a roulette wheel selection
function selectRecipe(recipes) {
  let sum = recipes.reduce((a, r) => a + r.fitness, 0);
  // choose a random number less than the sum of fitnesses
  let f = int(random(sum));
  // iterate through all items in the recipes
  for (const r of recipes) {
    // if f is less than a recipe's fitness, return it
    if (f < r.fitness) return r;
    // otherwise subtract the recipe's fitness from f
    f -= r.fitness;
  }
  // if no recipe has been returned, return the last one
  return recipes[recipes.length - 1];
}

function generateRecipes(size, population) {
  let R = [];
  //array R to hold the generated recipes
  while (R.length < size) {
    //loop over the generation process until we have created the number of recipes requested,
    let r1 = selectRecipe(population);
    let r2 = selectRecipe(population);
    let r = crossoverRecipes(r1, r2);
    mutateRecipe(r);
    normaliseRecipe(r);
    R.push(r);
  }
  evaluateRecipes(R);
  return R;
}

function selectPopulation(P, R) {
  R.sort((a, b) => b.fitness - a.fitness);
  P = P.slice(0, P.length/2).concat(R.slice(0, R.length/2));
  P.sort((a, b) => b.fitness - a.fitness);
  return P;
}

function update() {
  let R = generateRecipes(populationSize, population);
  population = selectPopulation(population, R);
}

function draw() {
  update();
  background(bg);
  history.push(population[0].fitness);
  fill(90, 62, 58);
  noStroke();
  textFont(fontRegular);

  let recipe_pop = population[0].name + "\n";
  let recipe_text = "Ingredients:"+"\n";
  let title = mainTitle(population[0]) +" cookie";

  console.log(recipe_pop, "max. fitness = " + history[history.length - 1]);

  for (let i of population[0].ingredients) {
    recipe_text += listItem(i);
  }
  textFont(fontBold);

  //left page
  textSize(width * 0.025);
  text(title, width * 0.1, height * 0.1);
  textSize(width * 0.015);
  text(recipe_text, width * 0.1, height* 0.175);

  //right page
  textSize(width * 0.015);
  let preparation_text = "Preparation:" + "\n" + generateCookieRecipe();
  text(preparation_text, width * 0.55, height * 0.1);
}


function mainTitle(pop){
  let mainNumber = 0;
  let mainType;
  let adjective = "Nice ";
  for (const ing of pop.ingredients){
    if(ing.type === "spice" || ing.type === "topping"){
      if (ing.amount > mainNumber){
        mainNumber = ing.amount;
        mainType = ing.ingredient;
      }
    }
  }
  if (mainType.includes("vanilla")){
    mainType = "vanilla"
  }
  if (mainType.includes("cocoa")){
    mainType = "cocoa"
  }
  if (mainNumber < 75){
    adjective = "Mild ";
  } else if (mainNumber < 140){
    adjective = "Sweet ";
  } else if (mainNumber < 190){
    adjective = "Nice ";
  } else {
    adjective = "Strong ";
  }
  return adjective + mainType;
}

function crossoverRecipes(r1, r2) {
  // choose crossover point in r1
  let p1 = int(random(r1.ingredients.length));
  //random in the ingridiant length
  // choose crossover point in r2
  let p2 = int(random(r2.ingredients.length));
  // get first ingredient sublist from r1
  let r1a = r1.ingredients.slice(0, p1);
  // get second ingredient sublist from r2
  let r2b = r2.ingredients.slice(p2);
  // create a new recipe
  let r = {};
  // add a default name
  r.name = "recipe " + recipe_number++;
  // add ingredients from sublists
  r.ingredients = r1a.concat(r2b);
  return r;
}

function mutateRecipe(r) {
  switch (int(random(4))) {
    case 0:
      // select a random ingredient
      let i = int(random(r.ingredients.length));
      // make a copy of the ingredient
      r.ingredients[i] = Object.assign({}, r.ingredients[i]);
      // change the amount of the ingredient by a small amount
      r.ingredients[i].amount += int(r.ingredients[i].amount * 0.1);
      // check that the amount is at least 1
      r.ingredients[i].amount = max(1, r.ingredients[i].amount);
      break;
    case 1:
      // select a random ingredient
      let j = random(r.ingredients.length);
      // make a copy of the ingredient
      r.ingredients[j] = Object.assign({}, r.ingredients[j]);
      // change the ingredient by selecting from all ingredients
      r.ingredients[j].ingredient = random(allIngredients).ingredient;
      break;
    case 2:
      // add an ingredient from all ingredients
      r.ingredients.push(random(allIngredients));
      break;
    case 3:
          // remove an ingredient
      if (r.ingredients.length > 1) {
        r.ingredients.splice(random(r.ingredients.length), 1);
      }
      break;
  }
}

function normaliseRecipe(r) {
  // before normalising the ingredient amounts
  // reformulate the recipe into unique ingredients
  let uniqueIngredientMap = new Map();
  for (const i of r.ingredients) {
    // if the map already has the ingredient add the amount
    if (uniqueIngredientMap.has(i.ingredient)) {
      let n = uniqueIngredientMap.get(i.ingredient);
      n.amount += i.amount;
    } else { // otherwise add a copy of the ingredient
      uniqueIngredientMap.set(i.ingredient, Object.assign({}, i));
    }
  }
  r.ingredients = Array.from(uniqueIngredientMap.values());

  // calculate the sum of all of the ingredient amounts
  let sum = r.ingredients.reduce((a, i) => a + i.amount, 0);
  // calculate the scaling factor to 1L of soup (ingredients)
  let scale = 600 / sum;
  // rescale all of the ingredient amounts

  for (let i of r.ingredients) {
    i.amount = max(1, int(i.amount * scale));

  }

}

function countOccurences(array, word){
  return array.filter((obj) => obj.type === word).length;
}

function generateCookieRecipe(){
  preparation = "";
  let step = 1;
  const ingredients = population[0].ingredients

  preparation += "\n"+ step + ". " + "Preheat the oven to 180 °C.";

  step++;

  let vanillaSticks = ingredients.find(obj => obj.ingredient == 'vanilla sticks' && obj.type == 'spice');
  if(vanillaSticks){
    preparation += "\n" + step + ". " + "Halve the vanilla stick lengthwise \n and scrape out the marrow with a knife tip.";
    step++;
  }

  let lemon = ingredients.find(obj => obj.ingredient == 'lemon' && obj.type == 'spice');
  if(lemon){
    preparation += "\n" + step + ". " + "Grate the zest of" + " " + lemon.amount + " " + lemon.ingredient + "(s)";
    step++;
  }

  let orange = ingredients.find(obj => obj.ingredient == 'orange' && obj.type == 'spice');
  if(orange){
    preparation += "\n" + step + ". " + "Grate the zest of" + " " + orange.amount + " " + orange.ingredient + "(s)";
    step++;
  }

  preparation += "\n"+ step + ". " + "In a bowl, mix together:"

  const fats = ingredients.filter(ingredient => ingredient.type == 'fat');
  if(fats.length > 0){
    fats.forEach(function(fat, i){
      preparation += listItem(fat);
    })
  }

  const sugars = ingredients.filter(ingredient => ingredient.type == 'sugar');
  if(sugars.length > 0){
    sugars.forEach(function(sugar, i){
      preparation += listItem(sugar);
    })
  }

  step++;

  const bindingAgents = ingredients.filter(ingredient => ingredient.type == 'binding agent');
  if(bindingAgents){
    preparation += "\n" + step + ". " +"Whisk in:";

    bindingAgents.forEach(function(agent, i){
      preparation += listItem(agent);
    })

    step++;
  }

  preparation += "\n" + step + ". "+"Mix to a smooth batter:";

  const flours = ingredients.filter(ingredient => ingredient.type == 'flour');
  if(flours.length > 0){
    flours.forEach(function(flour, i){
      preparation += listItem(flour);
    })
  }

  const risingAgents = ingredients.filter(ingredient => ingredient.type == 'rising agent');
  if(risingAgents.length > 0){
    risingAgents.forEach(function(risingAgent, i){
      preparation += listItem(risingAgent);
    })
  }

  const salts = ingredients.filter(ingredient => ingredient.type == 'salt');
  if(salts.length > 0){
    salts.forEach(function(salt, i){
      preparation += listItem(salt);
    })
  }

  const spices = ingredients.filter(ingredient => ingredient.type == 'spice');
  if(spices.length > 0){
    spices.forEach(function(spice, i){
      if(spice.ingredient === 'lemon'){
        preparation += "\n"+ " - " + "lemon zest";
        return;
      }

      if(spice.ingredient === 'orange'){
        preparation += "\n"+ " - " + "orange zest";
        return;
      }

      if(spice.ingredient === 'vanilla sticks'){
        preparation += "\n"+ " - " + "vanilla marrow";
        return;
      }

      preparation += listItem(spice);
    })
  }

  step++;

  preparation += "\n" + step + ". " + "Chop up and fold into the mixture:";

  const toppings = ingredients.filter(ingredient => ingredient.type === 'topping');
  if(toppings.length > 0){
    toppings.forEach(function(topping, i){
      preparation += listItem(topping);
    })
  }

  step++;

  preparation += "\n" + step + ". " + "Leave to cool in the fridge for 15 minutes.";

  step++;

  preparation += "\n" + step + ". " + "Divide the mixture into 24 dough balls on a baking sheet.";

  step++;

  let dust = ingredients.find(obj => obj.ingredient === 'powdered sugar' && obj.type === "decoration");
  if(dust){
    preparation += "\n" + step + ". " +"Using a sieve, dust " + dust.amount + " " + dust.unit + " " + dust.ingredient;
    step++;
  }

  preparation += "\n" + step + ". " + "Bake for 15-20 minutes in the oven. Let cool down.";

  step++;

  let icing = ingredients.find(obj => obj.ingredient === 'powdered sugar' && obj.type === "icing");
  if(icing){
    preparation += "\n" + step + ". " + " Stir " + icing.amount + " " + icing.unit + " " + icing.ingredient +" with 1-2 tbsp water to glaze it.";
    step++;
    preparation += "\n" + step + ". " + "Sprinkle the cookies with the glaze.";
  }

  return preparation;
}

function listItem(i){
  let round;
  if (i.unit === "g") {
    round = ceil(i.amount/10)*10;
  } else {
    round = i.amount;
  }
  return "\n" +"- " + round + " " + i.unit + " " + i.ingredient;
}
