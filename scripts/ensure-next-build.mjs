import { existsSync } from 'node:fs';
import path from 'node:path';

const buildIdPath = path.join(process.cwd(), '.next', 'BUILD_ID');

if (!existsSync(buildIdPath)) {
  console.error(
    '[easy-resume] 未找到 .next/BUILD_ID，请先在本项目目录执行：npm run build',
  );
  process.exit(1);
}
