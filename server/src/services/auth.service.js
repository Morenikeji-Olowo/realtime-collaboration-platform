import { AppError } from '../middleware/error.js';
import supabase from '../config/supabase.js';

export async function signUp ({email, password, name}){
    const {data, error} = await supabase.auth.signUp({
        email, 
        password,
        options:{
            data: {
                name
            },
        }
    })
    if(error){
        throw new AppError(error.message, error.status || 400);
    }

    return data;
}

export async function login({email, password}){
    const {data, error} = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if(error){
        throw new AppError(error.message, error.status || 400); 
    }

    return data;
}