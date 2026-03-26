import { NextResponse } from 'next/server';

function generateAPIKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = 'rp_live_';
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

function generateUserId() {
  return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

export async function POST(request) {
  const body = await request.json();
  const { provider, email, password } = body;
  
  const apiKey = generateAPIKey();
  const userId = generateUserId();
  
  const user = {
    id: userId,
    name: provider === 'email' ? email.split('@')[0] : `User_${userId}`,
    email: provider === 'email' ? email : `user${userId}@${provider}.com`,
    picture: provider === 'google' 
      ? `https://lh3.googleusercontent.com/a/default_user` 
      : `https://graph.facebook.com/v12.0/me/picture`,
    provider: provider,
    api_key: apiKey,
    created_at: new Date().toISOString(),
  };
  
  console.log(`[AUTH] New ${provider} login: ${user.email} | API Key: ${apiKey.substring(0, 15)}...`);
  
  return NextResponse.json({
    success: true,
    user: user,
    api_key: apiKey,
    message: `Logged in via ${provider}. Use API key for live tracking.`,
  });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const apiKey = searchParams.get('api_key');
  
  if (!apiKey) {
    return NextResponse.json({ error: 'API key required' }, { status: 401 });
  }
  
  return NextResponse.json({
    valid: true,
    user: {
      id: 'demo_user',
      name: 'Demo User',
      plan: 'premium',
    }
  });
}
