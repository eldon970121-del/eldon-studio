import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'sonner';

const SOCKET_URL =
  import.meta.env.VITE_LUMINA_API ||
  'https://lumina-server-production.up.railway.app';

let _socket = null;

export function useInquirySocket(enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    _socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    _socket.on('new_inquiry_received', ({ clientName, budget }) => {
      toast('新询单到达', {
        description: `${clientName} · ${budget}`,
        duration: 6000,
        action: {
          label: '查看',
          onClick: () =>
            window.dispatchEvent(new CustomEvent('lumina:open-inquiries')),
        },
      });
    });

    return () => {
      _socket?.disconnect();
      _socket = null;
    };
  }, [enabled]);
}
