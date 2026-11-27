// "use client";

// import { useEffect, useState, useRef } from "react";
// // import { createClient } from "@supabase/supabase-js";
// import {
//   createChat,
//   sendMessage,
//   getChatMessages,
// } from "@/actions/chat-actions";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
//   CardDescription,
// } from "@/components/ui/card";
// import { ScrollArea } from "@/components/ui/scroll-area";
// import { Send, Bot, Loader2 } from "lucide-react";
// import { useAuth } from "@/app/context/AuthContext";
// import { createClient } from "@/lib/supabase/client";

// // Initialize Supabase Client for Realtime
// const supabase = createClient();

// interface Message {
//   id: string;
//   sender_id: string;
//   message: string;
//   created_at: string;
//   is_admin: boolean;
// }

// export default function ChatInterface() {
//   const { user, isLoading: authLoading } = useAuth(); // Use AuthContext
//   const [chatId, setChatId] = useState<string | null>(null);
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [newMessage, setNewMessage] = useState("");
//   const [chatLoading, setChatLoading] = useState(false);
//   const [sending, setSending] = useState(false);
//   const scrollRef = useRef<HTMLDivElement>(null);

//   const userId = user?.id; // Get ID from context user

//   useEffect(() => {
//     async function initChat() {
//       if (!userId) return;

//       setChatLoading(true);
//       try {
//         // Create or Fetch Chat
//         const res = await createChat();
//         if (res.chatId) {
//           setChatId(res.chatId);
//           // Load History
//           const history = await getChatMessages(res.chatId);
//           setMessages(history as Message[]);
//         } else {
//           console.error("Failed to create/fetch chat:", res.error);
//         }
//       } catch (err) {
//         console.error("Error initializing chat:", err);
//       }
//       setChatLoading(false);
//     }

//     if (!authLoading && userId) {
//       initChat();
//     }
//   }, [userId, authLoading]);

//   useEffect(() => {
//     if (!chatId) return;

//     // 4. Subscribe to Realtime Changes
//     const channel = supabase
//       .channel(`chat:${chatId}`)
//       .on(
//         "postgres_changes",
//         {
//           event: "INSERT",
//           schema: "public",
//           table: "support_messages",
//           filter: `chat_id=eq.${chatId}`,
//         },
//         (payload) => {
//           setMessages((prev) => [...prev, payload.new as Message]);
//         },
//       )
//       .subscribe();

//     return () => {
//       supabase.removeChannel(channel);
//     };
//   }, [chatId]);

//   useEffect(() => {
//     // Scroll to bottom on new message
//     if (scrollRef.current) {
//       scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
//     }
//   }, [messages]);

//   const handleSend = async () => {
//     if (!newMessage.trim() || !chatId) return;

//     setSending(true);
//     const msg = newMessage;
//     setNewMessage(""); // Optimistic clear

//     await sendMessage(chatId, msg, false);
//     setSending(false);
//   };

//   if (authLoading || chatLoading) {
//     return (
//       <div className="flex h-[500px] items-center justify-center">
//         <Loader2 className="h-8 w-8 animate-spin text-primary" />
//       </div>
//     );
//   }

//   if (!userId) {
//     return (
//       <Card className="mx-auto max-w-md mt-10 text-center p-6">
//         <CardTitle>Sign in to Chat</CardTitle>
//         <CardDescription className="mt-2">
//           You need to be logged in to access support chat.
//         </CardDescription>
//       </Card>
//     );
//   }

//   return (
//     <Card className="mx-auto h-[600px] w-full max-w-2xl flex flex-col shadow-xl">
//       <CardHeader className="border-b border-line bg-surface-sunken/50">
//         <CardTitle className="flex items-center gap-2">
//           <Bot className="h-6 w-6 text-primary" />
//           Support Chat
//         </CardTitle>
//         <CardDescription>
//           Chat with our support team directly. We usually reply within a few
//           minutes.
//         </CardDescription>
//       </CardHeader>

//       <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
//         <ScrollArea className="flex-1 p-4" ref={scrollRef}>
//           <div className="flex flex-col gap-4 min-h-[400px]">
//             {messages.length === 0 && (
//               <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground mt-20">
//                 <Bot className="mb-2 h-10 w-10 opacity-20" />
//                 <p>No messages yet. Start the conversation!</p>
//               </div>
//             )}
//             {messages.map((msg) => {
//               const isMe = msg.sender_id === userId;
//               return (
//                 <div
//                   key={msg.id}
//                   className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}
//                 >
//                   <div
//                     className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
//                       isMe
//                         ? "bg-primary text-primary-foreground rounded-br-none"
//                         : "bg-muted text-foreground rounded-bl-none"
//                     }`}
//                   >
//                     {!isMe && (
//                       <div className="text-[10px] opacity-70 mb-1 font-semibold">
//                         Support
//                       </div>
//                     )}
//                     {msg.message}
//                     <div
//                       className={`text-[10px] mt-1 ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}
//                     >
//                       {new Date(msg.created_at).toLocaleTimeString([], {
//                         hour: "2-digit",
//                         minute: "2-digit",
//                       })}
//                     </div>
//                   </div>
//                 </div>
//               );
//             })}
//             {/* Invisible element to scroll to */}
//             <div ref={scrollRef} />
//           </div>
//         </ScrollArea>

//         <div className="border-t p-4 bg-background">
//           <form
//             onSubmit={(e) => {
//               e.preventDefault();
//               handleSend();
//             }}
//             className="flex gap-2"
//           >
//             <Input
//               value={newMessage}
//               onChange={(e) => setNewMessage(e.target.value)}
//               placeholder="Type your message..."
//               disabled={sending}
//               className="flex-1 rounded-full px-4"
//             />
//             <Button
//               type="submit"
//               size="icon"
//               disabled={sending || !newMessage.trim()}
//               className="rounded-full h-10 w-10 shrink-0"
//             >
//               {sending ? (
//                 <Loader2 className="h-4 w-4 animate-spin" />
//               ) : (
//                 <Send className="h-4 w-4" />
//               )}
//             </Button>
//           </form>
//         </div>
//       </CardContent>
//     </Card>
//   );
// }
