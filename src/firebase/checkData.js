import { doc, getDoc } from 'firebase/firestore';
import { db } from './config';

const checkProfileData = async () => {
  try {
    const profileRef = doc(db, 'sincherData', 'profile');
    const profileSnap = await getDoc(profileRef);
    
    if (profileSnap.exists()) {
      console.log('数据已成功导入：', profileSnap.data());
    } else {
      console.log('未找到数据，请先运行导入程序');
    }
  } catch (error) {
    console.error('检查数据时出错：', error);
  }
};

checkProfileData();