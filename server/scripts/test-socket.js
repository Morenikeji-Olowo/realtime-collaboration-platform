import { io } from 'socket.io-client';

const OWNER_TOKEN = 'eyJhbGciOiJFUzI1NiIsImtpZCI6IjI0NTNkY2Y1LTU2YjItNGE3Zi1iNzZmLTAzNzA5Y2I0M2M0ZCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL25memJwdWl2aHd3bXVkaHZsZGJ6LnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJmODJjNzg0MS1mNTU4LTQ0YjktOTA5OC1kYjE4YTNhOGJkMTciLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzkwMTExOTY3LCJpYXQiOjE3OTAxMDgzNjcsImVtYWlsIjoibW9yZW5pa2VqaW9sb3dvMTAxK3Rlc3QyQGdtYWlsLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWwiOiJtb3JlbmlrZWppb2xvd28xMDErdGVzdDJAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsIm5hbWUiOiJUZXN0IFVzZXIgVHdvIiwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJzdWIiOiJmODJjNzg0MS1mNTU4LTQ0YjktOTA5OC1kYjE4YTNhOGJkMTcifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc5MDEwODM2N31dLCJzZXNzaW9uX2lkIjoiODNhMDEyZTUtYjFlZC00ZjM0LThkM2ItMmFjOTVmZWIyYjYwIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.M_0TlFQVlh6_8Rf4I2j8cqdjxHhcx4AExZQu0R-gdLKf0UTCFu0tLh498YpuIAK2L956P-fOr8fWgOzZfA8MJA';
const OBSERVER_TOKEN = 'eyJhbGciOiJFUzI1NiIsImtpZCI6IjI0NTNkY2Y1LTU2YjItNGE3Zi1iNzZmLTAzNzA5Y2I0M2M0ZCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL25memJwdWl2aHd3bXVkaHZsZGJ6LnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJiMDllOWU4Ni0wMjRlLTQ2MDMtYmI1MC0yOTY3ODY5NTVhZjUiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzkwMTExOTk2LCJpYXQiOjE3OTAxMDgzOTYsImVtYWlsIjoibW9yZW5pa2VqaW9sb3dvMTAxQGdtYWlsLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWwiOiJtb3JlbmlrZWppb2xvd28xMDFAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsIm5hbWUiOiJNb3JlbmlrZWppIE9sb3dvIiwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJzdWIiOiJiMDllOWU4Ni0wMjRlLTQ2MDMtYmI1MC0yOTY3ODY5NTVhZjUifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc5MDEwODM5Nn1dLCJzZXNzaW9uX2lkIjoiYThiOTI4M2EtZWQ5My00OTI2LThhZWItZmM5ZGJmYmY1MDkwIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.q1rSdif01Q1gdZJqYSGxq3BSHlp5Ft9IR3Q0QF15RGPexrBekxDXhZ4eYkzshi6c4RFwvHfSlmEyhNdQCH1QSQ';
const WORKSPACE_ID = '1fa40af6-3d83-4696-8387-2467e73731ad';

console.log('--- Connecting OBSERVER (test2, stays connected throughout) ---');
const observer = io('http://localhost:3000', { auth: { token: OBSERVER_TOKEN } });

observer.on('user_online', (user) => console.log('[OBSERVER saw] user_online:', user));
observer.on('user_offline', (user) => console.log('[OBSERVER saw] user_offline:', user));
observer.on('chat:message', (msg) => console.log('[OBSERVER saw] chat:message:', msg));

observer.on('connect', () => {
  observer.emit('workspace:join', WORKSPACE_ID, (response) => {
    console.log('Observer join response:', response);
    console.log('Observer is watching.\n');

    console.log('--- Connecting TAB A (owner) ---');
    const tabA = io('http://localhost:3000', { auth: { token: OWNER_TOKEN } });

    tabA.on('disconnect', (reason) => console.log('TAB A disconnected, reason:', reason));

    tabA.on('connect', () => {
      tabA.emit('workspace:join', WORKSPACE_ID, (response) => {
        console.log('TAB A response:', response);
        console.log('TAB A joined (expect Observer to see user_online)\n');

        // --- Test: workspace:leave (fixed placement, tabA now actually exists) ---
        setTimeout(() => {
          console.log('\n--- Testing workspace:leave ---');
          tabA.emit('workspace:leave', WORKSPACE_ID);
          console.log('TAB A left (no ack — this event has none). Expect Observer to see user_offline immediately.');

          // --- Rejoin, to get a clean state for the recovery test ---
          setTimeout(() => {
            tabA.emit('workspace:join', WORKSPACE_ID, (response) => {
              console.log('\nTAB A rejoined:', response);
              console.log('Expect Observer to see user_online again.\n');

              // --- Test: Connection State Recovery ---
              setTimeout(() => {
                console.log('--- Testing Connection State Recovery ---');
                console.log('Forcing an UNEXPECTED low-level disconnect (not a clean .disconnect())...');
                console.log('Expect: Observer sees user_offline (immediate, honest disconnect handling),');
                console.log('then user_online again once recovery reconciliation completes.\n');

                tabA.once('connect', () => {
                  console.log('TAB A reconnected. Recovered?', tabA.recovered);

                  // Final proof: ask Observer to re-join and check the fresh onlineUsers list
                  setTimeout(() => {
                    observer.emit('workspace:join', WORKSPACE_ID, (response) => {
                      console.log('\nObserver re-checked online list:', response);
                      console.log('Does it include Tab A?', response.onlineUsers?.includes(tabAUserId));
                      process.exit(0);
                    });
                  }, 1000);
                });

                tabA.io.engine.close();
              }, 1000);
            });
          }, 1000);
        }, 1000);
      });
    });
  });
});

let tabAUserId; // filled in below once we decode it, or just eyeball the printed ID against the response