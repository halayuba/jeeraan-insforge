import { createClient } from '@insforge/sdk';
const client = createClient({ baseUrl: 'http://example.com', anonKey: 'foo' });
try {
  client.database.from('profiles').select('*').in('id', []);
  console.log("Success");
} catch(e) {
  console.log(e.toString(), e.stack);
}
