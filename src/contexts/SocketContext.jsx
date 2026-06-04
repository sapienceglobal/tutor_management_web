"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

const SocketContext = createContext({
  socket: null,
  isConnected: false,
  examBlocked: false,
  examBlockedMessage: '',
  clearExamBlock: () => {}
});

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [examBlocked, setExamBlocked] = useState(false);
  const [examBlockedMessage, setExamBlockedMessage] = useState('');

  const clearExamBlock = () => {
    setExamBlocked(false);
    setExamBlockedMessage('');
  };

  useEffect(() => {
    // Get backend base URL and strip trailing /api
    let backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
    backendUrl = backendUrl.replace(/\/api\/?$/, '').trim();

    const token = localStorage.getItem('token') || Cookies.get('token');
    const userStr = localStorage.getItem('user');
    let userName = 'Student';
    if (userStr) {
      try {
        userName = JSON.parse(userStr).name || 'Student';
      } catch (e) {}
    }

    if (!token) {
      // Disconnect existing socket if any
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    console.log(`🔌 Initializing WebSocket connection to ${backendUrl}...`);
    const socketInstance = io(backendUrl, {
      auth: {
        token,
        userName
      },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000
    });

    socketInstance.on('connect', () => {
      console.log('✅ WebSocket Connected!');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ WebSocket Disconnected');
      setIsConnected(false);
    });

    socketInstance.on('multiple_devices_detected', (data) => {
      console.log('🚨 Multi-device/tab block received:', data);
      setExamBlocked(true);
      setExamBlockedMessage(data.message || 'Another active exam session detected.');
    });

    socketInstance.on('exam_session_warning', (data) => {
      console.warn('⚠️ Exam session warning:', data);
      toast.error(data.message || 'Warning: A secondary device attempted login.', {
        duration: 6000,
        id: 'secondary-login-attempt'
      });
    });

    socketInstance.on('exam_terminated', (data) => {
      console.warn('🚨 Exam terminated by proctor:', data);
      setExamBlocked(true);
      setExamBlockedMessage(data.reason || 'This exam attempt has been terminated by the proctor/tutor.');
    });

    socketInstance.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected, examBlocked, examBlockedMessage, clearExamBlock }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
