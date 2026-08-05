const { GoogleGenerativeAI } = require('@google/generative-ai');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Méthode non autorisée' });
    }

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ 
                success: false, 
                error: "La clé GEMINI_API_KEY est manquante sur Vercel." 
            });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        
        // Utilisation du modèle stable gemini-1.5-flash
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        let issueDescription = "";
        if (typeof req.body === 'string') {
            try { issueDescription = JSON.parse(req.body).description; } catch(e) { issueDescription = req.body; }
        } else if (req.body && req.body.description) {
            issueDescription = req.body.description;
        }

        if (!issueDescription) {
            return res.status(400).json({ success: false, error: "Aucune description fournie." });
        }

        const promptSysteme = `Tu es un administrateur expert sur GTA V RP (FiveM). 
Analyse le problème fourni.

Renvoie STRICTEMENT un objet JSON valide suivant cette structure exacte :
{
  "titre": "Titre du cas",
  "joueurs_impliques": "JOHNDOE, MIKESMITH",
  "severite": "HAUTE",
  "categorie": "CONFLIT JOUEURS",
  "description_courte": "Résumé du problème initial",
  "synthese_ia": "Analyse synthétique globale et factuelle de la situation.",
  "solutions": [
    {
      "id": 1,
      "titre": "Médiation directe entre les deux joueurs",
      "description": "Explication détaillée de la solution...",
      "niveau_risque": 20,
      "impact_commu": 40,
      "coherence_rp": 80,
      "difficulte": 30,
      "points_forts": ["Avantage 1", "Avantage 2"],
      "points_faibles": ["Risque 1"]
    },
    {
      "id": 2,
      "titre": "Analyse des preuves et clips vidéo",
      "description": "Explication détaillée de la solution 2...",
      "niveau_risque": 25,
      "impact_commu": 55,
      "coherence_rp": 85,
      "difficulte": 50,
      "points_forts": ["Avantage 1"],
      "points_faibles": ["Inconvénient 1"]
    },
    {
      "id": 3,
      "titre": "Sanction temporaire avec avertissement RP",
      "description": "Explication détaillée de la solution 3...",
      "niveau_risque": 45,
      "impact_commu": 60,
      "coherence_rp": 70,
      "difficulte": 40,
      "points_forts": ["Avantage 1"],
      "points_faibles": ["Inconvénient 1"]
    },
    {
      "id": 4,
      "titre": "Sanction ferme et exemplaire immédiate",
      "description": "Explication détaillée de la solution 4...",
      "niveau_risque": 75,
      "impact_commu": 75,
      "coherence_rp": 90,
      "difficulte": 60,
      "points_forts": ["Avantage 1"],
      "points_faibles": ["Inconvénient 1"]
    }
  ]
}
Génère toujours 4 solutions distinctes. Les pourcentages doivent être entre 0 et 100.`;

        const result = await model.generateContent([promptSysteme, "Problème soumis : " + issueDescription]);
        const responseText = result.response.text();
        
        return res.status(200).json({ success: true, ai_response: responseText });

    } catch (error) {
        console.error("Erreur Backend IA:", error);
        return res.status(500).json({ 
            success: false, 
            error: error.message || "Erreur interne du serveur d'analyse." 
        });
    }
};