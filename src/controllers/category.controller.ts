import { Request, Response } from 'express';
import { getAllCategories } from '../services/category.service';

export function getCategories(req: Request, res: Response): void {
  const categories = getAllCategories();
  res.json(categories);
}
