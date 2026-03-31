import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import * as fs from 'fs';
import * as path from 'path';

// Load the firebase config to get the project ID
const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Initialize Firebase Admin
// Note: This requires GOOGLE_APPLICATION_CREDENTIALS to be set
// or to be running in an environment with default credentials.
initializeApp({
  projectId: config.projectId,
});

const auth = getAuth();

async function setRole(email: string, role: string) {
  try {
    const user = await auth.getUserByEmail(email);
    await auth.setCustomUserClaims(user.uid, { role });
    console.log(`Successfully set role "${role}" for user ${email}`);
    
    // Also update the users collection if it exists
    // (Optional, but good for consistency with rules)
    console.log('Note: You may also need to update the "users" collection in Firestore manually.');
  } catch (error) {
    console.error('Error setting role:', error);
    process.exit(1);
  }
}

const email = process.argv[2];
const role = process.argv[3];

if (!email || !role) {
  console.log('Usage: npm run set-role -- <email> <role>');
  process.exit(1);
}

setRole(email, role);
