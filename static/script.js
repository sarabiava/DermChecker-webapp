document.addEventListener("DOMContentLoaded", function() {
    console.log("La web app è stata caricata correttamente!");
});

document.getElementById('file-input').addEventListener('change', function(event) {
    displayUploadedImage(event.target.files[0]);
});

async function analyzeImage() {
    const formData = new FormData();
    const fileField = document.querySelector('input[type="file"]');
    formData.append('file', fileField.files[0]);

    const response = await fetch('http://localhost:8000/analyze', {
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
    const response = await fetch(`http://localhost:8000/result/${inferenceId}`);
    const result = await response.json();

    const maxProbability = Math.max(...result.probabilities);
    const maxProbabilityPercent = (maxProbability * 100).toFixed(0);

    let result_multiclass = getClassLabel(result.predicted_multiclass);
    let result_binary = "";
    if(result.predicted_binary = 0) {
        result_binary = "Benign"
    } else if(result.predicted_binary = 1) {
        result_binary = "Malignant"
    } else {
        result_binary = "Classe sconosciuta"
    }

    let htmlContent = `
        <h2>Risultati</h2>
        <p>Risultato multiclasse: ${result_multiclass}</p>
        <p>Probabilità: ${maxProbabilityPercent}%</p>
    `;
    if (result.predicted_multiclass !== 7) {
        htmlContent += `<p>Risultato binario: ${result_binary}</p>`;
    }

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

/*
async function analyzeImage() {
    const formData = new FormData();
    const fileField = document.querySelector('input[type="file"]');
    formData.append('file', fileField.files[0]);

    const response = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        body: formData
    });

    const result = await response.json();
    const inferenceId = result.inference_id;
    console.log("Inference ID:", inferenceId);

    // Redirect to result page with the inference ID
    window.location.href = `http://localhost:8000/result/${inferenceId}`;
}

async function uploadImage() {
    const input = document.getElementById('file-input');
    const file = input.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('http://localhost:8000/analyze', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        const inferenceId = data.inference_id;

        const fetchResult = async () => {
            try {
                const resultResponse = await fetch(`http://localhost:8000/result/${inferenceId}`);
                const resultData = await resultResponse.json();
                

                if (resultData.predicted_class !== undefined) {
                    document.getElementById('result-multiclass').innerText = `Predicted Multiclass: ${resultData.predicted_multiclass}`;
                    document.getElementById('result-probabilities').innerText = `Probabilities: ${resultData.probabilities.join(', ')}`;
                    document.getElementById('result-binary').innerText = `Predicted Binary: ${resultData.predicted_binary}`;
                } else {
                    // Result not ready yet, continue polling
                    setTimeout(fetchResult, 1000);
                }
            } catch (error) {
                console.error('Error fetching result:', error);
            }
        };

        fetchResult();

    } catch (error) {
        console.error('Error:', error);
    }
}
*/