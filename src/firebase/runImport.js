import { importProfileData } from './importData';

// 执行导入
importProfileData().then(() => {
  console.log('导入完成');
}).catch(error => {
  console.error('导入失败:', error);
});