
const TMDB_ID_RICK_MORTY = 60625; // Rick and Morty ID

async function check(category) {
    console.log(`Checking category: ${category}...`);
    const url = `https://superflixapi.buzz/lista?category=${category}&type=tmdb&format=json`;
    const start = Date.now();
    try {
        const res = await fetch(url);
        if (!res.ok) {
            console.log(`Error ${res.status}`);
            return;
        }
        const ids = await res.json();
        const duration = Date.now() - start;
        console.log(`Fetched ${ids.length} IDs in ${duration}ms.`);

        // Check for string or number match just in case
        const hasIt = ids.includes(TMDB_ID_RICK_MORTY.toString()) || ids.includes(TMDB_ID_RICK_MORTY);
        console.log(`Contains Rick and Morty (${TMDB_ID_RICK_MORTY})? ${hasIt ? 'YES ✅' : 'NO ❌'}`);
    } catch (e) {
        console.error(e);
    }
}

async function run() {
    await check('serie');
    await check('anime');
    await check('movie');
}

run();
