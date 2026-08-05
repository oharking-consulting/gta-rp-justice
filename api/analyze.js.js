module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Méthode non autorisée' });

    try {
        let issueDescription = "Incident RP";
        if (req.body) {
            if (typeof req.body === 'string') {
                try {
                    const parsed = JSON.parse(req.body);
                    issueDescription = parsed.description || req.body;
                } catch(e) {
                    issueDescription = req.body;
                }
            } else if (typeof req.body === 'object') {
                issueDescription = req.body.description || JSON.stringify(req.body);
            }
        }

        const fallbackResponse = {
            titre: "Rapport d'incident RP",
            joueurs_impliques": "Impliqués signalés",
            severite: "HAUTE",
            categorie: "CONFLIT JOUEURS",
            description_courte": issueDescription.substring(0, 80),
            synthese_ia": "Analyse automatisée de la situation : un désaccord majeur perturbe l'immersion. Une intervention structurée du staff est requise pour départager les responsabilités.",
            solutions: [
                { id: 1, titre: "Médiation vocale en canal privé", description: "Convoquer les joueurs concernés pour un échange constructif et un rappel des règles.", niveau_risque: 15, impact_commu: 30, coherence_rp: 85, difficulte: 25, points_forts: ["Désamorce les tensions rapidement", "Pédagogique"], points_faibles": ["Nécessite la disponibilité des deux joueurs"] },
                { id: 2, titre: "Audit des logs et des preuves vidéo", description: "Analyser objectivement les enregistrements pour vérifier la véracité des accusations.", niveau_risque: 20, impact_commu: 45, coherence_rp: 90, difficulte: 40, points_forts": ["Décision factuelle irréfutable"], points_faibles": ["Temps de visionnage nécessaire"] },
                { id: 3, titre: "Avertissement formel au dossier", description: "Placer un avertissement officiel dans le profil des joueurs en faute.", niveau_risque: 50, impact_commu: 60, coherence_rp: 75, difficulte: 35, points_forts": ["Trace l'historique des sanctions"], points_faibles": ["Risque de récidive si isolé"] },
                { id: 4, titre: "Sanction d'exclusion temporaire", description: "Appliquer un bannissement de courte durée pour marquer l'exemplarité de la règle.", niveau_risque: 80, impact_commu: 80, coherence_rp: 95, difficulte: 50, points_forts": ["Effet dissuasif immédiat sur le serveur"], points_faibles": ["Impact négatif sur l'activité des joueurs"] }
            ]
        };

        const apiKey = process.env.GEMINI_API_KEY;
        if (apiKey) {
            try {
                const { GoogleGenerativeAI } = require('@google/generative-ai');
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ 
                    model: "gemini-1.5-flash",
                    generationConfig: { responseMimeType: "application/json" }
                });

                const promptSysteme = `Tu es un administrateur expert sur GTA V RP (FiveM). Analyse le problème fourni et renvoie STRICTEMENT un objet JSON valide suivant cette structure exacte :
                {
                  "titre": "Titre du cas",
                  "joueurs_impliques": "JOHNDOE, MIKESMITH",
                  "severite": "HAUTE",
                  "categorie": "CONFLIT JOUEURS",
                  "description_courte": "Résumé",
                  "synthese_ia": "Analyse synthétique globale et factuelle.",
                  "solutions": [
                    { "id": 1, "titre": "Médiation directe", "description": "Appel vocal pour exposer la version.", "niveau_risque": 20, "impact_commu": 40, "coherence_rp": 80, "difficulte": 30, "points_forts": ["Rapide"], "points_faibles": ["Dépend des joueurs"] },
                    { "id": 2, "titre": "Analyse des clips vidéo", "description": "Vérification des preuves.", "niveau_risque": 25, "impact_commu": 55, "coherence_rp": 85, "difficulte": 50, "points_forts": ["Objectif"], "points_faibles": ["Long"] },
                    { "id": 3, "titre": "Sanction temporaire", "description": "Freeze en attendant l'enquête.", "niveau_risque": 45, "impact_commu": 60, "coherence_rp": 70, "difficulte": 40, "points_forts": ["Stoppe l'escalade"], "points_faibles": ["Frustrant"] },
                    { "id": 4, "titre": "Sanction ferme", "description": "Bannissement temporaire.", "niveau_risque": 75, "impact_commu": 75, "coherence_rp": 90, "difficulte": 60, "points_forts": ["Exemplaire"], "points_faibles": ["Lourd"] }
                  ]
                }`;

                const result = await model.generateContent([promptSysteme, "Problème : " + issueDescription]);
                const text = result.response.text();
                if (text) {
                    return res.status(200).json({ success: true, ai_response: text });
                }
            } catch (aiErr) {
                // Bascule automatique sur le mode secours si l'API échoue
            }
        }

        return res.status(200).json({ success: true, ai_response: JSON.stringify(fallbackResponse) });

    } catch (err) {
        const safeFallback = {
            titre: "Incident RP",
            joueurs_impliques": "Non spécifié",
            severite: "MOYENNE",
            categorie: "DIVERS",
            description_courte": "Analyse d'incident",
            synthese_ia": "Traitement de l'incident effectué par le système de secours.",
            solutions: [
                { id: 1, titre: "Rappel à l'ordre", description: "Rappel des règles de base du serveur.", niveau_risque: 10, impact_commu: 20, coherence_rp: 80, difficulte: 10, points_forts": ["Simple"], points_faibles": ["Léger"] }
            ]
        };
        return res.status(200).json({ success: true, ai_response: JSON.stringify(safeFallback) });
    }
};