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
    if (!profileData) {
      return isEnglishQuery
        ? 'Loading profile data, please try again later...'
        : '抱歉，我正在加载主人的资料，请稍后再试...';
    }
    if (message.includes('介绍') || message.includes('你是谁') || 
        message.includes('who are you') || message.includes('what is your name') || 
        message.includes('name') || message.includes('叫什么')) {
      response = isEnglishQuery 
        ? `Hi! I'm ${profileData.basics.name}'s AI assistant. ${profileData.basics.name} is a ${profileData.basics.title}. ${profileData.basics.summary}`
        : `你好！我叫小助手，是${profileData.basics.name}的AI助理。我的主人${profileData.basics.name}是一位资深的${profileData.basics.title}。${profileData.basics.summary}`;
    } 
    else if (message.includes('技能') || message.includes('专长') || 
             message.includes('skill') || message.includes('what can you do')) {
      response = isEnglishQuery
        ? `${profileData.basics.name}'s skills include: ${profileData.skills.join(', ')}`
        : `我的主人${profileData.basics.name}精通以下技能：${profileData.skills.join('、')}`;
    } 
    else if (message.includes('工作') || message.includes('经历') || message.includes('经验') ||
             message.includes('work') || message.includes('experience') || message.includes('job')) {
      const latestJob = profileData.experience[0];
      response = isEnglishQuery
        ? `${profileData.basics.name} currently works at ${latestJob.company} as ${latestJob.position}. Main responsibilities include ${latestJob.description}`
        : `目前，我的主人${profileData.basics.name}在${latestJob.company}担任${latestJob.position}职位。他主要负责${latestJob.description}`;
    }
    else if (message.includes('communicate') || message.includes('stakeholder') || 
             message.includes('沟通') || message.includes('交流')) {
      response = isEnglishQuery
        ? `${profileData.basics.name}'s approach to stakeholder communication:\n\n1. Regular Updates: Provides weekly progress reports and holds bi-weekly meetings\n2. Clear Documentation: Maintains detailed project documentation and meeting minutes\n3. Proactive Communication: Identifies potential issues early and discusses solutions\n4. Multi-channel Approach: Uses both formal meetings and informal check-ins\n5. Feedback Loop: Regularly solicits and incorporates stakeholder feedback`
        : `${profileData.basics.name}与相关方的沟通方式：\n\n1. 定期更新：提供每周进度报告和双周会议\n2. 清晰文档：维护详细的项目文档和会议记录\n3. 主动沟通：及早发现潜在问题并讨论解决方案\n4. 多渠道方式：结合正式会议和非正式交流\n5. 反馈循环：定期征求并采纳相关方反馈`;
    }
    else if (message.includes('conflict') || message.includes('disagreement') || 
             message.includes('冲突') || message.includes('分歧')) {
      response = isEnglishQuery
        ? `${profileData.basics.name}'s conflict resolution approach:\n\n1. Listen First: Understand all perspectives before taking action\n2. Focus on Facts: Base discussions on objective data and requirements\n3. Find Common Ground: Identify shared goals and priorities\n4. Propose Solutions: Develop multiple options for resolution\n5. Follow Up: Monitor the situation and maintain open communication`
        : `${profileData.basics.name}的冲突处理方式：\n\n1. 先倾听：采取行动前充分理解各方观点\n2. 重事实：基于客观数据和需求进行讨论\n3. 寻共识：识别共同目标和优先事项\n4. 提方案：制定多个可能的解决方案\n5. 跟进：持续监控情况并保持沟通渠道畅通`;
    }
    else if (message.includes('challenge') || message.includes('difficult') || 
             message.includes('挑战') || message.includes('困难')) {
      response = isEnglishQuery
        ? `A challenging project ${profileData.basics.name} handled:\n\n1. Situation: Tight deadline with complex technical requirements\n2. Task: Deliver high-quality solution while managing stakeholder expectations\n3. Action: Created detailed project plan, communicated regularly, and prioritized tasks\n4. Result: Successfully delivered project on time with positive feedback\n5. Learning: Improved project management and communication skills`
        : `${profileData.basics.name}处理过的一个挑战性项目：\n\n1. 情况：严格的期限和复杂的技术要求\n2. 任务：在管理相关方期望的同时交付高质量解决方案\n3. 行动：制定详细项目计划，保持定期沟通，合理安排任务优先级\n4. 结果：按时成功交付项目并获得积极反馈\n5. 收获：提升了项目管理和沟通能力`;
    }
    else if (message.includes('leadership') || message.includes('team') || 
             message.includes('领导') || message.includes('团队')) {
      response = isEnglishQuery
        ? `${profileData.basics.name}'s leadership style:\n\n1. Vision: Sets clear goals and communicates team direction\n2. Empowerment: Delegates responsibilities and trusts team members\n3. Mentorship: Provides guidance and supports professional growth\n4. Recognition: Acknowledges team contributions and celebrates success\n5. Development: Focuses on building strong, collaborative team culture`
        : `${profileData.basics.name}的领导风格：\n\n1. 愿景：制定清晰目标并传达团队方向\n2. 授权：合理分配责任并信任团队成员\n3. 指导：提供指引并支持职业成长\n4. 认可：肯定团队贡献并庆祝成功\n5. 发展：注重建立强大的协作团队文化`;
    }
    else if (message.includes('pressure') || message.includes('stress') || 
             message.includes('压力') || message.includes('紧张')) {
      response = isEnglishQuery
        ? `${profileData.basics.name}'s stress management approach:\n\n1. Prioritization: Focus on high-impact tasks first\n2. Time Management: Break large projects into manageable chunks\n3. Work-Life Balance: Maintain healthy boundaries and regular breaks\n4. Support Network: Collaborate with team members when needed\n5. Self-Care: Practice stress-relief techniques and regular exercise`
        : `${profileData.basics.name}的压力管理方式：\n\n1. 优先级：首先关注高影响力任务\n2. 时间管理：将大项目分解为可管理的小任务\n3. 工作生活平衡：保持健康的界限和定期休息\n4. 支持网络：需要时与团队成员合作\n5. 自我关注：实践减压技巧和规律运动`;
    }
    else if (message.includes('failure') || message.includes('mistake') || 
             message.includes('失败') || message.includes('错误')) {
      response = isEnglishQuery
        ? `${profileData.basics.name}'s approach to handling failures:\n\n1. Analysis: Thoroughly understand what went wrong\n2. Accountability: Take responsibility for mistakes\n3. Learning: Extract valuable lessons from each experience\n4. Improvement: Implement changes to prevent similar issues\n5. Growth: View failures as opportunities for development`
        : `${profileData.basics.name}处理失败的方式：\n\n1. 分析：深入理解问题所在\n2. 负责：对错误承担责任\n3. 学习：从每次经历中吸取宝贵教训\n4. 改进：实施变革以防止类似问题\n5. 成长：将失败视为发展机会`;
    }
    else if (message.includes('education') || message.includes('study') || 
             message.includes('学历') || message.includes('教育') || message.includes('学习')) {
      const educationList = profileData.education
        .map(edu => `${edu.institution} (${edu.period})\n   • ${edu.degree}`);
      
      response = isEnglishQuery
        ? `${profileData.basics.name}'s education background:\n\n${educationList.join('\n\n')}`
        : `${profileData.basics.name}的教育背景：\n\n${educationList.join('\n\n')}`;
    }
    else if (message.includes('certification') || message.includes('certificate') || 
             message.includes('证书') || message.includes('认证')) {
      const certList = profileData.certifications
        .map(cert => `${cert.name} (${cert.date})`);
      
      response = isEnglishQuery
        ? `${profileData.basics.name}'s recent certifications:\n\n${certList.map((cert, i) => `${i + 1}. ${cert}`).join('\n')}`
        : `${profileData.basics.name}最近获得的专业认证：\n\n${certList.map((cert, i) => `${i + 1}. ${cert}`).join('\n')}`;
    }
    else {
      response = isEnglishQuery
        ? `I'm an AI assistant who can answer questions about ${profileData.basics.name}. You can ask me about:\n1. "Tell me about her"\n2. "What are her skills?"\n3. "What's her work experience?"\n4. "How does she communicate with stakeholders?"\n5. "How does she handle conflicts?"\n6. "Tell me about a challenging project"\n7. "What's her leadership style?"\n8. "How does she handle pressure?"\n9. "How does she deal with failures?"\n10. "What's her educational background?"\n11. "What certifications does she have?"`
        : `你好！我是${profileData.basics.name}的AI助理，很高兴为你服务！\n\n你可以问我这些问题：\n1. "能介绍一下你的主人吗？"\n2. "他有什么专业技能？"\n3. "说说他的工作经历"\n4. "他是如何与相关方沟通的？"\n5. "他如何处理冲突？"\n6. "讲讲他处理过的挑战性项目"\n7. "他的领导风格是怎样的？"\n8. "他如何应对压力？"\n9. "他如何处理失败？"\n10. "他的教育背景是什么？"\n11. "他获得了哪些专业认证？"`;
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