import React, { useState, useEffect, useCallback } from 'react';
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

  // 删除未使用的状态
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);
  // 将 fetchMessages 移到这里，在 useEffect 之前
  const fetchMessages = useCallback(async () => {
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
  }, [sessionId]);

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
  // 修改 useEffect 依赖
  useEffect(() => {
    fetchMessages();
    fetchProfileData();
  }, [fetchMessages]); // 添加依赖项

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
    // 修改英文检测逻辑，只要包含英文关键词就返回英文回答
    const isEnglishQuery = message.includes('leadership') || 
                          message.includes('team') ||
                          message.includes('communicate') ||
                          message.includes('stakeholder') ||
                          message.includes('conflict') ||
                          message.includes('disagreement') ||
                          message.includes('challenge') ||
                          message.includes('difficult') ||
                          message.includes('pressure') ||
                          message.includes('stress') ||
                          message.includes('failure') ||
                          message.includes('mistake') ||
                          message.includes('education') ||
                          message.includes('study') ||
                          message.includes('certification') ||
                          message.includes('certificate') ||
                          message.includes('who are you') ||
                          message.includes('what is your name') ||
                          message.includes('name') ||
                          message.includes('hi') ||
                          message.includes('hello') ||
                          message.includes('skill') ||
                          message.includes('what can you do') ||
                          message.includes('work') ||
                          message.includes('experience') ||
                          message.includes('job');
    if (!profileData) {
      return isEnglishQuery
        ? 'Loading profile data, please try again later...'
        : '抱歉，我正在加载主人的资料，请稍后再试...';
    }
    if (message.includes('介绍') || message.includes('你是谁') || 
        message.includes('who are you') || message.includes('什么名字') || 
        message.includes('hi') || message.includes('hello') || 
        message.includes('name') || message.includes('叫什么')) {
      response = isEnglishQuery 
        ? `Hey there! 👋 I'm ${profileData.basics.name}'s personal AI buddy! My job is to tell you all about this amazing ${profileData.basics.title}. ${profileData.basics.summary}`
        : `嗨！高兴见到你！😊 我是${profileData.basics.name}的AI小助手，可以和你聊聊我的主人哦！他是一位超棒的${profileData.basics.title}呢。${profileData.basics.summary}`;
    } 
    else if (message.includes('技能') || message.includes('专长') || 
             message.includes('skill') || message.includes('what can you do')) {
      response = isEnglishQuery
        ? `Let me tell you about ${profileData.basics.name}'s superpowers! 🚀 Here's what they're great at: ${profileData.skills.join(', ')}`
        : `让我来告诉你我家主人的特长吧！✨ 他超擅长这些呢：${profileData.skills.join('、')}`;
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
      const approachObj = profileData.approaches[0];
      if (!approachObj?.communication) {
        response = isEnglishQuery
          ? "I'm sorry, but I don't have information about communication approaches at the moment."
          : "抱歉，我目前没有关于沟通方式的信息。";
      } else {
        const communicationPoints = approachObj.communication
          .map((point, index) => `${index + 1}. ${point}`);
        
        response = isEnglishQuery
          ? `${profileData.basics.name}'s approach to stakeholder communication:\n\n${communicationPoints.join('\n')}`
          : `${profileData.basics.name}与相关方的沟通方式：\n\n${communicationPoints.join('\n')}`;
      }
    }
    else if (message.includes('conflict') || message.includes('disagreement') || 
             message.includes('冲突') || message.includes('分歧')) {
      const approachObj = profileData.approaches[0];
      if (!approachObj?.conflict) {
        response = isEnglishQuery
          ? "I'm sorry, but I don't have information about conflict resolution approaches at the moment."
          : "抱歉，我目前没有关于冲突处理方式的信息。";
      } else {
        const conflictPoints = approachObj.conflict
          .map((point, index) => `${index + 1}. ${point}`);
        
        response = isEnglishQuery
          ? `${profileData.basics.name}'s conflict resolution approach:\n\n${conflictPoints.join('\n')}`
          : `${profileData.basics.name}的冲突处理方式：\n\n${conflictPoints.join('\n')}`;
      }
    }
    else if (message.includes('leadership') || message.includes('team') || 
             message.includes('领导') || message.includes('团队')) {
      const approachObj = profileData.approaches[0];
      if (!approachObj?.leadership) {
        response = isEnglishQuery
          ? "I'm sorry, but I don't have information about leadership style at the moment."
          : "抱歉，我目前没有关于领导风格的信息。";
      } else {
        const leadershipPoints = approachObj.leadership
          .map((point, index) => `${index + 1}. ${point}`);
        
        response = isEnglishQuery
          ? `${profileData.basics.name}'s leadership style:\n\n${leadershipPoints.join('\n')}`
          : `${profileData.basics.name}的领导风格：\n\n${leadershipPoints.join('\n')}`;
      }
    }
    else if (message.includes('pressure') || message.includes('stress') || 
             message.includes('压力') || message.includes('紧张')) {
      const approachObj = profileData.approaches[0];
      if (!approachObj?.pressure) {
        response = isEnglishQuery
          ? "I'm sorry, but I don't have information about stress management approaches at the moment."
          : "抱歉，我目前没有关于压力管理方式的信息。";
      } else {
        const pressurePoints = approachObj.pressure
          .map((point, index) => `${index + 1}. ${point}`);
        
        response = isEnglishQuery
          ? `${profileData.basics.name}'s stress management approach:\n\n${pressurePoints.join('\n')}`
          : `${profileData.basics.name}的压力管理方式：\n\n${pressurePoints.join('\n')}`;
      }
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
        .map(edu => `${edu.institution} (${edu.period})\n   • ${edu.degree}\n   • ${edu.location}`);
      
      response = isEnglishQuery
        ? `${profileData.basics.name}'s education background:\n\n${educationList.join('\n\n')}`
        : `${profileData.basics.name}的教育背景：\n\n${educationList.join('\n\n')}`;
    }
    else if (message.includes('certification') || message.includes('certificate') || 
             message.includes('证书') || message.includes('认证')) {
      const certList = profileData.certifications
        .map(cert => `${cert.name} (${cert.date})\n   • ${cert.issuerLogo ? `![${cert.issuer}](${cert.issuerLogo}) ` : ''}${cert.issuer}\n   • [View Certificate](${cert.url})`);
      
      response = isEnglishQuery
        ? `🏆 ${profileData.basics.name}'s recent certifications:\n\n${certList.map((cert, i) => `${i + 1}. ${cert}`).join('\n\n')}`
        : `🏆 ${profileData.basics.name}最近获得的专业认证：\n\n${certList.map((cert, i) => `${i + 1}. ${cert}`).join('\n\n')}`;
    }
    else if (message.includes('contact') || message.includes('联系') || 
             message.includes('email') || message.includes('邮件')) {
      response = isEnglishQuery
        ? `Would you like to connect with ${profileData.basics.name}? 📫\n\nPlease leave your contact info:\n1. Your name\n2. Email or other contact method\n3. Brief message\n\nOr you can reach out directly via:\n• Email: ${profileData.basics.email}\n• LinkedIn: ${profileData.basics.linkedin}`
        : `想要和${profileData.basics.name}取得联系吗？📫\n\n请留下你的联系方式：\n1. 你的名字\n2. 邮箱或其他联系方式\n3. 简短留言\n\n或者直接通过以下方式联系：\n• 邮箱：${profileData.basics.email}\n• 领英：${profileData.basics.linkedin}`;
    }
    else {
      response = isEnglishQuery
        ? `Hey! 👋 I'd love to tell you more about ${profileData.basics.name}! You can ask me about:\n\n🎯 Their background and skills\n💼 Work experience\n🤝 Communication style\n👥 Leadership approach\n💪 How they handle challenges\n\nWhat would you like to know?`
        : `你好啊！👋 我可以给你介绍${profileData.basics.name}的很多方面哦！比如：\n\n🎯 个人背景和技能\n💼 工作经历\n🤝 沟通方式\n👥 领导风格\n💪 如何应对挑战\n\n想了解哪个方面呢？`;
    }
    return response;
  };
 
  // 修改 handleSend 函数
  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
  
    setLoading(true);
    try {
      // 检查是否包含联系信息
      const contactInfo = newMessage.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi);
      if (contactInfo) {
        await addDoc(collection(db, 'visitors'), {
          email: contactInfo[0],
          message: newMessage,
          timestamp: new Date(),
          sessionId: sessionId
        });
      }

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
        
        const aiMessageDoc = await addDoc(collection(db, 'messages'), {
          text: aiResponse,
          timestamp: new Date(),
          sender: 'ai',
          sessionId: sessionId
        });
    
        let currentText = '';
        setMessages(prev => [...prev, {
          id: aiMessageDoc.id,
          text: currentText,
          timestamp: new Date(),
          sender: 'ai',
          sessionId: sessionId
        }]);
    
        for (let i = 0; i < aiResponse.length; i++) {
          currentText += aiResponse[i];
          const displayText = currentText;
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
                <Typography sx={{ 
                  whiteSpace: 'pre-line',
                  '& a': {
                    color: message.sender === 'user' ? '#fff' : '#007AFF',
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  },
                  '& img': {
                    height: '20px',
                    verticalAlign: 'middle',
                    marginRight: '8px'
                  }
                }}>
                  {message.text.split('\n').map((line, i) => {
                    const linkMatch = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
                    const imgMatch = line.match(/!\[([^\]]+)\]\(([^)]+)\)/);
                    
                    if (imgMatch) {
                      const [fullMatch, alt, src] = imgMatch;
                      return (
                        <React.Fragment key={i}>
                          {line.substring(0, line.indexOf(fullMatch))}
                          <img src={src} alt={alt} />
                          {line.substring(line.indexOf(fullMatch) + fullMatch.length)}
                          {i < message.text.split('\n').length - 1 && <br />}
                        </React.Fragment>
                      );
                    }
                    
                    if (linkMatch) {
                      const [fullMatch, text, url] = linkMatch;
                      return (
                        <React.Fragment key={i}>
                          {line.substring(0, line.indexOf(fullMatch))}
                          <a href={url} target="_blank" rel="noopener noreferrer">{text}</a>
                          {line.substring(line.indexOf(fullMatch) + fullMatch.length)}
                          {i < message.text.split('\n').length - 1 && <br />}
                        </React.Fragment>
                      );
                    }
                    return (
                      <React.Fragment key={i}>
                        {line}
                        {i < message.text.split('\n').length - 1 && <br />}
                      </React.Fragment>
                    );
                  })}
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