export type SushiMenuItem = {
  id: string;
  name: string;
  price: number;
  ingredients: string[];
  image: string;
  category: "sushi" | "sets" | "sauces" | "drinks";
};

export const sushiMenuItems: SushiMenuItem[] = [
  // SUSHI
  {
    id: "salmon-delight",
    name: "Salmon Delight Roll",
    price: 12.9,
    ingredients: ["Salmon", "Avocado", "Cucumber", "Sesame"],
    image: "/sushi/salmon-delight.svg",
    category: "sushi"
  },
  {
    id: "tuna-crunch",
    name: "Tuna Crunch Roll",
    price: 13.5,
    ingredients: ["Tuna", "Tempura Flakes", "Spicy Mayo", "Nori"],
    image: "/sushi/tuna-crunch.svg",
    category: "sushi"
  },
  {
    id: "shrimp-tempura",
    name: "Shrimp Tempura Roll",
    price: 14.2,
    ingredients: ["Shrimp Tempura", "Carrot", "Cucumber", "Eel Sauce"],
    image: "/sushi/shrimp-tempura.svg",
    category: "sushi"
  },
  {
    id: "veggie-garden",
    name: "Veggie Garden Roll",
    price: 10.8,
    ingredients: ["Avocado", "Cucumber", "Carrot", "Cream Cheese"],
    image: "/sushi/veggie-garden.svg",
    category: "sushi"
  },
  {
    id: "dragon-roll",
    name: "Dragon Roll",
    price: 15.4,
    ingredients: ["Eel", "Avocado", "Cucumber", "Unagi Sauce"],
    image: "/sushi/dragon-roll.svg",
    category: "sushi"
  },
  {
    id: "spicy-salmon",
    name: "Spicy Salmon Roll",
    price: 13.8,
    ingredients: ["Salmon", "Sriracha", "Spring Onion", "Nori"],
    image: "/sushi/spicy-salmon.svg",
    category: "sushi"
  },
  // SETS
  {
    id: "classic-set",
    name: "Classic Set",
    price: 28.5,
    ingredients: ["16 pcs", "Salmon Nigiri", "Tuna Roll", "California Roll"],
    image: "/sushi/salmon-delight.svg",
    category: "sets"
  },
  {
    id: "family-set",
    name: "Family Set",
    price: 42.0,
    ingredients: ["32 pcs", "Dragon Roll", "Philadelphia", "Tempura Mix"],
    image: "/sushi/dragon-roll.svg",
    category: "sets"
  },
  {
    id: "love-set",
    name: "Love Set",
    price: 35.0,
    ingredients: ["24 pcs", "Heart-shaped", "Salmon", "Avocado"],
    image: "/sushi/veggie-garden.svg",
    category: "sets"
  },
  // SAUCES
  {
    id: "soy-sauce",
    name: "Soy Sauce",
    price: 1.5,
    ingredients: ["Classic Japanese soy sauce", "50ml"],
    image: "/sushi/tuna-crunch.svg",
    category: "sauces"
  },
  {
    id: "spicy-mayo-sauce",
    name: "Spicy Mayo",
    price: 2.0,
    ingredients: ["Creamy spicy mayonnaise", "50ml"],
    image: "/sushi/spicy-salmon.svg",
    category: "sauces"
  },
  {
    id: "unagi-sauce",
    name: "Unagi Sauce",
    price: 2.5,
    ingredients: ["Sweet eel glaze", "50ml"],
    image: "/sushi/shrimp-tempura.svg",
    category: "sauces"
  },
  // DRINKS
  {
    id: "green-tea",
    name: "Green Tea",
    price: 3.5,
    ingredients: ["Hot Japanese green tea", "300ml"],
    image: "/sushi/veggie-garden.svg",
    category: "drinks"
  },
  {
    id: "coca-cola",
    name: "Coca-Cola",
    price: 3.0,
    ingredients: ["Classic Coke", "330ml can"],
    image: "/sushi/salmon-delight.svg",
    category: "drinks"
  },
  {
    id: "sparkling-water",
    name: "Sparkling Water",
    price: 2.5,
    ingredients: ["Mineral sparkling water", "500ml"],
    image: "/sushi/tuna-crunch.svg",
    category: "drinks"
  }
];
