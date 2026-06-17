import { Request, Response, NextFunction } from 'express';
import { loginSchema } from './auth.schema';
import { login } from './auth.service';

export async function handleLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = loginSchema.parse(req.body);
    const result = await login(input);
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
}
