import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Paper, Typography, CircularProgress, IconButton } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

import { collection, addDoc, getDocs, orderBy, query, doc, getDoc, deleteDoc, where } from 'firebase/firestore';
import { db } from '../firebase/config';

const Chat = () => {
  const [sessionId] = useState(() => {
    // 获取或生成新的会话 ID
    const existingId = sessionStorage.getItem('chatSessionId');
    if (existingId) return existingId;
    const newId = Math.random().toString(36).substring(2);
    sessionStorage.setItem('chatSessionId', newId);
    return newId;
  });
  const [animatingText, setAnimatingText] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);
  // 把 fetchMessages 函数移到 useEffect 之前
  const fetchMessages = async () => {
    try {
      const q = query(
        collection(db, 'messages'), 
        where('sessionId', '==', sessionId),
        orderBy('timestamp', 'asc')
      );
      const querySnapshot = await getDocs(q);
      const fetchedMessages = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(fetchedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };
  // 把 handleClearChat 函数移到这里
  const handleClearChat = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'messages'),
        where('sessionId', '==', sessionId)
      );
      const querySnapshot = await getDocs(q);
      const deletePromises = querySnapshot.docs.map(doc => 
        deleteDoc(doc.ref)
      );
      await Promise.all(deletePromises);
      setMessages([]);
    } catch (error) {
      console.error('Error clearing messages:', error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchMessages();
    fetchProfileData();
  }, []);
  const fetchProfileData = async () => {
    try {
      const profileRef = doc(db, 'sincherData', 'profile');
      const profileSnap = await getDoc(profileRef);
      if (profileSnap.exists()) {
        setProfileData(profileSnap.data());
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };
  const generateAIResponse = async (userMessage) => {
    const message = userMessage.toLowerCase();
    let response = '';
    const isEnglishQuery = /^[a-zA-Z\s?!.,]+$/.test(message);
    if (profileData) {
      if (message.includes('介绍') || message.includes('你是谁') || 
          message.includes('who are you') || message.includes('what is your name') || 
          message.includes('name') || message.includes('叫什么')) {
        response = isEnglishQuery 
          ? `Hi! I'm ${profileData.basics.name}'s AI assistant. ${profileData.basics.name} is a ${profileData.basics.title}. ${profileData.basics.summary}`
          : `你好！我叫小助手，是${profileData.basics.name}的AI助理。我的主人${profileData.basics.name}是一位资深的${profileData.basics.title}。${profileData.basics.summary}`;
      } else if (message.includes('技能') || message.includes('专长') || 
               message.includes('skill') || message.includes('what can you do')) {
        response = isEnglishQuery
          ? `${profileData.basics.name}'s skills include: ${profileData.skills.join(', ')}`
          : `我的主人${profileData.basics.name}精通以下技能：${profileData.skills.join('、')}`;
      } else if (message.includes('工作') || message.includes('经历') || message.includes('经验') ||
               message.includes('work') || message.includes('experience') || message.includes('job')) {
        const latestJob = profileData.experience[0];
        response = isEnglishQuery
          ? `${profileData.basics.name} currently works at ${latestJob.company} as ${latestJob.position}. Main responsibilities include ${latestJob.description}`
          : `目前，我的主人${profileData.basics.name}在${latestJob.company}担任${latestJob.position}职位。他主要负责${latestJob.description}`;
      } else {
        response = isEnglishQuery
          ? `I'm an AI assistant who can answer questions about ${profileData.basics.name}. You can ask me about:\n1. "Tell me about her"\n2. "What are her skills?"\n3. "What's her work experience?"`
          : `你好！我是${profileData.basics.name}的AI助理，很高兴为你服务！\n\n你可以问我这些问题：\n1. "能介绍一下你的主人吗？"\n2. "他有什么专业技能？"\n3. "说说他的工作经历"`;
      }
    } else {
      response = isEnglishQuery
        ? 'Loading profile data, please try again later...'
        : '抱歉，我正在加载主人的资料，请稍后再试...';
    }
    return response;
  };
  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
  
    setLoading(true);
    try {
      const userMessageDoc = await addDoc(collection(db, 'messages'), {
        text: newMessage,
        timestamp: new Date(),
        sender: 'user',
        sessionId: sessionId
      });
  
      setMessages(prev => [...prev, {
        id: userMessageDoc.id,
        text: newMessage,
        timestamp: new Date(),
        sender: 'user',
        sessionId: sessionId
      }]);
  
      const aiResponse = await generateAIResponse(newMessage);
      
      // 先添加空消息
      const aiMessageDoc = await addDoc(collection(db, 'messages'), {
        text: aiResponse,
        timestamp: new Date(),
        sender: 'ai',
        sessionId: sessionId
      });
  
      setMessages(prev => [...prev, {
        id: aiMessageDoc.id,
        text: '',  // 初始为空
        timestamp: new Date(),
        sender: 'ai',
        sessionId: sessionId
      }]);
  
      // 开始打字机效果
      let displayText = '';
      for (let i = 0; i < aiResponse.length; i++) {
        displayText += aiResponse[i];
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageDoc.id ? { ...msg, text: displayText } : msg
        ));
        await new Promise(resolve => setTimeout(resolve, 30));
      }
  
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };
  // 修改消息渲染部分
  return (
    <Box sx={{ width: '100%', maxWidth: '800px', height: 'calc(100vh - 128px)', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Paper sx={{ 
        flex: 1,
        p: 3,
        position: 'relative',
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        border: '1px solid rgba(0, 0, 0, 0.1)',
        overflow: 'auto'
      }}>
        {messages.length > 0 && (
          <IconButton
            onClick={handleClearChat}
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              color: 'rgba(0, 0, 0, 0.3)',
              '&:hover': {
                color: 'rgba(0, 0, 0, 0.5)',
                background: 'rgba(0, 0, 0, 0.05)'
              }
            }}
          >
            <DeleteOutlineIcon />
          </IconButton>
        )}
        
        {messages.length === 0 ? (
          <Box sx={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(0, 0, 0, 0.5)',
            textAlign: 'center'
          }}>
              <Typography>
              Hi! I'm an AI assistant who can answer questions about my owner.<br />
              Feel free to ask me anything!
            </Typography>
          </Box>
        ) : (
          // 修复 messages.map 中的 index 参数
          messages.map((message, index) => (
            <Box 
              key={message.id} 
              sx={{ 
                mb: 2,
                display: 'flex',
                justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <Box sx={{
                maxWidth: '80%',
                p: 2,
                borderRadius: message.sender === 'user' ? '20px 20px 0 20px' : '20px 20px 20px 0',
                background: message.sender === 'user' 
                  ? 'linear-gradient(45deg, #007AFF, #00C6FF)'
                  : 'rgba(0, 0, 0, 0.05)',
                color: message.sender === 'user' ? '#fff' : '#333',
                boxShadow: message.sender === 'user'
                  ? '0 4px 15px rgba(0, 122, 255, 0.2)'
                  : '0 4px 15px rgba(0, 0, 0, 0.05)'
              }}>
                <Typography sx={{ whiteSpace: 'pre-line' }}>
                  {index === messages.length - 1 && message.sender === 'ai' && isAnimating 
                    ? animatingText
                    : message.text}
                </Typography>
              </Box>
            </Box>
          ))
        )}
      </Paper>
      <Box component="form" onSubmit={handleSend} sx={{
        display: 'flex',
        gap: 2
      }}>
        <TextField
          fullWidth
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Ask me something..."
          disabled={loading}
          sx={{
            '& .MuiOutlinedInput-root': {
              background: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(10px)',
              borderRadius: '12px',
              color: '#333',
              '& fieldset': {
                borderColor: 'rgba(0, 0, 0, 0.1)'
              },
              '&:hover fieldset': {
                borderColor: 'rgba(0, 0, 0, 0.2)'
              },
              '&.Mui-focused fieldset': {
                borderColor: '#007AFF'
              }
            }
          }}
        />
        <Button 
          type="submit" 
          variant="contained" 
          disabled={loading}
          sx={{
            background: 'linear-gradient(45deg, #007AFF, #00C6FF)',
            borderRadius: '12px',
            padding: '0 32px',
            '&:hover': {
              background: 'linear-gradient(45deg, #0066CC, #00B2FF)'
            }
          }}
        >
          {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Send'}
        </Button>
      </Box>
    </Box>
  );
};

export default Chat;