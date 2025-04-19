import { Router } from 'express';
import usersRouter from './users';
import adminRouter from './admin';
import recipesRouter from './recipes';
import authRouter from './auth';

const router = Router();

router.use('/users', usersRouter);
router.use('/admin', adminRouter);
router.use('/recipes', recipesRouter);
router.use('/auth', authRouter);

export default router;