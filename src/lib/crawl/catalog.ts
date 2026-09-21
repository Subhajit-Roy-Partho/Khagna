import type { CatalogEntry } from "./types";

// Common grocery queries crawled for Tempe stores. `query` is what we type into
// the retailer's search box; the name_* fields seed our item catalog (with
// Bengali + alt names where relevant) when an item doesn't exist yet.
export const CATALOG: CatalogEntry[] = [
  { key: "milk", query: "whole milk gallon", name_en: "Whole Milk (1 gal)", name_bn: "দুধ", name_alt: "milk gallon", category: "dairy", base_unit: "piece" },
  { key: "eggs", query: "large eggs 12 count", name_en: "Eggs (12 pc)", name_bn: "ডিম", name_alt: "dim dozen anda", category: "dairy", base_unit: "piece" },
  { key: "basmati", query: "basmati rice", name_en: "Basmati Rice", name_bn: "বাসমতী চাল", name_alt: "long grain rice", category: "grocery", base_unit: "kg" },
  { key: "atta", query: "atta flour", name_en: "Whole Wheat Flour (Atta)", name_bn: "আটা", name_alt: "atta moyda flour", category: "grocery", base_unit: "kg" },
  { key: "masoor", query: "red lentils", name_en: "Red Lentils (Masoor Dal)", name_bn: "মসুর ডাল", name_alt: "masoor dal", category: "grocery", base_unit: "kg" },
  { key: "chana", query: "canned chickpeas", name_en: "Chickpeas (Chana)", name_bn: "ছোলা", name_alt: "chana kabuli", category: "grocery", base_unit: "kg" },
  { key: "chicken", query: "boneless chicken breast", name_en: "Chicken Breast (boneless)", name_bn: "মুরগির মাংস", name_alt: "murgi chicken", category: "meat", base_unit: "kg" },
  { key: "banana", query: "bananas", name_en: "Bananas", name_bn: "কলা", name_alt: "kola", category: "produce", base_unit: "kg" },
  { key: "onion", query: "yellow onions", name_en: "Yellow Onions", name_bn: "পেঁয়াজ", name_alt: "peyaj", category: "produce", base_unit: "kg" },
  { key: "potato", query: "russet potatoes", name_en: "Russet Potatoes", name_bn: "আলু", name_alt: "alu", category: "produce", base_unit: "kg" },
  { key: "tomato", query: "roma tomatoes", name_en: "Roma Tomatoes", name_bn: "টমেটো", name_alt: "tomato", category: "produce", base_unit: "kg" },
  { key: "mustard-oil", query: "mustard oil", name_en: "Mustard Oil", name_bn: "সরষের তেল", name_alt: "sorser tel", category: "grocery", base_unit: "kg" },
  { key: "sugar", query: "granulated sugar", name_en: "Granulated Sugar", name_bn: "চিনি", name_alt: "chini", category: "grocery", base_unit: "kg" },
  { key: "salt", query: "iodized salt", name_en: "Iodized Salt", name_bn: "লবণ", name_alt: "lobon noon", category: "grocery", base_unit: "kg" },
  { key: "tea", query: "black tea bags", name_en: "Black Tea", name_bn: "চা", name_alt: "cha", category: "grocery", base_unit: "kg" },
  { key: "coffee", query: "ground coffee", name_en: "Ground Coffee", name_bn: "কফি", name_alt: "coffee", category: "grocery", base_unit: "kg" },
  { key: "bread", query: "whole wheat bread", name_en: "Whole Wheat Bread", name_bn: "পাউরুটি", name_alt: "pawruti", category: "bakery", base_unit: "piece" },
  { key: "butter", query: "salted butter", name_en: "Salted Butter", name_bn: "মাখন", name_alt: "makhon", category: "dairy", base_unit: "kg" },
  { key: "yogurt", query: "plain yogurt", name_en: "Plain Yogurt", name_bn: "দই", name_alt: "doi curd", category: "dairy", base_unit: "kg" },
  { key: "honey", query: "raw honey", name_en: "Raw Honey", name_bn: "মধু", name_alt: "modhu", category: "grocery", base_unit: "kg" },
  { key: "oats", query: "old fashioned oats", name_en: "Rolled Oats", name_bn: "ওটস", name_alt: "oatmeal", category: "grocery", base_unit: "kg" },
  { key: "turmeric", query: "turmeric powder", name_en: "Turmeric Powder (Haldi)", name_bn: "হলুদ", name_alt: "holud haldi", category: "spices", base_unit: "kg" },
  { key: "cumin", query: "cumin powder", name_en: "Cumin Powder (Jeera)", name_bn: "জিরা", name_alt: "jeera", category: "spices", base_unit: "kg" },
  { key: "chili", query: "chili powder", name_en: "Red Chili Powder", name_bn: "লাল লঙ্কা গুঁড়ো", name_alt: "lal lonka mirch", category: "spices", base_unit: "kg" },
];
