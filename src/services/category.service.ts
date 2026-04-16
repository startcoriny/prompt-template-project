import categories from '../../data/categories.json';
import type { Category } from '../types/template.types';

const categoryList = categories as Category[];

export function getAllCategories(): Category[] {
  return categoryList;
}

export function getCategoryById(id: string): Category | undefined {
  return categoryList.find((c) => c.id === id);
}
