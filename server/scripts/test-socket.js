import { io } from 'socket.io-client';

const OWNER_TOKEN =
  'eyJhbGciOiJFUzI1NiIsImtpZCI6IjI0NTNkY2Y1LTU2YjItNGE3Zi1iNzZmLTAzNzA5Y2I0M2M0ZCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL25memJwdWl2aHd3bXVkaHZsZGJ6LnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJiMDllOWU4Ni0wMjRlLTQ2MDMtYmI1MC0yOTY3ODY5NTVhZjUiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzg4MTg3MzU4LCJpYXQiOjE3ODgxODM3NTgsImVtYWlsIjoibW9yZW5pa2VqaW9sb3dvMTAxQGdtYWlsLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWwiOiJtb3JlbmlrZWppb2xvd28xMDFAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsIm5hbWUiOiJNb3JlbmlrZWppIE9sb3dvIiwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJzdWIiOiJiMDllOWU4Ni0wMjRlLTQ2MDMtYmI1MC0yOTY3ODY5NTVhZjUifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc4ODE4Mzc1OH1dLCJzZXNzaW9uX2lkIjoiMWJhY2NlZGEtMmJlMy00ZTAxLThlMDktNmVhOTEzZWI2NDAyIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.D6WCGzABbEJKO1URgkkAyHDu_Xo-r-Sh1v9YzA1lT-PBerbCY9vOn2IsINO5D6oi2eFyWREz6Ilw_EPyrmR0BA';
const OBSERVER_TOKEN =
  'eyJhbGciOiJFUzI1NiIsImtpZCI6IjI0NTNkY2Y1LTU2YjItNGE3Zi1iNzZmLTAzNzA5Y2I0M2M0ZCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL25memJwdWl2aHd3bXVkaHZsZGJ6LnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJmODJjNzg0MS1mNTU4LTQ0YjktOTA5OC1kYjE4YTNhOGJkMTciLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzg4MTg3MzIxLCJpYXQiOjE3ODgxODM3MjEsImVtYWlsIjoibW9yZW5pa2VqaW9sb3dvMTAxK3Rlc3QyQGdtYWlsLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWwiOiJtb3JlbmlrZWppb2xvd28xMDErdGVzdDJAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsIm5hbWUiOiJUZXN0IFVzZXIgVHdvIiwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJzdWIiOiJmODJjNzg0MS1mNTU4LTQ0YjktOTA5OC1kYjE4YTNhOGJkMTcifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc4ODE4MzcyMX1dLCJzZXNzaW9uX2lkIjoiMWJmNzgyZDUtNmQ5Yy00YTE0LThmMTEtZmU2ODE0NTk3NThlIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.syj6SoOHTT7Wkp8L0_nJi4kFFR53MGFN8Eypw03T561BnYEb48WdD6cIWqpM4gsfYRi3S2GJGfyTRjJ_CpHiWA';
const WORKSPACE_ID = '1fa40af6-3d83-4696-8387-2467e73731ad';

console.log('--- Connecting OBSERVER (test2, stays connected throughout) ---');
const observer = io('http://localhost:3000', { auth: { token: OBSERVER_TOKEN } });

observer.on('user_online', (user) => console.log('[OBSERVER saw] user_online:', user));
observer.on('user_offline', (user) => console.log('[OBSERVER saw] user_offline:', user));
observer.on('chat:message', (msg) => console.log('[OBSERVER saw] chat:message:', msg));
observer.on('whiteboard:operation', (op) => console.log('[OBSERVER saw] whiteboard:operation:', op));

observer.on('connect', () => {
  observer.emit('workspace:join', WORKSPACE_ID, (response) => {
    console.log('Observer join response:', response);
    console.log('Observer is watching.\n');

    console.log('--- Connecting TAB A (owner) ---');
    const tabA = io('http://localhost:3000', { auth: { token: OWNER_TOKEN } });

    tabA.on('connect', () => {
      tabA.emit('workspace:join', WORKSPACE_ID, (response) => {
        console.log('TAB A response:', response);
        console.log('TAB A joined (expect Observer to see user_online)\n');

        tabA.emit('chat:message', WORKSPACE_ID, 'Hello from Tab A', (response) => {
          console.log('TAB A send response:', response);
        });

        tabA.emit(
          'whiteboard:operation',
          WORKSPACE_ID,
          'shape-1',
          'upsert',
          { type: 'rectangle', x: 10, y: 20 },
          (response) => {
            console.log('TAB A whiteboard operation response:', response);
          }
        );

        setTimeout(() => {
          console.log('--- Connecting TAB B (owner, second connection) ---');
          const tabB = io('http://localhost:3000', { auth: { token: OWNER_TOKEN } });

          tabB.on('connect', () => {
            tabB.emit('workspace:join', WORKSPACE_ID, (response) => {
              console.log('TAB B response:', response);
              console.log('TAB B joined (expect NOTHING — already online via TAB A)\n');

              setTimeout(() => {
                console.log('--- Disconnecting TAB A (TAB B still open — expect NOTHING) ---');
                tabA.disconnect();

                setTimeout(() => {
                  console.log('--- Disconnecting TAB B (last one — expect Observer to see user_offline) ---');
                  tabB.disconnect();
                  setTimeout(() => {
                    observer.disconnect();
                    process.exit(0);
                  }, 2000);
                }, 2000);
              }, 2000);
            });
          });
        }, 1000);
      });
    });
  });
});