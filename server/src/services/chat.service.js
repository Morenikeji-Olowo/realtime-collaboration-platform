import supabase from '../config/supabase.js';

export async function createMessage(workspaceId, senderId, content) {
    const {data, error} = await supabase
        .from('messages')
        .insert({
            workspace_id: workspaceId,
            sender_id: senderId,
            content
        })
        .select()
        .single();
    if(error){
        throw new AppError('Failed to send message', 500, {cause: error});
    }
    return data;
}