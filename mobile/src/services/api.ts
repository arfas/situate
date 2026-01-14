import { supabase } from '../lib/supabase';

export interface Room {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  member_count: number;
  message_count: number;
  last_activity: string;
  similarity?: number;
  match_type?: string;
}

export interface SearchResponse {
  results: Room[];
  popularRooms: Room[];
  searchType: 'semantic' | 'keyword';
  message?: string;
}

export async function searchRooms(query: string, limit = 10): Promise<SearchResponse> {
  const { data: rooms, error } = await supabase
    .from('rooms')
    .select('*')
    .ilike('title', `%${query}%`)
    .eq('is_archived', false)
    .order('member_count', { ascending: false })
    .limit(limit);

  if (error) throw error;

  const { data: popularRooms } = await supabase
    .from('rooms')
    .select('*')
    .eq('is_archived', false)
    .order('member_count', { ascending: false })
    .limit(5);

  return {
    results: rooms || [],
    popularRooms: popularRooms || [],
    searchType: 'keyword',
    message: rooms && rooms.length > 0 ? undefined : 'No exact matches found'
  };
}

export async function createRoom(title: string, description: string, category: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('rooms')
    .insert({
      title,
      description,
      category,
      created_by: user.id,
    } as any)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function joinRoom(
  roomId: string,
  displayName: string,
  anonymityLevel: 'anonymous' | 'pseudonym' | 'semi_anonymous' | 'verified'
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('room_memberships')
    .insert({
      user_id: user.id,
      room_id: roomId,
      display_name: displayName,
      anonymity_level: anonymityLevel,
    } as any)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getRoomMembership(roomId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('room_memberships')
    .select('*')
    .eq('room_id', roomId)
    .eq('user_id', user.id)
    .is('left_at', null)
    .maybeSingle();

  return data;
}

export async function deleteRoom(roomId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Check if user is the creator
  const { data: room } = await supabase
    .from('rooms')
    .select('created_by')
    .eq('id', roomId)
    .single();

  if (room?.created_by !== user.id) {
    throw new Error('Only the room creator can delete this room');
  }

  const { error } = await supabase
    .from('rooms')
    .update({ is_archived: true } as any)
    .eq('id', roomId);

  if (error) throw error;
}
