import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient } from '@/lib/auth';

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

    // ユーザープロファイルをデータベースに作成
    const { error: profileError } = await supabase
      .from('users')
      .upsert({
        id: userId,
        username: username,
        email: email,
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
    console.error('ユーザー登録エラー:', error);
    const errorMessage = error instanceof Error ? error.message : '不明なエラー';
    return NextResponse.json(
      { error: `ユーザー登録に失敗しました: ${errorMessage}` },
      { status: 500 }
    );
  }
}
