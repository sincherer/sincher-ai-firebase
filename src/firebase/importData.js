import { doc, setDoc } from 'firebase/firestore';
import { db } from './config';

const profileData = {
  basics: {
    name: "Sincher",
    title: "Senior UX Designer",
    summary: "专注于用户体验设计和前端开发的资深设计师"
  },
  education: [
    {
      institution: "University of Hertfordshire - UK",
      period: "2011-2012",
      degree: "Bachelor's Degree in Art/Design/Creative Multimedia",
      location: "United Kingdom"
    },
    {
      institution: "The One Academy",
      period: "2008-2010",
      degree: "Diploma in Art/Design/Creative Multimedia",
      location: "Malaysia"
    }
  ],
  certifications: [
    {
      name: "AI in UI/UX Design",
      issuer: "UXcel",
      date: "2023-11",
      url: "https://app.uxcel.com/certificates/DE6BXL81SLBL"
    },
    {
      name: "Service Design",
      issuer: "UXcel",
      date: "2023-10",
      url: "https://app.uxcel.com/certificates/9X6YRG5QKIWW"
    },
    {
      name: "CSS for Designers",
      issuer: "UXcel",
      date: "2023-10",
      url: "https://app.uxcel.com/certificates/JBV4Y1HS3GGU"
    },
    {
      name: "Design Accessibility",
      issuer: "UXcel",
      date: "2023-09",
      url: "https://app.uxcel.com/certificates/J2H1APW6OAWQ"
    },
    {
      name: "Design Mentorship Mastery",
      issuer: "ADPList",
      date: "2023-09",
      url: "https://app.uxcel.com/certificates/BRRRMSFZ9CRW"
    },
    {
      name: "UX Writing",
      issuer: "UXcel",
      date: "2023-09",
      url: "https://app.uxcel.com/certificates/H6KN2MVEECY4"
    },
    {
      name: "Color Psychology",
      issuer: "UXcel",
      date: "2023-09",
      url: "https://app.uxcel.com/certificates/CSL2Q6MDDTHI"
    },
    {
      name: "UX Design Patterns",
      issuer: "Checklist Design",
      date: "2023-09",
      url: "https://app.uxcel.com/certificates/Z3H0KAFWK2VO"
    },
    {
      name: "UI Components I",
      issuer: "UXcel",
      date: "2023-09",
      url: "https://app.uxcel.com/certificates/96C7CV04Z8EY"
    },
    {
      name: "Full Stack Web Development with Angular",
      issuer: "Coursera",
      date: "2022-07",
      url: "https://www.coursera.org/account/accomplishments/specialization/certificate/U4L3QUL2PD7N"
    },
    {
      name: "Google UX Design Specialization",
      issuer: "Google",
      date: "2022-07",
      url: "https://www.coursera.org/account/accomplishments/specialization/certificate/CJJRPFVZZT7N"
    },
    {
      name: "Professional Diploma in Digital Marketing",
      issuer: "Digital Marketing Institute",
      date: "2018-05",
      url: "https://www.credential.net/238eknnx"
    }
  ],
  approaches: {
    communication: {
      points: [
        "Regular Updates: Provides weekly progress reports and holds bi-weekly meetings",
        "Clear Documentation: Maintains detailed project documentation and meeting minutes",
        "Proactive Communication: Identifies potential issues early and discusses solutions",
        "Multi-channel Approach: Uses both formal meetings and informal check-ins",
        "Feedback Loop: Regularly solicits and incorporates stakeholder feedback"
      ]
    },
    leadership: {
      points: [
        "Vision: Sets clear goals and communicates team direction",
        "Empowerment: Delegates responsibilities and trusts team members",
        "Mentorship: Provides guidance and supports professional growth",
        "Recognition: Acknowledges team contributions and celebrates success",
        "Development: Focuses on building strong, collaborative team culture"
      ]
    },
    conflict: {
      points: [
        "Listen First: Understand all perspectives before taking action",
        "Focus on Facts: Base discussions on objective data and requirements",
        "Find Common Ground: Identify shared goals and priorities",
        "Propose Solutions: Develop multiple options for resolution",
        "Follow Up: Monitor the situation and maintain open communication"
      ]
    },
    pressure: {
      points: [
        "Prioritization: Focus on high-impact tasks first",
        "Time Management: Break large projects into manageable chunks",
        "Work-Life Balance: Maintain healthy boundaries and regular breaks",
        "Support Network: Collaborate with team members when needed",
        "Self-Care: Practice stress-relief techniques and regular exercise"
      ]
    }
  }
};

export const importProfileData = async () => {
  try {
    await setDoc(doc(db, 'sincherData', 'profile'), profileData);
    console.log('Profile data imported successfully');
  } catch (error) {
    console.error('Error importing profile data:', error);
  }
};