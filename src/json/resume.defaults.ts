import rawResume from './resume.json';
import { resolveResumeAvatarRefsDeep } from '@/lib/resumeAvatarRef';

/** 与 resume.json 相同内容，头像 `resumeAvatar:*` 已展开为 data URL */
const defaultResume = resolveResumeAvatarRefsDeep(rawResume);
export default defaultResume;
