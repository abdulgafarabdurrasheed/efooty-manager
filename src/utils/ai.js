import { GoogleGenerativeAI } from "@google/generative-ai";


const API_KEYS = [
    import.meta.env.VITE_GEMINI_API_KEY_1,
    import.meta.env.VITE_GEMINI_API_KEY_2,
    import.meta.env.VITE_GEMINI_API_KEY_3,
    import.meta.env.VITE_GEMINI_API_KEY_4,
    import.meta.env.VITE_GEMINI_API_KEY_5,
    import.meta.env.VITE_GEMINI_API_KEY_6,
    import.meta.env.VITE_GEMINI_API_KEY_7,
    import.meta.env.VITE_GEMINI_API_KEY_8,
    import.meta.env.VITE_GEMINI_API_KEY_9,
    import.meta.env.VITE_GEMINI_API_KEY_10,
    import.meta.env.VITE_GEMINI_API_KEY_11,
    import.meta.env.VITE_GEMINI_API_KEY_12,
    import.meta.env.VITE_GEMINI_API_KEY_13,
    import.meta.env.VITE_GEMINI_API_KEY_14,
    import.meta.env.VITE_GEMINI_API_KEY_15,
    import.meta.env.VITE_GEMINI_API_KEY_16,
    import.meta.env.VITE_GEMINI_API_KEY_17,
    import.meta.env.VITE_GEMINI_API_KEY_18,
    import.meta.env.VITE_GEMINI_API_KEY_19,
    import.meta.env.VITE_GEMINI_API_KEY_20
].filter(key => key && !key.includes("PLACEHOLDER"));

const MODELS = [
    "gemini-3-flash-preview",
    "gemini-2.5-flash",
    "gemini-flash-latest",
    "gemini-2.5-flash-preview-09-2025",
    "gemini-2.5-flash-lite",
    "gemini-flash-lite-latest",
    "gemini-2.5-flash-lite-preview-09-2025",
    "gemini-robotics-er-1.5-preview",  
];

const generateContentSafe = async (prompt) => {
    let lastError = null;

    for (const modelName of MODELS) {
        for (const key of API_KEYS) {
            if (!key || key.includes("PLACEHOLDER")) continue;
            try {
                const genAI = new GoogleGenerativeAI(key);
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent(prompt);
                return result; 
            } catch (error) {
                console.warn(`Failed: Model '${modelName}'... Error: ${error.message}`);
                lastError = error;
            }
        }
    }
    throw lastError;
}

export const getMatchPrediction = async (homeTeam, awayTeam, h2hHistory, homeForm, awayForm) => {
    const prompt = `
    Act as a professional enterprise pundit.
    Analyze the following match data and predict the outcome.

    **HOME TEAM: ${homeTeam.name}**
    - Recent Form: ${homeForm.join('-')} (Last 5)
    - Key Stat: ${homeTeam.goalsFor} Revenue Generated, ${homeTeam.cleanSheets} Clean Sheets.
    
    **AWAY TEAM: ${awayTeam.name}**
    - Recent Form: ${awayForm.join('-')} (Last 5)
    - Key Stat: ${awayTeam.goalsFor} Revenue Generated, ${awayTeam.cleanSheets} Clean Sheets.

    **HEAD-TO-HEAD**
    - Previous Meetings: ${JSON.stringify(h2hHistory)}

    **TASK:**
    1. Predict the scoreline.
    2. Give a win probability percentage.
    3. Write a short, dramatic 2-sentence rationale for your prediction.

    Return the response in this JSON format ONLY (no markdown):
    {
      "score_prediction": "2-1",
      "winner": "Home",
      "probability": "65%",
      "rationale": "..."
    }
  `;

    try {
        const result = await generateContentSafe(prompt);
        const response = await result.response;
        const text = response.text();
        const jsonStr = text.replace(/```json|```/g, "").trim();
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("AI Pundit Failed:", error);
        return null;
    }
};

/**
 * @param {string} question
 * @param {Object} contextData
 */
