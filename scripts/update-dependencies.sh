cd frontend-angular/
npm update
npm install -D wrangler@latest
cd ..

cd worker/
pnpm up
pnpm add -D wrangler@latest
cd ..

cd pages/
pnpm up
pnpm add -D wrangler@latest
cd ..

cd vitepress-docs/
pnpm up --latest
pnpm add -D wrangler@latest
cd ..
