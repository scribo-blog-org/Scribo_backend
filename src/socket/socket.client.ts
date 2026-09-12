import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SocketClient {
    public readonly client: SupabaseClient;

    constructor(private readonly config: ConfigService) {
        const supabaseUrl = this.config.getOrThrow<string>('SUPABASE_URL');
        const supabaseSecretKey = this.config.getOrThrow<string>(
            'SUPABASE_SECRET_KEY',
        );

        this.client = createClient(supabaseUrl, supabaseSecretKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });
    }
}
