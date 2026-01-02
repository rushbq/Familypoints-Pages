import React, { useState } from 'react';
import { SecretMessage, User, UserRole } from '../types';
import { Button } from './ui/Button';
import { Icons } from './Icons';

interface SecretMailboxProps {
  currentUser: User;
  users: User[];
  messages: SecretMessage[];
  onSendMessage: (msg: { fromChildId: string, fromChildName: string, content: string }) => void;
  onMarkRead: (id: string) => void;
}

export const SecretMailbox: React.FC<SecretMailboxProps> = ({ 
  currentUser, users, messages, onSendMessage, onMarkRead 
}) => {
  const isParent = currentUser.role === UserRole.PARENT;
  const [newMessage, setNewMessage] = useState('');
  const [success, setSuccess] = useState(false);

  // Send Message Logic (Child)
  const handleSend = () => {
    if (!newMessage.trim()) return;
    onSendMessage({
      fromChildId: currentUser.id,
      fromChildName: currentUser.name,
      content: newMessage
    });
    setNewMessage('');
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const sortedMessages = [...messages].sort((a, b) => {
    if (a.isRead === b.isRead) return b.timestamp - a.timestamp;
    return a.isRead ? 1 : -1;
  });

  if (!isParent) {
    return (
      <div className="max-w-3xl mx-auto relative">
        <div className="bg-white rounded-[1.5rem] shadow-xl p-1 border-4 border-nook-beige relative overflow-hidden">
            <div className="p-8 md:p-12 relative z-10">
                {/* Stamp */}
                <div className="absolute top-6 right-6 opacity-60 transform rotate-12 pointer-events-none">
                   <div className="w-24 h-28 border-4 border-nook-green/30 p-2 flex flex-col items-center justify-center rounded-lg">
                      <Icons.Leaf size={48} className="text-nook-green/30" />
                      <span className="text-nook-green/30 font-black text-xs mt-1">LEAF MAIL</span>
                   </div>
                </div>

                <div className="mb-8">
                   <h2 className="text-3xl font-black text-nook-brown mb-2 flex items-center gap-3">
                      <span className="bg-nook-blue text-white rounded-full p-2"><Icons.Send /></span>
                      寄給爸媽的信
                   </h2>
                   <p className="text-nook-brown/60 font-bold ml-12">有什麼心裡話，都可以在這裡說...</p>
                </div>
                
                {/* Clean White Paper Area - Removed Lines for better readability */}
                <div className="relative mb-8">
                  <textarea
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="親愛的爸爸媽媽..."
                    className="w-full h-80 p-6 rounded-2xl border-4 border-nook-beige/50 focus:border-nook-blue/50 focus:ring-0 outline-none resize-none bg-nook-cream text-2xl text-nook-brown font-medium shadow-inner placeholder-nook-brown/20"
                  />
                </div>

                <div className="flex justify-end relative z-10">
                  <Button size="xl" onClick={handleSend} disabled={!newMessage.trim() || success} variant={success ? "success" : "secondary"} className="shadow-xl">
                    {success ? <><Icons.Check className="mr-2" /> 投遞成功！</> : <><Icons.Plane className="mr-2" /> 寄出信件</>}
                  </Button>
                </div>
            </div>
            
            {/* Texture */}
            <div className="absolute inset-0 pointer-events-none bg-white opacity-50" style={{ backgroundImage: 'radial-gradient(#F1F0E0 2px, transparent 2px)', backgroundSize: '20px 20px' }}></div>
        </div>
      </div>
    );
  }

  // Parent View - Grid of postcards
  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between mb-8">
         <div className="flex items-center gap-4">
            <div className="bg-nook-green p-4 rounded-2xl text-white border-b-4 border-nook-greenDark shadow-sm transform -rotate-3"><Icons.Mail size={32} /></div>
            <div>
                <h2 className="text-3xl font-black text-nook-brown">郵筒</h2>
                <p className="font-bold text-nook-brown/50">收到 {messages.length} 封來自孩子的信</p>
            </div>
         </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         {sortedMessages.length === 0 ? (
           <div className="col-span-full text-center py-20 bg-white/50 rounded-[3rem] border-4 border-dashed border-nook-brown/10 text-nook-brown/40">
             <Icons.Inbox size={64} className="mx-auto mb-4 opacity-50" />
             <p className="text-xl font-bold">郵筒空空的...</p>
           </div>
         ) : (
           sortedMessages.map((msg, idx) => (
             <div 
               key={msg.id} 
               onClick={() => !msg.isRead && onMarkRead(msg.id)}
               className={`relative p-8 rounded-[2rem] transition-all cursor-pointer group ${
                 msg.isRead 
                   ? 'bg-white border-4 border-white shadow-sm rotate-0 scale-100 hover:rotate-1' 
                   : 'bg-nook-cream border-8 border-white shadow-xl -rotate-1 hover:rotate-0 hover:scale-[1.02] z-10'
               }`}
             >
                {/* New Badge */}
                {!msg.isRead && (
                    <div className="absolute -top-4 -right-4 bg-nook-red text-white w-20 h-20 rounded-full flex items-center justify-center font-black rotate-12 shadow-md border-4 border-white animate-bounce z-20">
                        NEW!
                    </div>
                )}

               {/* Postcard header */}
               <div className="flex justify-between items-start mb-6 border-b-2 border-dashed border-nook-brown/10 pb-4">
                 <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-nook-beige flex items-center justify-center text-2xl border-2 border-nook-brown/10">
                        <Icons.User />
                    </div>
                    <div>
                        <span className="block font-black text-nook-brown text-lg">{msg.fromChildName}</span>
                        <span className="text-xs font-bold text-nook-blue">寄件人</span>
                    </div>
                 </div>
                 <div className="text-right">
                    <span className="block font-bold text-nook-brown/40 text-sm">
                        {new Date(msg.timestamp).toLocaleString('zh-TW', {month:'numeric', day:'numeric'})}
                    </span>
                    <span className="text-xs font-bold text-nook-brown/30">
                        {new Date(msg.timestamp).toLocaleString('zh-TW', {hour:'2-digit', minute:'2-digit'})}
                    </span>
                 </div>
               </div>
               
               <div className="min-h-[120px]">
                <p className="text-nook-brown whitespace-pre-wrap text-xl leading-relaxed font-medium font-handwriting">
                    {msg.content}
                </p>
               </div>

               {!msg.isRead && (
                 <div className="mt-6 flex justify-end">
                    <div className="text-sm font-black text-white bg-nook-blue px-4 py-2 rounded-full shadow-sm flex items-center">
                        <Icons.CheckCircle size={16} className="mr-2" /> 
                        標示為已讀
                    </div>
                 </div>
               )}
             </div>
           ))
         )}
       </div>
    </div>
  );
};