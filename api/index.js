require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GoogleAIFileManager } = require('@google/generative-ai/server');
const fs = require('fs');

const app = express();

// Sur Vercel, seul le répertoire /tmp est inscriptible
const upload = multer({ dest: '/tmp/' });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);

app.use(express.json());

const promptSysteme = `Tu es un administrateur expert sur GTA V RP (FiveM). 
Analyse la description et/ou la vidéo fournie. 
1. Fais un bref résumé factuel de la scène et des fautes RP commises.
2. Propose les 3 meilleures décisions possibles.
Renvoie STRICTEMENT le résultat au format JSON, selon cette structure exacte :
{
  "resume": "Résumé de la scène...",
  "solutions": [
    {
      "titre": "Titre",
      "severite": "soft", 
      "stats": {
        "recidive": 35,
        "acceptation": 6,
        "retention": "Positif"
      },
      "points_forts": ["Point fort 1"],
      "points_faibles": ["Point faible 1"]
    }
  ]
}
Notes sur la severite : 'soft', 'moderate', ou 'strict'.`;

app.post('/api/analyze', upload.single('video'), async (req, res) => {
    try {
        const issueDescription = req.body.description;
        let promptParts = [promptSysteme, "Description du problème : " + issueDescription];

        // Gestion du fichier vidéo si présent
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
        
        // Nettoyage de /tmp
        if (req.file) fs.unlinkSync(req.file.path);
        
        res.json({ success: true, ai_response: responseText });
    } catch (error) {
        console.error("Erreur Backend IA:", error);
        res.status(500).json({ success: false, error: "Erreur lors de l'analyse IA." });
    }
});

// Obligatoire pour Vercel (Export de l'application)
module.exports = app;
