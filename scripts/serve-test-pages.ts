// test-pages/ 를 정적으로 띄우는 개발용 서버. `bun run serve:test`
import { join, normalize } from 'node:path';

const root = join(import.meta.dir, '..', 'test-pages');
const port = Number(process.env.PORT ?? 5174);

const server = Bun.serve({
  port,
  async fetch(request) {
    const pathname = decodeURIComponent(new URL(request.url).pathname);
    // ../ 로 test-pages 밖을 읽지 못하게 막는다
    const filePath = normalize(join(root, pathname.endsWith('/') ? `${pathname}index.html` : pathname));
    if (!filePath.startsWith(root)) return new Response('Forbidden', { status: 403 });

    const file = Bun.file(filePath);
    if (!(await file.exists())) return new Response('Not Found', { status: 404 });
    return new Response(file);
  },
});

console.log(`테스트 페이지: http://localhost:${server.port}`);
