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

const CLASS_NAMES = ['MEL', 'NV', 'BCC', 'AKIEC', 'BKL', 'DF', 'VASC', 'OTHER'];
// ['MEL', 'NV', 'BCC', 'AKIEC', 'BKL', 'DF', 'VASC', 'OTHER']
async function fetchResults(inferenceId) {
    const response = await fetch(BASE_URL + `/result/${inferenceId}`);
    const result = await response.json();

    const probabilities = result.probabilities;
    const sortedProbabilities = [...probabilities].map((prob, index) => ({ prob, index }))
        .sort((a, b) => b.prob - a.prob)
        .slice(0, 3);


    let topResults = sortedProbabilities.map(item => ({
        className: CLASS_NAMES[item.index],
        probability: (item.prob * 100).toFixed(0)
    }));

    //const maxProbability = Math.max(...result.probabilities);
    //const maxProbabilityPercent = (maxProbability * 100).toFixed(0);

    let result_multiclass = getClassLabel(result.predicted_multiclass);
    let result_binary = "";
    if(result.predicted_binary = 0) {
        result_binary = "Benign"
    } else if(result.predicted_binary = 1) {
        result_binary = "Malignant"
    } else {
        result_binary = "Classe sconosciuta"
    }

    /*
    let htmlContent = `
        <h2>Risultati</h2>
        <p>Risultato multiclasse: ${result_multiclass}</p>
        <p>Probabilità: ${maxProbabilityPercent}%</p>
    `;
    */
    let htmlContent = `
        <h2>Risultati</h2>
        <p>Probabilità dei 3 risultati principali:</p>
        <ul style="list-style-position: inside; display: inline-block; text-align: left;">
    `;
    topResults.forEach(result => {
        htmlContent += `<li>${result.className}: ${result.probability}%</li>`;
    });
    htmlContent += `</ul>`;
    if (result.predicted_multiclass !== 7) {
        htmlContent += `<p>Risultato binario: ${result_binary}</p>`;
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