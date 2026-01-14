import { supabase } from '../lib/supabase';

export interface Message {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  parent_message_id: string | null;
  upvotes: number;
  downvotes: number;
  is_pinned: boolean;
  is_deleted: boolean;
  is_hidden: boolean;
  author_display_name?: string;
  user_vote?: 'up' | 'down' | null;
  replies?: Message[];
}

export async function getMessages(roomId: string): Promise<Message[]> {
  const { data: { user } } = await supabase.auth.getUser();

  const { data: messages, error: messagesError } = await supabase
    .from('messages')
    .select('*')
    .eq('room_id', roomId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true });

  if (messagesError) throw messagesError;

  const { data: memberships } = await supabase
    .from('room_memberships')
    .select('user_id, display_name')
    .eq('room_id', roomId)
    .is('left_at', null);

  const membershipMap = new Map(
    memberships?.map((m: any) => [m.user_id, m.display_name]) || []
  );

  let votes: any[] = [];
  if (user) {
    const { data: votesData } = await supabase
      .from('votes')
      .select('message_id, vote_type')
      .eq('user_id', user.id)
      .in('message_id', messages?.map(m => m.id) || []);

    votes = votesData || [];
  }

  const voteMap = new Map(votes.map(v => [v.message_id, v.vote_type]));

  return (messages || []).map(m => ({
    ...m,
    author_display_name: membershipMap.get(m.user_id) || 'Anonymous',
    user_vote: voteMap.get(m.id) || null,
  }));
}

export async function postMessage(
  roomId: string,
  content: string,
  parentMessageId: string | null = null
): Promise<Message> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  console.log('Posting message with:', {
    room_id: roomId,
    user_id: user.id,
    content: content.substring(0, 50),
    parent_message_id: parentMessageId,
  });

  const { data, error } = await supabase
    .from('messages')
    .insert({
      room_id: roomId,
      user_id: user.id,
      content,
      parent_message_id: parentMessageId,
    })
    .select()
    .single();

  if (error) {
    console.error('Supabase error details:', JSON.stringify(error, null, 2));
    throw new Error(error.message + ' (Code: ' + error.code + ', Details: ' + error.details + ', Hint: ' + error.hint + ')');
  }
  return data;
}

export async function voteOnMessage(messageId: string, voteType: 'up' | 'down') {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('votes')
    .upsert({
      message_id: messageId,
      user_id: user.id,
      vote_type: voteType,
    } as any);

  if (error) throw error;
}

export async function reportMessage(messageId: string, reason: string, details?: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('reports')
    .insert({
      message_id: messageId,
      reporter_id: user.id,
      reason,
      details,
    } as any);

  if (error) throw error;
}

export async function deleteMessage(messageId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  console.log('Deleting message:', messageId, 'by user:', user.id);

  const { error } = await supabase
    .from('messages')
    .update({ is_deleted: true })
    .eq('id', messageId);

  if (error) {
    console.error('Delete error:', JSON.stringify(error, null, 2));
    throw new Error(error.message + ' (Code: ' + error.code + ')');
  }
  
  console.log('Message deleted successfully');
}
