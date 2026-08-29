export const TOOL_DEFINITIONS = [
  {
    name: 'calculer_prevision',
    description: 'Calcule la fréquentation et le CA estimés pour une soirée avec un type d\'événement et un DJ donné à une date précise. Utiliser cet outil pour toute question de prévision ou de comparaison de scénarios.',
    input_schema: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description: 'Date de la soirée au format YYYY-MM-DD',
        },
        type_evenement: {
          type: 'string',
          description: 'Type d\'événement parmi : Étudiante, Latino, Techno, Années 80/90, House, Afterwork, Match & DJ set, Open format, Blind test, Live acoustique, Généraliste, Karaoké',
        },
        dj_nom: {
          type: 'string',
          description: 'Nom du DJ (optionnel). Si non fourni, calcule sans DJ.',
        },
      },
      required: ['date', 'type_evenement'],
    },
  },
  {
    name: 'get_coefficients',
    description: 'Récupère les impacts normalisés des DJs ou types d\'événements sur la fréquentation et le CA. Utiliser pour des questions comme "quel est le gain de DJ Sarah" ou "quel type d\'événement performe le mieux".',
    input_schema: {
      type: 'object',
      properties: {
        dimension: {
          type: 'string',
          enum: ['dj', 'type'],
          description: '"dj" pour les impacts des DJs, "type" pour les types d\'événements',
        },
        valeur: {
          type: 'string',
          description: 'Nom spécifique du DJ ou du type (optionnel). Si omis, retourne tous les résultats.',
        },
      },
      required: ['dimension'],
    },
  },
  {
    name: 'get_hw_forecast',
    description: 'Récupère les prévisions de base Holt-Winters pour une période donnée, sans scoring thème. Utile pour comprendre le potentiel d\'une semaine ou d\'un mois.',
    input_schema: {
      type: 'object',
      properties: {
        date_debut: {
          type: 'string',
          description: 'Date de début au format YYYY-MM-DD',
        },
        date_fin: {
          type: 'string',
          description: 'Date de fin au format YYYY-MM-DD',
        },
      },
      required: ['date_debut', 'date_fin'],
    },
  },
  {
    name: 'get_stats_agregees',
    description: 'Récupère des statistiques agrégées et anonymisées sur les performances historiques d\'un type d\'événement ou d\'un DJ. Ne retourne jamais de données individuelles.',
    input_schema: {
      type: 'object',
      properties: {
        type_evenement: {
          type: 'string',
          description: 'Filtrer par type d\'événement (optionnel)',
        },
        dj_nom: {
          type: 'string',
          description: 'Filtrer par DJ (optionnel)',
        },
      },
      required: [],
    },
  },
  {
    name: 'planifier_soiree',
    description: `Planifie une soirée dans le planning du club en l'insérant en base de données.

RÈGLES STRICTES :
- N'appelle cet outil QUE si l'utilisateur a explicitement confirmé (dit "oui", "confirme", "vas-y", "planifie")
- Avant d'appeler cet outil, vérifie que tu as : date, type_evenement, heure_ouverture, heure_fermeture
- Si des infos manquent, demande-les d'abord dans le chat
- Ne jamais planifier dans le passé
- Ne jamais modifier ou supprimer une soirée existante`,
    input_schema: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description: 'Date de la soirée au format YYYY-MM-DD. Doit être dans le futur.',
        },
        type_evenement: {
          type: 'string',
          description: 'Type d\'événement parmi : Étudiante, Latino, Techno, Années 80/90, House, Afterwork, Match & DJ set, Open format, Blind test, Live acoustique, Généraliste, Karaoké',
        },
        nom_evenement: {
          type: 'string',
          description: 'Nom personnalisé de la soirée (optionnel)',
        },
        dj_nom: {
          type: 'string',
          description: 'Nom du DJ (optionnel)',
        },
        heure_ouverture: {
          type: 'string',
          description: 'Heure d\'ouverture au format HH:MM ex: 22:00',
        },
        heure_fermeture: {
          type: 'string',
          description: 'Heure de fermeture au format HH:MM ex: 05:00',
        },
        promotion: {
          type: 'string',
          description: 'Promotion ou offre spéciale (optionnel) ex: Shot offert avant 23h',
        },
      },
      required: ['date', 'type_evenement'],
    },
  },
] as const
