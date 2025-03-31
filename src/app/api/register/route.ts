import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient } from '@/lib/auth';
import OpenAI from 'openai';

// OpenAI設定
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { email, password, username } = await request.json();

    // 入力検証
    if (!email || !password || !username) {
      return NextResponse.json(
        { error: 'メールアドレス、パスワード、ユーザー名は必須です' },
        { status: 400 }
      );
    }

    // Supabaseクライアント
    const supabase = createRouteHandlerSupabaseClient(request);

    // ユーザー作成
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username
        }
      }
    });

    if (authError) {
      console.error('認証エラー:', authError);
      return NextResponse.json(
        { error: `ユーザー登録に失敗しました: ${authError.message}` },
        { status: 500 }
      );
    }

    const userId = authData.user?.id;
    
    if (!userId) {
      return NextResponse.json({ error: 'ユーザーIDが取得できませんでした' }, { status: 500 });
    }

    // AIによるアバター画像生成のプロンプト
    try {
      const imagePrompt = `A creative, colorful profile avatar for a user named ${username}. Digital art style, vibrant colors, suitable as a profile picture, centered composition, white background.`;
      
      // OpenAIを使用して画像を生成
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: imagePrompt,
        n: 1,
        size: "1024x1024",
      });
      
      // 画像URLの取得
      const imageUrl = response.data[0]?.url;
      
      if (!imageUrl) {
        throw new Error('画像生成に失敗しました');
      }
      
      // 画像URLをユーザープロファイルに保存
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          username: username,
          avatar_url: imageUrl,
          created_at: new Date().toISOString()
        });
        
      if (profileError) {
        console.error('プロファイル作成エラー:', profileError);
        return NextResponse.json(
          { error: `プロファイル作成に失敗しました: ${profileError.message}` },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: 'ユーザー登録が完了しました',
        user: {
          id: userId,
          email: email,
          username: username
        }
      });
    } catch (error: unknown) {
      console.error('アバター生成エラー:', error);
      
      // アバター生成に失敗しても、基本的なプロファイルは作成する
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          username: username,
          created_at: new Date().toISOString()
        });
        
      if (profileError) {
        console.error('プロファイル作成エラー:', profileError);
        return NextResponse.json(
          { error: `プロファイル作成に失敗しました: ${profileError.message}` },
          { status: 500 }
        );
      }
      
      const errorMessage = error instanceof Error ? error.message : '不明なエラー';
      
      return NextResponse.json({
        success: true,
        message: 'ユーザー登録が完了しました（アバター生成に失敗）',
        user: {
          id: userId,
          email: email,
          username: username
        },
        warning: `アバター画像の生成に失敗しました: ${errorMessage}`
      });
    }
  } catch (error: unknown) {
    console.error('登録エラー:', error);
    const errorMessage = error instanceof Error ? error.message : '不明なエラー';
    return NextResponse.json(
      { error: `ユーザー登録処理に失敗しました: ${errorMessage}` },
      { status: 500 }
    );
  }
}
