/**
 * Submits a POST request to the Meshy API to start a new 3D model generation task.
 * @param {string} apiKey - Your Meshy API key.
 * @param {string} prompt - The text prompt for generating the model.
 * @returns {Promise<string>} A promise that resolves with the task ID.
 * @throws {Error} If the API request fails.
 */
async function generateMeshyModel(apiKey, prompt) {
    if (!apiKey || apiKey === 'YOUR_MESHY_API_KEY') {
        throw new Error('API key is missing or invalid. Please provide a valid key.');
    }
    
    if (!prompt) {
        throw new Error('Prompt is missing. Please provide a text prompt for model generation.');
    }

    const apiUrl = 'https://api.meshy.ai/v2/text-to-3d';
    
    const requestBody = {
        mode: "preview",
        prompt: prompt,
        art_style: "realistic",
        should_remesh: true,
        enable_pbr: false
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'Failed to create generation task.');
        }

        const taskId = data.result;
        console.log(`Successfully started model generation. Task ID: ${taskId}`);
        return taskId;

    } catch (error) {
        console.error('Error in API request:', error);
        throw error;
    }
}

// Example usage
// Replace 'YOUR_MESHY_API_KEY' with your actual key and 'A low poly monster character' with your desired prompt.
const myApiKey = 'YOUR_MESHY_API_KEY';
const myPrompt = 'A sci-fi spaceship with glowing engines, highly detailed';

// To run this in a Node.js environment, you would call the function like this:
// generateMeshyModel(myApiKey, myPrompt)
//     .then(taskId => {
//         console.log('Model generation task started. Task ID:', taskId);
//     })
//     .catch(error => {
//         console.error('An error occurred:', error.message);
//     });

// You can use the returned taskId to poll the API for the result.
