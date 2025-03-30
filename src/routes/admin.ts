import { Request, Response, Router } from "express";
import { AuthController } from "../controllers/authController";

  export default function createAdminRouter(authController: AuthController) {
    const router = Router();
    router.get('/csrf-token', (req: Request, res: Response) => {
        console.log('setting token')
        res.cookie('csrftoken', req.csrfToken(), { 
            httpOnly: true,
            secure: true,
            sameSite: 'strict' 
        });
        // Optionally return the token (not required if using cookie)  
        res.json({ csrfToken: req.csrfToken() }); 
    });

    router.get('/verification-code', authController.verifyCode);

    return router;
  }
