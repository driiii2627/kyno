import { tmdb } from '@/services/tmdb';
import SeasonBrowser from '@/components/details/SeasonBrowser';
import DetailsTabs from '@/components/details/DetailsTabs';
import { CatalogItem, contentService } from '@/services/content';

export default async function DetailsExtras({ item }: { item: CatalogItem }) {
    // 2. Fetch Deep Data (Credits, Seasons, Recs)
    const [details, credits] = await Promise.all([
        tmdb.getDetails(item.tmdb_id, item.type),
        tmdb.getCredits(item.tmdb_id, item.type)
    ]);

    // 3. Conditional Fetches
    let initialSeasonData = null;
    const conditionalPromises: Promise<any>[] = [];

    if (item.type === 'tv' && 'seasons' in details) {
        const firstSeason = details.seasons?.find((s: any) => s.season_number > 0) || details.seasons?.[0];
        if (firstSeason) {
            conditionalPromises.push(
                tmdb.getSeasonDetails(item.tmdb_id, firstSeason.season_number)
                    .then(res => { initialSeasonData = res; })
                    .catch(() => null)
            );
        }
    }
    await Promise.all(conditionalPromises);

    // 4. Recommendations
    const recommendationContext = {
        id: item.tmdb_id,
        supabase_id: item.supabase_id,
        title: (details as any).title || (details as any).name,
        name: (details as any).name,
        overview: details.overview,
        vote_average: details.vote_average,
        genre: details.genres?.map((g: any) => g.name).join(', '),
        genres: details.genres || []
    };
    const recommendations = await contentService.getPersonalizedRecommendations(recommendationContext as any, 'guest');

    // Prepare Browser
    let seasonBrowserNode = null;
    if (item.type === 'tv' && initialSeasonData) {
        seasonBrowserNode = (
            <SeasonBrowser
                tmdbId={item.tmdb_id}
                uuid={item.supabase_id}
                seasons={details.seasons || []}
                initialSeasonData={initialSeasonData}
            />
        );
    }

    return (
        <DetailsTabs
            seasonBrowser={seasonBrowserNode}
            recommendations={recommendations}
            uuid={item.supabase_id}
        />
    );
}
