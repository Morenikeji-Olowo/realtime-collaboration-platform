import * as authService from '../services/auth.service.js';

export async function signUp(req, res, next) {
    try{
        const {name, password, email} = req.body;

        const data = await authService.signUp({
            email,
            password,
            name
        });
        return res.status(201).json({
            success: true,
            data
        });

    }
    catch(err){
        next(err);
    }
}

export async function login(req, res, next){
    try{
        const {email, password} = req.body;

        const data = await authService.login({
            email,
            password
        });
        
        return res.status(200).json({
            success: true,
            data
        });
    }
    catch(err){
        next(err)
    }
}