import { io } from 'socket.io-client';

const OWNER_TOKEN = 'eyJhbGciOiJFUzI1NiIsImtpZCI6IjI0NTNkY2Y1LTU2YjItNGE3Zi1iNzZmLTAzNzA5Y2I0M2M0ZCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL25memJwdWl2aHd3bXVkaHZsZGJ6LnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJmODJjNzg0MS1mNTU4LTQ0YjktOTA5OC1kYjE4YTNhOGJkMTciLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzkwMTIxNDk0LCJpYXQiOjE3OTAxMTc4OTQsImVtYWlsIjoibW9yZW5pa2VqaW9sb3dvMTAxK3Rlc3QyQGdtYWlsLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWwiOiJtb3JlbmlrZWppb2xvd28xMDErdGVzdDJAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsIm5hbWUiOiJUZXN0IFVzZXIgVHdvIiwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJzdWIiOiJmODJjNzg0MS1mNTU4LTQ0YjktOTA5OC1kYjE4YTNhOGJkMTcifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc5MDExNzg5NH1dLCJzZXNzaW9uX2lkIjoiYzFiNzFlZmEtODcxMS00ZGNiLTk2ZWYtZmQ5YjcxZDE2Y2ViIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.Uw-BktMHXnMJlDXHOHZLfdxVYT1fEGqQ47vF_lFFVtPJf9a7dY0D3OXCcmXxmFWwT1AzshetRprQXniH8kspZw';
const OBSERVER_TOKEN = 'eyJhbGciOiJFUzI1NiIsImtpZCI6IjI0NTNkY2Y1LTU2YjItNGE3Zi1iNzZmLTAzNzA5Y2I0M2M0ZCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL25memJwdWl2aHd3bXVkaHZsZGJ6LnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJiMDllOWU4Ni0wMjRlLTQ2MDMtYmI1MC0yOTY3ODY5NTVhZjUiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzkwMTIxNTIwLCJpYXQiOjE3OTAxMTc5MjAsImVtYWlsIjoibW9yZW5pa2VqaW9sb3dvMTAxQGdtYWlsLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWwiOiJtb3JlbmlrZWppb2xvd28xMDFAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsIm5hbWUiOiJNb3JlbmlrZWppIE9sb3dvIiwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJzdWIiOiJiMDllOWU4Ni0wMjRlLTQ2MDMtYmI1MC0yOTY3ODY5NTVhZjUifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc5MDExNzkyMH1dLCJzZXNzaW9uX2lkIjoiNDlhMDUyODQtYTkwOS00MmVhLWE5MGUtMzRkNzZiOWNiZmE1IiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.mstpzhu7ghclTka0gY9bFMFPOrW7nh0X_pb_YWKbTk1AzoaVrNKDAKCVS_wtaiLLZ0P-d2eAKppBeamofbbhCg';
const WORKSPACE_ID = '1fa40af6-3d83-4696-8387-2467e73731ad';

console.log('--- Connecting OBSERVER (test2, stays connected throughout) ---');
const observer = io('http://localhost:3000', { auth: { token: OBSERVER_TOKEN } });

observer.on('whiteboard:cursor', (cursor) => console.log('[OBSERVER saw] whiteboard:cursor:', cursor));

observer.on('connect', () => {
  observer.emit('workspace:join', WORKSPACE_ID, (response) => {
    console.log('Observer join response:', response);
    console.log('Observer is watching.\n');

    console.log('--- Connecting TAB A (owner) ---');
    const tabA = io('http://localhost:3000', { auth: { token: OWNER_TOKEN } });

    // Confirm Tab A never receives its own cursor broadcast back
    tabA.on('whiteboard:cursor', (cursor) => console.log('❌ UNEXPECTED: TAB A saw its own cursor broadcast:', cursor));

    tabA.on('connect', () => {
      tabA.emit('workspace:join', WORKSPACE_ID, (response) => {
        console.log('TAB A joined:', response, '\n');

        console.log('--- TAB A emitting whiteboard:cursor ---');
        tabA.emit('whiteboard:cursor', WORKSPACE_ID, { x: 150, y: 275 });
        console.log('Sent (no ack expected — this event has none).\n');

        setTimeout(() => {
          console.log('--- Test complete ---');
          tabA.disconnect();
          observer.disconnect();
          process.exit(0);
        }, 1500);
      });
    });
  });
});