import { GoogleGenAI } from "@google/genai";
// base 
class Gemini {
    constructor (model) {
        this.API_GAMINI = 'hahahahahahah';
        this.model = model || "gemini-2.5-flash";
        this.context = null; // [{role:'user', content:"hello"}]
    }

    async textCommunication(userMessage) {
        const llm  = new GoogleGenAI({ apiKey: this.API_GAMINI })
        const stream = await llm.models.generateContentStream({ 
            model: this.model, 
            contents: userMessage
        });

        for await (const chunk of stream) {
            process.stdout.write(chunk.text); 
        };
    }

   async nanoBanan() {

    }

}

const ai = new Gemini()

ai.textCommunication("ola! , me conta um hsitoria divertida.");