import { io } from 'socket.io-client';

const TOKEN = 'eyJhbGciOiJFUzI1NiIsImtpZCI6IjI0NTNkY2Y1LTU2YjItNGE3Zi1iNzZmLTAzNzA5Y2I0M2M0ZCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL25memJwdWl2aHd3bXVkaHZsZGJ6LnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJiMDllOWU4Ni0wMjRlLTQ2MDMtYmI1MC0yOTY3ODY5NTVhZjUiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzkwMjA2MDE2LCJpYXQiOjE3OTAyMDI0MTYsImVtYWlsIjoibW9yZW5pa2VqaW9sb3dvMTAxQGdtYWlsLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWwiOiJtb3JlbmlrZWppb2xvd28xMDFAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsIm5hbWUiOiJNb3JlbmlrZWppIE9sb3dvIiwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJzdWIiOiJiMDllOWU4Ni0wMjRlLTQ2MDMtYmI1MC0yOTY3ODY5NTVhZjUifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc5MDIwMjQxNn1dLCJzZXNzaW9uX2lkIjoiZTJmYTZlOGMtOGZlYy00MTkzLWE3YTQtYjNhYmE1MTMxYWQ4IiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.7v4DmcqOmiKyjuq6CoxAVmQB2gxoYZpaNO5eVnbQO2-Q950NaFkuoSORSf5k30smGww-e8xHmvpz_JduTFp3-Q';
const WORKSPACE_ID = 'ff37308c-8083-4682-8b1f-821256d5ae92';

const socket = io('http://localhost:3000', { auth: { token: TOKEN } });

socket.on('connect', () => {
  socket.emit('workspace:join', WORKSPACE_ID, () => {
    socket.emit('chat:message', WORKSPACE_ID, 'cascade test message', (response) => {
      console.log('Message sent:', response);
      process.exit(0);
    });
  });
});