require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GoogleAIFileManager } = require('@google/generative-ai/server');
const fs = require('fs');

const app = express();
const upload = multer({ dest: '/tmp/' });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);

app.use(express.json());

const promptSysteme = `Tu es un administrateur expert sur GTA V RP (FiveM). 
Analyse le problème et/ou la vidéo fournie. 

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

app.post('/api/analyze', upload.single('video'), async (req, res) => {
    try {
        const issueDescription = req.body.description;
        let promptParts = [promptSysteme, "Problème soumis : " + issueDescription];

        if (req.file) {
            const uploadResult = await fileManager.uploadFile(req.file.path, {
                mimeType: req.file.mimetype,
                displayName: req.file.originalname,
            });
            promptParts.push({
                fileData: {
                    mimeType: uploadResult.file.mimeType,
                    fileUri: uploadResult.file.uri
                }
            });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(promptParts);
        const responseText = result.response.text();
        
        if (req.file) fs.unlinkSync(req.file.path);
        
        res.json({ success: true, ai_response: responseText });
    } catch (error) {
        console.error("Erreur Backend IA:", error);
        res.status(500).json({ success: false, error: "Erreur lors de l'analyse IA." });
    }
});

module.exports = app;