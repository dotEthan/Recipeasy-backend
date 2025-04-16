import { Request, Response, Router } from "express";
import { AuthController } from "../controllers/authController";
import { CodeSchema, ResetPasswordSchema } from "../schemas/user.schema";
import { validateRequestBodyData } from "../middleware/validateRequestData";

    // TODO RESTFULy id resource in url
  export default function createAdminRouter(authController: AuthController) {
    const router = Router();
    router.get('/csrf-token', (req: Request, res: Response) => {
        console.log('CSurfing')
        res.cookie('csrftoken', req.csrfToken(), { 
            httpOnly: true,
            secure: true,
            sameSite: 'strict' 
        });
        // TODO check why two csrf tokens, doubling due to res?
        res.json({ csrfToken: req.csrfToken() }); 
    });

    
    router.get('/check-session', (req: Request, res: Response) => {
      console.log('checking session is Autheticated: ', req.isAuthenticated());
      if (req.isAuthenticated()) {
        res.json({ success: true, data: req.user});
      } else {
        res.status(401).json({success: false, message: 'User Not Autheticated'})
      }
    });

    router.get('/validate-password-token', validateRequestBodyData(CodeSchema), authController.validatePasswordToken);

    router.post('/verification-code', validateRequestBodyData(CodeSchema), authController.verifyCode);

    router.post('/reset-password', validateRequestBodyData(ResetPasswordSchema), authController.resetPassword);

    router.post('/validate-password-token', validateRequestBodyData(CodeSchema), authController.validatePasswordToken);

    return router;
  }
