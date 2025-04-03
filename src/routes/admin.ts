import { Request, Response, Router } from "express";
import { AuthController } from "../controllers/authController";
import { CodeSchema, ResetPasswordSchema } from "../schemas/user.schema";
import { validateRequestBodyData } from "../middleware/validateRequestData";

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

    router.post('/verification-code', validateRequestBodyData(CodeSchema), authController.verifyCode);

    router.post('/reset-password', validateRequestBodyData(ResetPasswordSchema), authController.resetPassword);

    router.post('/validate-password-token', validateRequestBodyData(CodeSchema), authController.validatePasswordToken);

    return router;
  }
