import * as usersService from '../services/users.service.js';

export async function getMe(req, res, next) {
    try{
        const user = await usersService.getProfile(req.user.id);
        res.status(200).json({success: true, data: user});
    }
    catch(error){
        next(error)
    }
}