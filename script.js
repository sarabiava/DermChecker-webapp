document.addEventListener("DOMContentLoaded", function() {
    console.log("La web app è stata caricata correttamente!");
});

document.getElementById('file-input').addEventListener('change', function(event) {
    displayUploadedImage(event.target.files[0]);

    document.getElementById('error-message').style.display = 'none';
    document.getElementById('analyze-button').style.display = 'block';

    // Svuota i risultati
    clearResults();
});

const BASE_URL = 'https://ie4ole2vxvfphgbu4nhycgpaly0ylrrp.lambda-url.eu-north-1.on.aws'

async function analyzeImage() {

    clearResults();

    const fileField = document.querySelector('input[type="file"]');
    
    // Controlla se un file è stato selezionato
    if (fileField.files.length === 0) {
        document.getElementById('error-message').style.display = 'block';
        return;
    }
    document.getElementById('error-message').style.display = 'none';

    document.getElementById('loading').style.display = 'block';

    const formData = new FormData();
    formData.append('file', fileField.files[0]);

    const response = await fetch(BASE_URL + '/analyze', {
        method: 'POST',
        body: formData
    });

    const result = await response.json();
    const inferenceId = result.inference_id;
    console.log("Inference ID:", inferenceId);

    // Fetch and display results immediately after analysis
    fetchResults(inferenceId);

    // Display the uploaded image
    displayUploadedImage(fileField.files[0]);
}

// ['MEL', 'NV', 'BCC', 'AKIEC', 'BKL', 'DF', 'VASC', 'OTHER']
async function fetchResults(inferenceId) {
    const response = await fetch(BASE_URL + `/result/${inferenceId}`);
    const result = await response.json();

    if (!result.probabilities_multi) {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('results').innerHTML = '<p>Risultati non disponibili al momento. Riprova più tardi.</p>';
        return;
    }

    const probabilitiesMulti = result.probabilities_multi.map(parseFloat);
    const sortedProbabilitiesMulti = probabilitiesMulti.map((prob, index) => ({ prob, index }))
        .sort((a, b) => b.prob - a.prob)
        .slice(0, 3)
        .filter(item => item.prob > 0);

    let topResults = sortedProbabilitiesMulti.map(item => ({
        className: getClassLabel(item.index),
        probability: (item.prob * 100).toFixed(0)
    }));
    /*
    const probabilities = result.probabilities;
    const sortedProbabilities = [...probabilities].map((prob, index) => ({ prob, index }))
        .sort((a, b) => b.prob - a.prob)
        .slice(0, 3)
        .filter(item => item.prob > 0);

    let topResults = sortedProbabilities.map(item => ({
        className: getClassLabel(item.index),
        probability: (item.prob * 100).toFixed(0)
    }));
    */

    const probabilitiesBinary = result.probabilities_binary.map(parseFloat);
    const maxBinaryProb = Math.max(...probabilitiesBinary);
    let result_binary = "";
    if (result.predicted_binary === 0) {
        result_binary = "La lesione risulta essere classificata come <strong>benigna</strong>";
    } else if (result.predicted_binary === 1) {
        result_binary = "La lesione risulta essere classificata come <strong>maligna</strong>";
    } else {
        result_binary = "Classe sconosciuta";
    }

    /*
    let result_binary = "";
    if(result.predicted_binary === 0) {
        result_binary = "La lesione risulta essere classificata come <strong>benigna</strong>."
    } else if(result.predicted_binary === 1) {
        result_binary = "La lesione risulta essere classificata come <strong>maligna</strong>."
    } else {
        result_binary = "Classe sconosciuta"
    }
    */

    let htmlContent = `
        <h2>Risultato dell'analisi</h2>
        <p>L'analisi dell'immagine ha ottenuto come risultati più probabili:</p>
        <ul>
    `;
    topResults.forEach(result => {
        htmlContent += `<li><strong>${result.className}</strong>: ${result.probability}%</li>`;
    });
    htmlContent += `</ul>`;
    if (result.predicted_multiclass !== 7) {
        htmlContent += `<p>${result_binary} al ${(maxBinaryProb * 100).toFixed(0)}%.</p>`;
    }

    document.getElementById('loading').style.display = 'none';

    // Mostra i risultati
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = htmlContent;
}

// Funzione per ottenere il nome della classe predetta
function getClassLabel(prediction) {
    const classLabels = [
        "Melanoma",
        "Neo",
        "Carcinoma Basocellulare",
        "Cheratosi attinica",
        "Cheratosi benigna",
        "Dermatofibroma",
        "Lesione vascolare",
        "Altro"
    ];

    if (prediction >= 0 && prediction < classLabels.length) {
        return classLabels[prediction];
    } else {
        return "Classe sconosciuta";
    }
}

function displayUploadedImage(file) {
    const reader = new FileReader();

    reader.onload = function(event) {
        const imgElement = document.getElementById('uploaded-image');
        imgElement.src = event.target.result;
        imgElement.style.display = 'block';
    };

    reader.readAsDataURL(file);
}

function clearResults() {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = '';
}