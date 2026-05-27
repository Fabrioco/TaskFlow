import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

@Injectable()
export class UploadImageService {
  public supabase: ReturnType<typeof createClient>;

  constructor() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error(
        'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not defined',
      );
    }

    this.supabase = createClient(url, key, {
      auth: {
        persistSession: false, // Boa prática para ambientes de backend (Node)
      },
      realtime: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        transport: ws as any,
      },
    });
  }

  async uploadAvatar(userId: string, buffer: Buffer, mimeType: string) {
    const ext = mimeType.split('/')[1];
    const path = `avatar/${userId}.${ext}`;

    const { error } = await this.supabase.storage
      .from('avatars-taskflow')
      .upload(path, buffer, {
        upsert: true,
        contentType: mimeType,
      });

    if (error) {
      throw new Error(error.message);
    }

    const { data } = this.supabase.storage
      .from('avatars-taskflow')
      .getPublicUrl(path);

    return `${data.publicUrl}?v=${Date.now()}`;
  }
}
