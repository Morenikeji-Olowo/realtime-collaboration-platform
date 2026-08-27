import supabase from "../config/supabase.js";
import { AppError } from "../middleware/error.js";

export async function getProfile(userId) {
    const {data, error} = await supabase
        .from('users')
        .select('id, email, name, created_at, updated_at')
        .eq('id', userId)
        .single();
    
        if(error){
            throw new AppError('User profile not found', 400);
        }

        return data;
}