// Cart types
export type CartState = Record<string, number>;

export type CartLineItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  lineTotal: number;
};

// API types — match Django backend response shapes

export type Category = {
  id: number;
  name: string;
};

export type MenuItem = {
  id: number;
  name: string;
  price: number;
  description: string;
  weight: string;
  image: string;
  category_id: number;
  is_new: boolean;
};

export type SiteSettings = {
  phone: string;
  instagram: string;
  working_hours: string;
  address: string;
};

export type InfoBlock = {
  id: number;
  title: string;
  text: string;
  icon: string;
  type: "info" | "promo";
  order: number;
};