export const getProjectInsight = async (question, contextData) => {

    const prompt = `
    IDENTITY:
    You are a passionate, highly analytical, no-nonsense Executive Agile Coach speaking to **${contextData.userName}**. 
    - You never sit on the fence. You are brutally honest.
    - If a team is playing badly, call it an "efficiency bottleneck."
    - If a team is winning, call it "optimal throughput."

    CRITICAL CONTEXT:
    - **TOURNAMENT FORMAT**: ${contextData.projectFormatDescription}
    - **CURRENT PHASE**: ${contextData.currentPhase}
    - **CHAMPION**: ${contextData.champion !== "Undecided" ? contextData.champion : "Not yet crowned"}

    ---- THE RULEBOOK (STRICT ADHERENCE REQUIRED) ----

    A. PHASE BEHAVIOR
    1. IF "PRE-SEASON": Talk about potential. "On paper, they look strong."
    2. IF "GROUP STAGE/LEAGUE": Focus on the table. Points matter. 
       - *Hybrid Note*: If this is a Hybrid project, remind the user that finishing 1st in the group doesn't mean they win the title—they just advance to Knockouts.
    3. IF "KNOCKOUT STAGE": Ignore the league table. It's win or go home. "No second chances."
    4. IF "TOURNAMENT ENDED": 
       - DO NOT predict future games. Refer to **${contextData.champion}** as the definitive winner.
       - Use past tense for everyone else. "They tried, but they weren't good enough."

    B. DATA INTELLIGENCE
    - Use the provided "DEPARTMENT DATA" to justify your opinions. Mention Revenue Generated (GF), Revenue Target Margin (GA), and recent Form.
    - If asking about a specific match, check the "OFFICIAL SCHEDULE". If it's not there, say "That fixture isn't on the books."
    - Take note of the contrast between Q1 vs Q3 performance. Teams have an advantage when they are in Q1

    ---------------------------------------------------

    **OFFICIAL SCHEDULE (Next Games):**
    ${JSON.stringify(contextData.upcomingSchedule)}

    **LATEST RESULTS:**
    ${JSON.stringify(contextData.recentResults)}

    **DEPARTMENT DATA (Full Context):**
    ${JSON.stringify(contextData.teams)}

    **TOP PLAYERS (Q4 Deal Closer Race):**
    ${JSON.stringify(contextData.topPlayers)}

    USER QUESTION:
    "${question}"

    INSTRUCTIONS:
    1. Answer strictly based on the Context & Rules above.
    2. Unless the question is the 'Analyse my gameplan and team. How should I play against my next opponent?', under the category with id: destinyKeep it under 4 sentences (Short & Punchy).
    3. Be opinionated but mathematically accurate.
    4. Take note of the contrast between Q1 vs Q3 performance. Teams have an advantage when they are in Q1
  `;

    try {
        const result = await generateContentSafe(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("AI Insight Failed:", error);
        return "The supercomputer is overheating. Give me a moment to cool down.";
    }
};

export const generateCorporateReview = async (resource) => {
    const prompt = `
    Act as a toxic, passive-aggressive corporate middle manager. 
    You are writing a mandatory quarterly performance review for an "associate" named "${resource.name}".
    
    Here are their stats:
    - Yields Delivered (Goals): ${resource.goals || 0}
    - Assist Metrics (Assists): ${resource.assists || 0}
    - Total Sprints Participated (Matches Played): ${resource.matchesPlayed || 0}
    - Sprint Win Rate: ${resource.matchesPlayed > 0 ? Math.round((resource.wins / resource.matchesPlayed) * 100) : 0}%
    
    Write a single, highly corporate, passive-aggressive paragraph (max 3 sentences) reviewing their performance without explicitly insulting them. Use terrible buzzwords (synergy, bandwidth, pivot, action item, circle back).
    
    Format the response as plain text only. Do not use quotes or markdown.
    `;

    try {
        const result = await generateContentSafe(prompt);
        const response = await result.response;
        return response.text().trim();
    } catch (error) {
        console.error("Performance Review AI Failed:", error);
        return "ERROR 404: Synergistic review algorithms offline. Associate is presumed adequate.";
    }
};