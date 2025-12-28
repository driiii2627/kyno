# Sistema de Recomendações "Biblioteca Infinita" (Legacy)

Este backup contém o código do sistema de recomendações que permitia adicionar filmes automaticamente ao clicar.

## Arquivos no Backup
1.  `page.tsx_backup`: (Antigo `src/app/details/[id]/page.tsx`)
    *   Contém a lógica que busca recomendações **diretamente da TMDB** (`tmdb.getRecommendations`).
    *   Não filtrava se o filme existia no banco de dados local.
    *   Passava objetos crus da TMDB para a interface.

2.  `actions.ts_backup`: (Antigo `src/app/actions.ts`)
    *   Contém a função `resolveTmdbContent` (ou similar).
    *   **Mecanismo**: Quando o usuário clicava em um filme não registrado, o sistema verificava a disponibilidade na API externa (Superflix), e se disponível, registrava automaticamente no Supabase (tabela `movies` ou `series`).

## Como funcionava
1.  O usuário entrava em um filme.
2.  A página carregava recomendações da API pública da TMDB.
3.  O frontend exibia todos, independente de ter na Kyno+.
4.  Ao clicar, uma Server Action interceptava, verificava a existência, e fazia o "Upsert" no banco de dados em tempo real.

## Por que foi removido?
Foi considerado perigoso por permitir crescimento desenfreado do banco de dados sem supervisão humana, além de depender de disponibilidade de links externos em tempo real sem curadoria.

## Como restaurar (se necessário)
Basta substituir o conteúdo dos arquivos atuais pelos deste backup.
