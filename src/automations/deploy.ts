import build from "generate-roam-site";
import { createDeployment } from '@vercel/client';
import path from 'path';

export const handler = async (event: {
  roamGraph: string;
  roamUsername: string;
  roamPassword: string;
}): Promise<void> => build(event).then(async () => {
  console.log("Finished building! Starting deploy...")
  for await (const e of createDeployment({
    token: process.env.VERCEL_TOKEN,
    path: path.join(process.cwd(), 'out')
  })) {
    if (e.type === 'ready') {
      console.log('Deployment ready!');
      return e.payload;
    } else {
      console.log('Deployment', e.type, '-',new Date().toJSON());
    }
  }
}).then((data) => {
  console.log("Exiting! Data:", data);
}).catch((e) => {
  console.error(e);
});
