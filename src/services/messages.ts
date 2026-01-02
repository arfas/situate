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
  is_encrypted: boolean;
  author_display_name?: string;
  user_vote?: 'up' | 'down' | null;
  replies?: Message[];
}

export async function getMessages(roomId: string): Promise<Message[]> {
  const { data: { user } } = await supabase.auth.getUser();
  console.log('Fetching messages for room:', roomId, 'user:', user?.id);

  const { data: messages, error: messagesError } = await supabase
    .from('messages')
    .select(`
      *
    `)
    .eq('room_id', roomId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true });

  console.log('Messages query result:', messages, 'error:', messagesError);
  if (messagesError) throw messagesError;

  const { data: memberships } = await supabase
    .from('room_memberships')
    .select('user_id, display_name')
    .eq('room_id', roomId)
    .is('left_at', null);

  const membershipMap = new Map(
    // @ts-expect-error - Supabase type inference issue
    memberships?.map(m => [m.user_id, m.display_name]) || []
  );

  let votes: any[] = [];
  if (user) {
    const { data: votesData } = await supabase
      .from('votes')
      .select('message_id, vote_type')
      .eq('user_id', user.id)
      // @ts-expect-error - Supabase type inference issue
      .in('message_id', messages?.map(m => m.id) || []);
    votes = votesData || [];
  }

  const voteMap = new Map(votes.map(v => [v.message_id, v.vote_type]));

  const messagesWithAuthors = messages?.map(msg => ({
    // @ts-expect-error - Supabase type inference issue
    ...msg,
    // @ts-expect-error - Supabase type inference issue
    author_display_name: membershipMap.get(msg.user_id) || 'Unknown',
    // @ts-expect-error - Supabase type inference issue
    user_vote: voteMap.get(msg.id) || null,
  })) || [];

  const messageTree = buildMessageTree(messagesWithAuthors);
  return messageTree;
}

function buildMessageTree(messages: Message[]): Message[] {
  const messageMap = new Map<string, Message>();
  const rootMessages: Message[] = [];

  messages.forEach(msg => {
    messageMap.set(msg.id, { ...msg, replies: [] });
  });

  messages.forEach(msg => {
    const message = messageMap.get(msg.id)!;
    if (msg.parent_message_id) {
      const parent = messageMap.get(msg.parent_message_id);
      if (parent) {
        parent.replies = parent.replies || [];
        parent.replies.push(message);
      }
    } else {
      rootMessages.push(message);
    }
  });

  return rootMessages;
}

export async function postMessage(
  roomId: string,
  content: string,
  parentMessageId?: string | null,
  isEncrypted: boolean = false
) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('messages')
    // @ts-expect-error - Supabase type inference issue
    .insert({
      room_id: roomId,
      user_id: user.id,
      content,
      parent_message_id: parentMessageId || null,
      is_encrypted: isEncrypted,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateMessage(messageId: string, content: string) {
  const { data, error } = await supabase
    .from('messages')
    // @ts-expect-error - Supabase type inference issue
    .update({
      content,
      updated_at: new Date().toISOString(),
    })
    .eq('id', messageId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteMessage(messageId: string) {
  const { error } = await supabase
    .from('messages')
    // @ts-expect-error - Supabase type inference issue
    .update({ is_deleted: true })
    .eq('id', messageId);

  if (error) throw error;
}

export async function voteOnMessage(
  messageId: string,
  voteType: 'up' | 'down'
) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data: existingVote } = await supabase
    .from('votes')
    .select('*')
    .eq('user_id', user.id)
    .eq('message_id', messageId)
    .maybeSingle();

  if (existingVote) {
    // @ts-expect-error - Supabase type inference issue
    if (existingVote.vote_type === voteType) {
      const { error } = await supabase
        .from('votes')
        .delete()
        // @ts-expect-error - Supabase type inference issue
        .eq('id', existingVote.id);

      if (error) throw error;
      return null;
    } else {
      const { data, error } = await supabase
        .from('votes')
        // @ts-expect-error - Supabase type inference issue
        .update({ vote_type: voteType })
        // @ts-expect-error - Supabase type inference issue
        .eq('id', existingVote.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  } else {
    const { data, error } = await supabase
      .from('votes')
      // @ts-expect-error - Supabase type inference issue
      .insert({
        user_id: user.id,
        message_id: messageId,
        vote_type: voteType,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export async function reportMessage(
  messageId: string,
  reason: 'spam' | 'harassment' | 'misinformation' | 'self_harm' | 'other',
  details?: string
) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('reports')
    // @ts-expect-error - Supabase type inference issue
    .insert({
      message_id: messageId,
      reporter_id: user.id,
      reason,
      details,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
