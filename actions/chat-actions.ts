// 'use server'

// import { createClient } from "@/lib/supabase/server";
// // import { revalidatePath } from "next/cache";

// export async function createChat() {
//   const supabase = await createClient();
//   const { data: { user } } = await supabase.auth.getUser();

//   if (!user) {
//     return { error: "Not authenticated" };
//   }

//   // Check if an open chat already exists
//   const { data: existingChat } = await supabase
//     .from("support_chats")
//     .select("id")
//     .eq("user_id", user.id)
//     .eq("status", "open")
//     .single();

//   if (existingChat) {
//     return { chatId: existingChat.id };
//   }

//   // Create new chat
//   const { data: newChat, error } = await supabase
//     .from("support_chats")
//     .insert({ user_id: user.id, status: "open" })
//     .select("id")
//     .single();

//   if (error) {
//     console.error("Error creating chat:", error);
//     return { error: `Failed to create chat: ${error.message} (Code: ${error.code})` };
//   }

//   return { chatId: newChat.id };
// }

// export async function sendMessage(chatId: string, message: string, isAdmin: boolean = false) {
//   const supabase = await createClient();
//   const { data: { user } } = await supabase.auth.getUser();

//   if (!user) {
//     return { error: "Not authenticated" };
//   }

//   const { error } = await supabase
//     .from("support_messages")
//     .insert({
//       chat_id: chatId,
//       sender_id: user.id,
//       message,
//       is_admin: isAdmin, // Security note: In a real app, verify admin role here
//     });

//   if (error) {
//     console.error("Error sending message:", error);
//     return { error: `Failed to send message: ${error.message} (Code: ${error.code})` };
//   }
// }

// export async function getChatMessages(chatId: string) {
//   const supabase = await createClient();

//   const { data, error } = await supabase
//     .from("support_messages")
//     .select("*")
//     .eq("chat_id", chatId)
//     .order("created_at", { ascending: true });

//   if (error) {
//     console.error("Error fetching messages:", error);
//     return [];
//   }

//   return data;
// }

// export async function getUserChats() {
//     // For admin or listing user specific chats
//     const supabase = await createClient();
//     const { data: { user } } = await supabase.auth.getUser();

//     if (!user) return [];

//     const { data, error } = await supabase
//         .from('support_chats')
//         .select('*')
//         .eq('user_id', user.id)
//         .order('created_at', { ascending: false });

//     if (error) return [];
//     return data;
// }

// export async function getAllChats() {
//     // ADMIN ONLY - Fetch all chats
//     const supabase = await createClient();

//     // 1. Fetch Chats
//     const { data: chats, error } = await supabase
//         .from('support_chats')
//         .select(`
//             *,
//             msg:support_messages(message, created_at)
//         `)
//         .eq('status', 'open')
//         .order('created_at', { ascending: false });

//     if (error) {
//         console.error("Error fetching chats:", error);
//         return [];
//     }

//     if (!chats || chats.length === 0) return [];

//     // 2. Fetch User Profiles
//     const userIds = Array.from(new Set(chats.map(c => c.user_id)));
//     const { data: profiles, error: profilesError } = await supabase
//         .from('profiles')
//         .select('id, full_name, email')
//         .in('id', userIds);

//     if (profilesError) {
//         console.error("Error fetching profiles:", profilesError);
//     }

//     // 3. Merge Data
//     const chatsWithUser = chats.map(chat => {
//         const userProfile = profiles?.find(p => p.id === chat.user_id);
//         return {
//             ...chat,
//             user: userProfile || { full_name: 'Unknown', email: 'No email' }
//         };
//     });

//     return chatsWithUser;
// }
