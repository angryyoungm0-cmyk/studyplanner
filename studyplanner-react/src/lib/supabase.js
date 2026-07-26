const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// To enable cloud sync:
// 1. Create a free Supabase project at https://supabase.com
// 2. Go to SQL Editor and run:
//
//    CREATE TABLE user_data (
//      user_id TEXT PRIMARY KEY,
//      data JSONB NOT NULL,
//      updated_at TIMESTAMPTZ DEFAULT NOW()
//    );
//
// 3. Go to Settings > API and copy:
//    - Project URL -> VITE_SUPABASE_URL
//    - anon public key -> VITE_SUPABASE_ANON_KEY
//
// 4. Create a .env file in the project root with those values

const isConfigured = SUPABASE_URL && SUPABASE_ANON_KEY && !SUPABASE_URL.includes('placeholder');

class SupabaseClient {
  constructor(url, key) {
    this.url = url;
    this.key = key;
    this.headers = {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };
  }

  async from(table) {
    return new SupabaseQuery(this, table);
  }
}

class SupabaseQuery {
  constructor(client, table) {
    this.client = client;
    this.table = table;
    this._select = '*';
    this._filters = [];
    this._data = null;
    this._operation = null;
  }

  select(cols = '*') {
    this._select = cols;
    return this;
  }

  upsert(data) {
    this._data = data;
    this._operation = 'upsert';
    return this;
  }

  insert(data) {
    this._data = data;
    this._operation = 'insert';
    return this;
  }

  update(data) {
    this._data = data;
    this._operation = 'update';
    return this;
  }

  eq(col, val) {
    this._filters.push(`${col}=eq.${encodeURIComponent(val)}`);
    return this;
  }

  async maybeSingle() {
    const result = await this._execute();
    return { data: result?.[0] || null, error: null };
  }

  async select_exec() {
    const result = await this._execute();
    return { data: result, error: null };
  }

  async _execute() {
    if (this._operation === 'upsert' || this._operation === 'insert') {
      const res = await fetch(`${this.client.url}/rest/v1/${this.table}`, {
        method: 'POST',
        headers: { ...this.client.headers, 'Prefer': 'return=representation,resolution-merge-duplicates' },
        body: JSON.stringify(this._data)
      });
      if (!res.ok) {
        console.warn(`Supabase ${this._operation} failed:`, await res.text());
        return null;
      }
      return res.json();
    }

    if (this._operation === 'update') {
      const params = this._filters.join('&');
      const res = await fetch(`${this.client.url}/rest/v1/${this.table}?${params}`, {
        method: 'PATCH',
        headers: this.client.headers,
        body: JSON.stringify(this._data)
      });
      if (!res.ok) {
        console.warn('Supabase update failed:', await res.text());
        return null;
      }
      return res.json();
    }

    const params = [`select=${this._select}`, ...this._filters].join('&');
    const res = await fetch(`${this.client.url}/rest/v1/${this.table}?${params}`, {
      headers: this.client.headers
    });
    if (!res.ok) {
      console.warn('Supabase select failed:', await res.text());
      return [];
    }
    return res.json();
  }
}

const supabase = isConfigured ? new SupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

export { supabase, isConfigured };

export async function syncToCloud(userId, data) {
  if (!supabase || !userId) return false;
  try {
    await supabase.from('user_data').upsert({
      user_id: userId,
      data: data,
      updated_at: new Date().toISOString()
    });
    return true;
  } catch (err) {
    console.warn('Cloud sync failed:', err);
    return false;
  }
}

export async function syncFromCloud(userId) {
  if (!supabase || !userId) return null;
  try {
    const { data } = await supabase.from('user_data').select('*').eq('user_id', userId).maybeSingle();
    return data?.data || null;
  } catch (err) {
    console.warn('Cloud fetch failed:', err);
    return null;
  }
}