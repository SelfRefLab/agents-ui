'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

export default function ChatPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to new chat session
    const newContextId = uuidv4();
    router.replace(`/chat/${newContextId}`);
  }, [router]);

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Creating new chat session...</p>
      </div>
    </div>
  );
}
