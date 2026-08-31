import { describe, expect, it } from 'vitest';
import { makeQiniuUploadToken, qiniuUrlSafeBase64 } from '@/lib/qiniuUpload';

describe('qiniuUpload token', () => {
  it('matches官方文档 URL 安全 Base64（保留 padding）', () => {
    const policy = {
      scope: 'my-bucket:sunflower.jpg',
      deadline: 1451491200,
      returnBody:
        '{"name":$(fname),"size":$(fsize),"w":$(imageInfo.width),"h":$(imageInfo.height),"hash":$(etag)}',
    };
    const encoded = qiniuUrlSafeBase64(JSON.stringify(policy));
    expect(encoded).toBe(
      'eyJzY29wZSI6Im15LWJ1Y2tldDpzdW5mbG93ZXIuanBnIiwiZGVhZGxpbmUiOjE0NTE0OTEyMDAsInJldHVybkJvZHkiOiJ7XCJuYW1lXCI6JChmbmFtZSksXCJzaXplXCI6JChmc2l6ZSksXCJ3XCI6JChpbWFnZUluZm8ud2lkdGgpLFwiaFwiOiQoaW1hZ2VJbmZvLmhlaWdodCksXCJoYXNoXCI6JChldGFnKX0ifQ==',
    );
    const token = makeQiniuUploadToken('MY_ACCESS_KEY', 'MY_SECRET_KEY', policy);
    expect(token).toBe(
      'MY_ACCESS_KEY:wQ4ofysef1R7IKnrziqtomqyDvI=:eyJzY29wZSI6Im15LWJ1Y2tldDpzdW5mbG93ZXIuanBnIiwiZGVhZGxpbmUiOjE0NTE0OTEyMDAsInJldHVybkJvZHkiOiJ7XCJuYW1lXCI6JChmbmFtZSksXCJzaXplXCI6JChmc2l6ZSksXCJ3XCI6JChpbWFnZUluZm8ud2lkdGgpLFwiaFwiOiQoaW1hZ2VJbmZvLmhlaWdodCksXCJoYXNoXCI6JChldGFnKX0ifQ==',
    );
  });
});
