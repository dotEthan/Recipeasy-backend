import { Request, Response } from "express";
import { UserService } from "../services/userService";

export class UserController {
    private userService: UserService;

    constructor(userService: UserService) {
        this.userService = userService;
        this.getUser = this.getUser.bind(this);
        this.updateUser = this.updateUser.bind(this);
    }


    public async getUser(req: Request, res: Response): Promise<void> {
        try {
            console.log('getting User Body: ', req.body);
            return req.body;
        } catch(error: unknown) {
            console.log('Error Getting User: ', error);
            // Todo Look into which errors wont be an instance of error and address here
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            // TODO get correct erorr messages to diferentiate
            if (errorMessage === 'User does not exist') {
                res.status(404).json({ success: false, message: errorMessage});
                return;
            }
            res.status(500).json({success: false, message: errorMessage});
        }
    }

    public async updateUser(req: Request, res: Response): Promise<void> {
        try {
            console.log('getting User Body: ', req.body);
            return req.body;
        } catch(error: unknown) {
            console.log('Error Updating User: ', error);
            // Todo Look into which errors wont be an instance of error and address here
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            // TODO get correct erorr messages to diferentiate
            if (errorMessage === 'User does not exist') {
                res.status(404).json({ success: false, message: errorMessage});
                return;
            }
            res.status(500).json({success: false, message: errorMessage});
        }
    }
}
