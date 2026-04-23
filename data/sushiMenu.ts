export type SushiMenuItem = {
  id: string;
  name: string;
  price: number;
  ingredients: string[];
  image: string;
};

export const sushiMenuItems: SushiMenuItem[] = [
  {
    id: "salmon-delight",
    name: "Salmon Delight Roll",
    price: 12.9,
    ingredients: ["Salmon", "Avocado", "Cucumber", "Sesame"],
    image: "/sushi/salmon-delight.svg"
  },
  {
    id: "tuna-crunch",
    name: "Tuna Crunch Roll",
    price: 13.5,
    ingredients: ["Tuna", "Tempura Flakes", "Spicy Mayo", "Nori"],
    image: "/sushi/tuna-crunch.svg"
  },
  {
    id: "shrimp-tempura",
    name: "Shrimp Tempura Roll",
    price: 14.2,
    ingredients: ["Shrimp Tempura", "Carrot", "Cucumber", "Eel Sauce"],
    image: "/sushi/shrimp-tempura.svg"
  },
  {
    id: "veggie-garden",
    name: "Veggie Garden Roll",
    price: 10.8,
    ingredients: ["Avocado", "Cucumber", "Carrot", "Cream Cheese"],
    image: "/sushi/veggie-garden.svg"
  },
  {
    id: "dragon-roll",
    name: "Dragon Roll",
    price: 15.4,
    ingredients: ["Eel", "Avocado", "Cucumber", "Unagi Sauce"],
    image: "/sushi/dragon-roll.svg"
  },
  {
    id: "spicy-salmon",
    name: "Spicy Salmon Roll",
    price: 13.8,
    ingredients: ["Salmon", "Sriracha", "Spring Onion", "Nori"],
    image: "/sushi/spicy-salmon.svg"
  }
];
