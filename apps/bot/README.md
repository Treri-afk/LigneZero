# @lignezero/bot — Bot Twitch LigneZero

Bot de chat Twitch relié à Supabase. Il détecte automatiquement le passage en
live, distribue les récompenses et anime le chat. **Toutes les features sont
activables/désactivables depuis le manager** (page `/bot`).

## Ce qu'il fait

- **Tickets** (`!ticket`) — pendant un live rattaché à un match, un spectateur
  réclame son ticket ; il apparaît dans son inventaire sur le site.
- **Clips → cartouche** — chaque nouveau clip Twitch crée une cartouche
  d'inventaire pour le clippeur, avec le lien du clip.
- **Points de fidélité** — `!points`, `!leaderboard` (gagnés en participant +
  bonus au claim d'un ticket).
- **Commandes custom** — `!addcom`/`!delcom` en chat ou via le manager. Tokens
  `{user} {discord} {nextmatch} {score} {roster} {uptime} {match} {competition}`.
- **Boutique de points** — `!rewards`, `!redeem <nom>` (débit atomique côté DB,
  demande transmise au staff dans le manager).
- **Alertes → évènement** — follow/sub/resub/giftsub/raid/cheer déclenchent un
  message configurable + un bonus de points (nécessite le **token broadcaster**).
- **Prédictions / paris** — `!prediction start|lock|resolve` (staff), `!predict
  <n> <montant>` (viewers). Le pot est redistribué au prorata des mises gagnantes.
- **Shoutout** `!so`, **tirage** `!raffle`/`!join`/`!draw`, **sondages**
  `!poll`/`!vote`, **citations** `!quote`, **fun** `!dice`/`!flip`/`!8ball`/`!hug`/`!love`,
  **infos** `!match`/`!next`/`!roster`/`!uptime`, **messages périodiques**,
  **auto-modération**, **accueil** des nouveaux chatteurs.

### Bot Discord (optionnel)

Si `DISCORD_BOT_TOKEN` est fourni, le même process lance aussi un bot Discord :
annonce des lives dans un salon, livraison des **notifications** membres en DM
(objectifs/feedback/sessions créés dans le manager), slash commands
`/points` `/prochainmatch` `/score`, et attribution auto d'un **rôle abonné**
quand un membre lié s'abonne sur Twitch. Requiert l'intent *Server Members*.

Détection du live : **EventSub WebSocket** (`stream.online`/`stream.offline`).
Le match rattaché est celui en statut `live`, sinon le plus proche de l'heure
courante (±12 h). Liaison compte : `member_links.twitch_handle`. Un clippeur/
spectateur non lié est journalisé dans `bot_events` pour attribution manuelle.

## Prérequis (à faire une fois)

1. **Application Twitch** : https://dev.twitch.tv/console/apps → créer une app,
   récupérer `Client ID` + `Client Secret`.
2. **Token du compte bot** : générer un token OAuth *utilisateur* pour le compte
   qui parlera dans le chat, scopes `chat:read chat:edit`
   (ex. https://twitchtokengenerator.com). Noter `access_token` + `refresh_token`.
3. **Clé service_role Supabase** : Dashboard → Project Settings → API.
   ⚠️ Serveur uniquement — ne jamais l'exposer côté client.
4. Copier `.env.example` → `.env` et renseigner les valeurs.

## Lancer

```bash
npm install                    # à la racine du monorepo
npm run dev -w @lignezero/bot  # démarrage avec rechargement (tsx watch)
# ou
npm run start -w @lignezero/bot
```

La config et les commandes sont rechargées automatiquement toutes les 2 min :
les changements faits dans le manager `/bot` s'appliquent sans redémarrage.

## Notes

- L'auto-modération **avertit** dans le chat et journalise. Supprimer/timeout un
  message nécessite les scopes `moderator:manage:*` (à ajouter au token + au
  code plus tard).
- Tirages et sondages sont en mémoire (réinitialisés à chaque live).
