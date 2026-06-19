import React from "react";
import Chatbot from "../features/chat/Chatbot";
import { MessageSquare } from "lucide-react";

const Chat = () => {
  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-9 w-9 items-center justify-center flex rounded-lg bg-indigo-500/10 text-indigo-400">
          <MessageSquare className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-extrabold text-white">AI Companion</h1>
          <p className="text-xs text-slate-500">Ask questions about your uploaded biomarker values and daily tracker habits.</p>
        </div>
      </div>
      
      <Chatbot />
    </div>
  );
};

export default Chat;
