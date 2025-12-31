
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Load Env Vars manually
const envPath = path.join(__dirname, '../../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
    }
});

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = env.SUPABASE_SERVICE_ROLE_KEY;
const TMDB_KEY = env.TMDB_API_KEY || 'e407e3f55ac924320df3192273006442';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

async function fetchFromTMDB(endpoint) {
    const url = `https://api.themoviedb.org/3${endpoint}?api_key=${TMDB_KEY}&language=pt-BR`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`TMDB Error: ${res.status}`);
    return res.json();
}

async function main() {
    console.log('--- STARTING FORCE SYNC ---');

    // Movies
    console.log('Fetching movies without genre...');
    let { data: movies, error } = await supabase
        .from('movies')
        .select('id, tmdb_id')
        .is('genre', null)
        .limit(500);

    if (error) console.error('Supabase Error:', error);

    console.log(`Found ${movies?.length || 0} movies.`);

    if (movies) {
        for (const m of movies) {
            try {
                process.stdout.write(`Syncing Movie ${m.tmdb_id}... `);
                const details = await fetchFromTMDB(`/movie/${m.tmdb_id}`);
                if (details.genres) {
                    const genreStr = details.genres.map(g => g.name).join(', ');
                    await supabase.from('movies').update({
                        genre: genreStr,
                        genres: details.genres
                    }).eq('id', m.id);
                    console.log('OK');
                } else {
                    console.log('No genres found');
                }
            } catch (e) {
                console.log('FAIL', e.message);
            }
        }
    }

    // Series
    console.log('\nFetching series without genre...');
    let { data: series, error: sError } = await supabase
        .from('series')
        .select('id, tmdb_id')
        .is('genre', null)
        .limit(500);

    console.log(`Found ${series?.length || 0} series.`);

    if (series) {
        for (const s of series) {
            try {
                process.stdout.write(`Syncing Series ${s.tmdb_id}... `);
                const details = await fetchFromTMDB(`/tv/${s.tmdb_id}`);
                if (details.genres) {
                    const genreStr = details.genres.map(g => g.name).join(', ');
                    await supabase.from('series').update({
                        genre: genreStr,
                        genres: details.genres
                    }).eq('id', s.id);
                    console.log('OK');
                } else {
                    console.log('No genres found');
                }
            } catch (e) {
                console.log('FAIL', e.message);
            }
        }
    }

    console.log('\n--- DONE ---');
}

main();
