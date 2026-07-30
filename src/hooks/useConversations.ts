import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Conversation, Message } from '@/types/database';

export interface ConversationRow extends Conversation {
  otherUserName: string;
  propertyTitle: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

export function useConversations(userId: string | undefined) {
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    const { data: convRows } = await supabase
      .from('conversations')
      .select('*, property:properties(title)')
      .or(`participant_a.eq.${userId},participant_b.eq.${userId}`)
      .order('created_at', { ascending: false });

    const list = (convRows as any[]) ?? [];
    if (list.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const otherIds = list.map((c) => (c.participant_a === userId ? c.participant_b : c.participant_a));
    const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', otherIds);
    const nameMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

    const ids = list.map((c) => c.id);
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .in('conversation_id', ids)
      .order('created_at', { ascending: true });

    const lastByConv = new Map<string, Message>();
    const unreadByConv = new Map<string, number>();
    (messages as Message[] | null)?.forEach((m) => {
      lastByConv.set(m.conversation_id, m);
      if (!m.read_at && m.sender_id !== userId) {
        unreadByConv.set(m.conversation_id, (unreadByConv.get(m.conversation_id) ?? 0) + 1);
      }
    });

    setConversations(
      list.map((c) => {
        const otherId = c.participant_a === userId ? c.participant_b : c.participant_a;
        const last = lastByConv.get(c.id);
        return {
          ...c,
          otherUserName: nameMap.get(otherId) ?? 'Usuario',
          propertyTitle: c.property?.title ?? null,
          lastMessage: last?.body ?? null,
          lastMessageAt: last?.created_at ?? c.created_at,
          unreadCount: unreadByConv.get(c.id) ?? 0,
        };
      })
    );
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { conversations, loading, refresh };
}

export async function getOrCreateConversation(
  currentUserId: string,
  otherUserId: string,
  propertyId: string | null
): Promise<{ id: string | null; error: string | null }> {
  let query = supabase
    .from('conversations')
    .select('id')
    .or(
      `and(participant_a.eq.${currentUserId},participant_b.eq.${otherUserId}),and(participant_a.eq.${otherUserId},participant_b.eq.${currentUserId})`
    );

  query = propertyId ? query.eq('property_id', propertyId) : query.is('property_id', null);

  const { data: existing } = await query.maybeSingle();
  if (existing) return { id: existing.id, error: null };

  const { data, error } = await supabase
    .from('conversations')
    .insert({ participant_a: currentUserId, participant_b: otherUserId, property_id: propertyId })
    .select('id')
    .single();

  if (error) return { id: null, error: error.message };
  return { id: data.id, error: null };
}

export function useMessages(conversationId: string | undefined, currentUserId: string | undefined) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!conversationId) return;
    setLoading(true);
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    setMessages((data as Message[]) ?? []);
    setLoading(false);

    if (currentUserId) {
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .neq('sender_id', currentUserId)
        .is('read_at', null);
    }
  }, [conversationId, currentUserId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const sendMessage = async (body: string) => {
    if (!conversationId || !currentUserId || !body.trim()) return { error: 'Mensaje vacío' };
    const { error } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: currentUserId, body: body.trim() });
    if (!error) await refresh();
    return { error: error?.message ?? null };
  };

  return { messages, loading, refresh, sendMessage };
}
