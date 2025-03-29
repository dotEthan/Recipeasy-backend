import { Request, Response, Router } from "express";

  export default function createAdminRouter() {
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
    return router;
  }